using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using EnvDTE;
using EnvDTE80;
using Microsoft.VisualStudio;
using Microsoft.VisualStudio.Shell;
using Process = System.Diagnostics.Process;

namespace ServiceStack.BundlerRunOnSave
{
    /// <summary>
    /// This is the class that implements the package exposed by this assembly.
    ///
    /// The minimum requirement for a class to be considered a valid package for Visual Studio
    /// is to implement the IVsPackage interface and register itself with the shell.
    /// This package uses the helper classes defined inside the Managed Package Framework (MPF)
    /// to do it: it derives from the Package class that provides the implementation of the 
    /// IVsPackage interface and uses the registration attributes defined in the framework to 
    /// register itself and its components with the shell.
    /// </summary>
    // This attribute tells the PkgDef creation utility (CreatePkgDef.exe) that this class is
    // a package.
    [PackageRegistration(UseManagedResourcesOnly = true)]
    // This attribute is used to register the informations needed to show the this package
    // in the Help/About dialog of Visual Studio.
    [InstalledProductRegistration("#110", "#112", "1.0", IconResourceID = 400)]
    [Guid(GuidList.guidBundlerRunOnSavePkgString)]
    [ProvideAutoLoad(VSConstants.UICONTEXT.SolutionExists_string)]
    public sealed class BundlerRunOnSavePackage : Package
    {
        /// <summary>
        /// Default constructor of the package.
        /// Inside this method you can place any initialization code that does not require 
        /// any Visual Studio service because at this point the package object is created but 
        /// not sited yet inside Visual Studio environment. The place to do all the other 
        /// initialization is the Initialize method.
        /// </summary>
        public BundlerRunOnSavePackage()
        {
            Trace.WriteLine(string.Format(CultureInfo.CurrentCulture, "Entering constructor for: {0}", this.ToString()));
        }

        private SolutionEventsListener _listener;
        private OutputWindowWriter _outputWindow;

        private DTE _dte;
        private DocumentEvents _documentEvents;
        private ProjectItemsEvents _projectItemEvents;

        private static readonly string[] AllowedExtensions = new string[] { ".sass", ".less", ".css", ".coffee", ".js", ".bundle" };

        private IDictionary<string, BundlerProcessInfo> bundlers = new Dictionary<string, BundlerProcessInfo>();

        /////////////////////////////////////////////////////////////////////////////
        // Overriden Package Implementation
        #region Package Members

        /// <summary>
        /// Initialization of the package; this method is called right after the package is sited, so this is the place
        /// where you can put all the initilaization code that rely on services provided by VisualStudio.
        /// </summary>
        protected override void Initialize()
        {
            Trace.WriteLine (string.Format(CultureInfo.CurrentCulture, "Entering Initialize() of: {0}", this.ToString()));
            base.Initialize();

            _outputWindow = new OutputWindowWriter(this, GuidList.guidBundlerRunOnSaveOutputWindowPane, "Bundler");

            _listener = new SolutionEventsListener();
            _listener.OnAfterOpenSolution += SolutionLoaded;
        }

        protected override void Dispose(bool disposing)
        {
            if (_listener != null) _listener.Dispose();
            _listener = null;

            base.Dispose(disposing);
        }
        #endregion


        public void SolutionLoaded()
        {
            _dte = (DTE)GetService(typeof(DTE));
            if (_dte == null)
            {
                Debug.WriteLine("Unable to get the EnvDTE.DTE service.");
                return;
            }

            var events = _dte.Events as Events2;
            if (events == null)
            {
                Debug.WriteLine("Unable to get the Events2.");
                return;
            }

            _documentEvents = events.get_DocumentEvents();
            _documentEvents.DocumentSaved += BundlerSaveOnLoadPackage_DocumentSaved;

            _projectItemEvents = events.ProjectItemsEvents;
            _projectItemEvents.ItemAdded += BundlerSaveOnLoadPackage_ItemAdded;
            _projectItemEvents.ItemRenamed += BundlerSaveOnLoadPackage_ItemRenamed;

            Debug.WriteLine("Solution loaded and listener document event save listener set up.");
        }

        public void BundlerSaveOnLoadPackage_DocumentSaved(Document document)
        {
            RunBundler(document.ProjectItem);
        }

        public void BundlerSaveOnLoadPackage_ItemAdded(ProjectItem projectItem)
        {
            RunBundler(projectItem);
        }

        public void BundlerSaveOnLoadPackage_ItemRenamed(ProjectItem projectItem, string oldFileName)
        {
            RunBundler(projectItem);
        }

        private bool IsAllowedExtension(string filename)
        {
            var extensionIndex = filename.LastIndexOf('.');
            if (extensionIndex < 0) return false;

            var extension = filename.Substring(extensionIndex);
            return AllowedExtensions.Contains(extension);
        }

        private void RunBundler(ProjectItem projectItem)
        {
            if (projectItem == null) return;

            try
            {
                if (projectItem.ContainingProject == null) return;

                // make sure this is a valid bundle file type
                if (!IsAllowedExtension(projectItem.Name)) return;

                // make sure the bundler exists
                var directory = new FileInfo(projectItem.ContainingProject.FileName).Directory;
                var bunderDirectory = directory.GetDirectories("bundler").FirstOrDefault();
                if (bunderDirectory == null) return;

                var bundleCommand = bunderDirectory.GetFiles("bundler.cmd").FirstOrDefault();
                if (bundleCommand == null) return;

                // make sure the files are in the bundler folder
                var fileNames = new List<string>();
                for (short i = 0; i < projectItem.FileCount; i += 1)
                    fileNames.Add(projectItem.FileNames[i]);

                if (fileNames.Any(m => m.StartsWith(bunderDirectory.FullName))) return;

                RunBundler(bundleCommand.FullName);
            }
            catch (Exception e)
            {
                // project item probably doesn't have a document
                Debug.WriteLine(e.Message);
            }
        }

        private void RunBundler(string bundleCommandFullName)
        {
            Debug.WriteLine("Running bundler");

            BundlerProcessInfo bundlerInfo = null;

            lock (bundlers)
            {
                if (!bundlers.ContainsKey(bundleCommandFullName))
                {
                    bundlers.Add(bundleCommandFullName, new BundlerProcessInfo());
                }

                bundlerInfo = bundlers[bundleCommandFullName];
            }

            lock (bundlerInfo)
            {
                if (bundlerInfo.Running)
                {
                    bundlerInfo.Queued = true;
                    return;
                }

                var process = bundlerInfo.Process = new Process();
                process.StartInfo = new ProcessStartInfo
                {
                    WindowStyle = ProcessWindowStyle.Hidden,
                    FileName = bundleCommandFullName,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                };

                process.Exited += (sender, args) =>
                {
                    lock (bundlerInfo)
                    {
                        bundlerInfo.Running = false;
                    }

                    if (bundlerInfo.Queued)
                    {
                        bundlerInfo.Queued = false;
                        RunBundler(bundleCommandFullName);
                    }

                    bundlerInfo.Process = null;
                };

                process.OutputDataReceived += (sender, args) => _outputWindow.WriteLine(args.Data);
                process.ErrorDataReceived += (sender, args) => _outputWindow.WriteLine(args.Data);

                process.Start();
                process.BeginOutputReadLine();
            }
        }

        private class BundlerProcessInfo
        {
            public bool Running { get; set; }
            public bool Queued { get; set; }
            public Process Process { get; set; }
        }
    }
}
