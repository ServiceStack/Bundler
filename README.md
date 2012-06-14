# Bundler

Bundler is a fast, command-line tool (easily integrated into existing IDEs, inc VS.NET) that statically **compiles**, **minifies** and **combines** your websites **less**, **sass**, **css**, **coffeescript** and **js** files.

  - All bundling is done at **compile time** with a build-step so no dependencies needed at runtime. 
  - Can be used with any website project (ie. not only .NET). Includes a **windows** node.exe although all scripts work cross-platform.
  - Includes a single C# **MvcBundler.cs** class with extension methods to seamlessly integrate it with any **ASP.NET MVC** website.
  - Runs outside the context of your ASP.NET MVC website so client scripts can be re-compiled **without restarting** your C# project.
  - Uses a self-contained **node.exe** for all compilation & minification - designed for maximum runtime and compile time performance.
  - Doesn't use any compiled dlls or .exe's (excl node.exe) and includes source code for everything so can easily be read and extended.

## Extremely fast at both Build and Runtime
Bundler is extremely fast - uses Googles leading V8 JavaScript engine (inside node.exe). All build scripts use only *pure JavaScript* implementations (uglifyjs, coffee-script, clean-css, etc) allowing all compilation and minification to run in a single process. 

#### Async / Non-Blocking
The packager is completely **async and non-blocking** - allowing the processing inside each bundle to happen in parallel. 

#### No Runtime overhead
Designed for maximum runtime performance since no compilation/minification happens at runtime. 
Even the generated HTML output is cached in memory (in production mode) - so has effectively no runtime overhead.

## Install

To run you just need a copy of **/bundler** folder in your website host directory. This can be done by cloning this repo or installing via NuGet:

[![Install-Pacakage ServiceStack.Host.Mvc](http://www.servicestack.net/img/nuget-bundler.png)](https://nuget.org/packages/Bundler)

*Once installed you can optionally exclude the '/bundler' or '/bundler/node_modules' folders from your VS.NET project since they contain a lot of files (not required to be referenced).*

By default bundler looks at **/Content** and **/Scripts** project folders - this can be changed by editing [/bundler/bundler.cmd](https://github.com/ServiceStack/Bundler/blob/master/NuGet/content/bundler/bundler.cmd):

    node bundler.js ../Content ../Scripts

Now you can define .bundle files in any of the above folders.

## How it works

You define css or js **bundles** (in plain text) that specifies the list of files you wish to bundle together. Running **bundler.cmd** (either as a short-cut key or post-build script) will scan through your **/Content** folder finding all defined **.js.bundle** and **.css.bundle** definition files which it goes through, only compiling and minifying new or modified files.  For illustration an example **app.js.bundle** and **app.css.bundle** text files are defined below:

**/Scripts/app.js.bundle**

	js/underscore.js
	js/backbone.js
	js/includes.js
	js/functions.coffee
	js/base.coffee
	bootstrap.js

**/Content/app.css.bundle**
	
	css/reset.css
	css/variables.less
	css/styles.less
	css/sassy.sass
	default.css

Now everytime you run **/bundler/bundler.cmd** it will scan these files, compiling and minifying any new or changed files. 

**Bundle file options**

Options can be specified to alter how your files are processed.  Options must be specified on the first line of the bundle file and the line must start with `#options `.  Options are comma delimited and each option is a key/value pair separated by a colon.  The keys are all converted to lowercase.  You can omit the value for boolean options and options specified without a value are set to true.

    #options nobundle,skipmin
    css/reset.css
    css/variables.less
    default.css

The currently available options are:

1. **nobundle**: compiles and minifies all files listed, however it does not bundle them into a single file.  This allows you to compile and minify your standalone files without bundling them into another file.
2. **skipmin**: skips the minimization step

Tip: For greater productivity integrate it with VS.NET by assiging a keyboard short-cut to **bundler.cmd** or run it as a post-build script so it's easily re-run it when your files have changed.

#### Create an External Tool inside VS.NET:

Allows you to run **Alt T + B** (or assign your own short-cut) to re-compile and minify your changed assets without re-building your project:

![Add External Tool in VS.NET](http://www.servicestack.net/img/external-tools-bundler.png)

#### Run script on post-build event
Alternatively you can run bundler after every successful build. Add the line below to **Properties** > **Build events** > **Post-build event**:

    "$(ProjectDir)bundler\node.exe" "$(ProjectDir)bundler\bundler.js" "$(ProjectDir)Content" "$(ProjectDir)Scripts"
    
![Add Bundler to VS.NET Post-Build event](http://servicestack.net/img/post-build-bundler.png)

### Enable Mvc.Bundler.cs Html helpers inside view pages

To enable MVC Html helper's add **ServiceStack.Mvc** namespace to your views base class by editing your Views/Web.config:

    <system.web.webPages.razor>
    <pages pageBaseType="System.Web.Mvc.WebViewPage">
      <namespaces>
        <add namespace="System.Web.Mvc" />
        <add namespace="System.Web.Mvc.Ajax" />
        <add namespace="System.Web.Mvc.Html" />
        <add namespace="System.Web.Routing" />
        <add namespace="ServiceStack.Mvc" />    <!-- Enable Html Exentions -->
      </namespaces>
    </pages>
    </system.web.webPages.razor>

Once enabled, you can then reference these bundles in your MVC **_Layout.cshtml** or **View.cshtml** pages with the **@Html.RenderCssBundle()** and **@Html.RenderJsBundle()** helpers:

### Bundle Options

The different BundleOptions supported are:

```csharp
public enum BundleOptions
{
    Normal,              // Left as individual files, references pre-compiled .js / .css files
    Minified,            // Left as individual files, references pre-compiled and minified .min.js / .min.css files
    Combined,            // Combined into single unminified app.js / app.css file
    MinifiedAndCombined  // Combined and Minified into a single app.min.js / app.min.css file
}
```  

With the above bundle configurations, the following helpers below:

    @Html.RenderJsBundle("~/Scripts/app.js.bundle", BundleOptions.MinifiedAndCombined)
    @Html.RenderCssBundle("~/Content/app.css.bundle", BundleOptions.Minified)

Will generate the following HTML:
    
    <script src="/Scripts/app.min.js?b578fa" type="text/javascript"></script>

    <link href="/Content/css/reset.min.css?b578fa" rel="stylesheet" />
    <link href="/Content/css/variables.min.css?b578fa" rel="stylesheet" />
    <link href="/Content/css/styles.min.css?b578fa" rel="stylesheet" />
    <link href="/Content/css/sassy.min.css?b578fa" rel="stylesheet" />
    <link href="/Content/default.min.css?b578fa" rel="stylesheet" />

Note: the **?b578fa** suffix are *cache-breakers* added to each file, so any changes invalidates local brower caches - important if you end up hosting your static assets on a CDN.

You can rewrite the generated urls (e.g. to use a CDN instead) by injecting your own [Bundler.DefaultUrlFilter](https://github.com/ServiceStack/Bundler/blob/master/NuGet/content/Mvc.Bundler.cs#L24).

## Bundler Run on Save Visual Studio Extension

The Bundler Run on Save extension executes bundler if it is included in the project folder when you save any file in the project with an allowed extension.  The file extensions which trigger this are: .less, .css, .sass, .js, .coffee and .bundle.  If you install bundler from the nuget package, this should extension should work just fine.  The bundler directory does not have to be in the project, it just has to exist in the same folder as the project file.  When the extension runs bundler, you can see the output in a new Bundler pane of the Output window.