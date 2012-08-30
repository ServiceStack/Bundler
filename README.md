# Bundler

Bundler is a fast, cross-platform, command-line runner (easily integrated into existing IDEs, inc VS.NET) with optimized support for ASP.NET MVC that statically **compiles**, **minifies** and **combines** your websites **less**, **sass**, **css**, **coffeescript** and **js** files.

Bundler uses the popular and well-tested javascript libraries in [node's package manager](http://npmjs.org/) for all minification and compilation. This enables it to generate faster and more up-to-date outputs than any other .NET wrapper solution which either uses old .NET ports of node.js or ruby implementations, or they have to invoke external out-of-process [IronRuby](http://www.ironruby.net/) and  JavaScript processes resulting in slower execution - consuming valuable iteration-time on each dev-cycle.

  - Easy to use! All **.bundle**'s are plain text files which just contain a list of the file names that make up each bundle
  - Includes **VS.NET Integration**! Saving any supported file auto-runs Bundler. Works seamlessly behind-the-scenes while you code
  - Integrates with **ASP.NET MVC**! Includes 1 C# **MvcBundler.cs** class with extension methods to seamlessly integrate with MVC
  - Runs outside the context of your ASP.NET MVC website so client scripts can be re-compiled **without restarting** your C# project
  - Can be used with any website project (not only .NET). Includes a **windows** node.exe although all scripts work cross-platform
  - All bundling done at **compile time**, by running the single `bundler.cmd` command - no dependencies needed at runtime
  - Uses a self-contained **node.exe** for all compilation & minification - designed for maximum runtime and compile time performance
  - All node.js `.js` and MVC C# `.cs` src files used are in plain-text - so can be easily be followed, extended or customized

## Extremely fast at both Build and Runtime
Bundler is extremely fast - uses Googles leading V8 JavaScript engine (inside node.exe). All build scripts use only *pure JavaScript* implementations (uglifyjs, coffee-script, clean-css, etc) allowing all compilation and minification to run in a single process.

#### Async / Non-Blocking
The packager is completely **async and non-blocking** - allowing the processing inside each bundle to happen in parallel.

#### No Runtime overhead
Designed for maximum runtime performance since no compilation/minification happens at runtime.
Even the generated HTML output is cached in memory (in production mode) - so has effectively no runtime overhead.

#### Cuts build-time in 1/2
After moving to Bundler for all their compilation and minification, [StackOverflow Careers](http://careers.stackoverflow.com/) have reduced their total build times by more than **1/2**! YMMV but if your current .NET-based Compilation/Optimization build-system is slowing you down - definitely tryout Bundler.

#### Pre-configured Single Page App Starter Template
Checkout [Social Bootstrap Api](https://github.com/ServiceStack/SocialBootstrapApi) for a great starting template to base your next Single Page App on.
Includes [Twitter Bootstrap](http://twitter.github.com/bootstrap/) + [Backbone.js](http://backbonejs.org/) + ASP.NET MVC + [ServiceStack](https://github.com/ServiceStack/ServiceStack) with Bundler all wired-up with **Twitter** + **Facebook** + HTML Form + Basic and Digest Auth providers ready-to-go out-of-the-box.


## Release Notes

### v1.10 Release Notes
This release is thanks to the hard work of [@fody](https://twitter.com/fody) who implemented both the [VS.NET Extension](https://github.com/ServiceStack/Bundler#bundler-run-on-save-visual-studio-extension) and [advanced bundling options](https://github.com/ServiceStack/Bundler#advanced-options).

  - Added VS.NET the Bundler Integration via [Bundler's VS.NET Extension](https://github.com/ServiceStack/Bundler#bundler-run-on-save-visual-studio-extension)
  - Added [advanced bundling options](https://github.com/ServiceStack/Bundler#advanced-options) for finer-grain control
    - Lets you skip bundling or minification steps
    - Lets you recursively compile and minify all files in current and sub-directories without having to list them

## Community Resources

  - [Using ServiceStack Bundler](http://antonkallenberg.com/2012/07/26/using-servicestack-bundler/) - Fantastic step-by-step guide to enable Bundler in MVC.

## Install

To run you just need a copy of **/bundler** folder in your website host directory. This can be done by cloning this repo or installing via NuGet:

[![Install-Pacakage ServiceStack.Host.Mvc](http://www.servicestack.net/img/nuget-bundler.png)](https://nuget.org/packages/Bundler)

*Once installed you can optionally exclude the '/bundler' or '/bundler/node_modules' folders from your VS.NET project since they contain a lot of files (not required to be referenced).*

By default bundler looks at **/Content** and **/Scripts** project folders - this can be changed by editing [/bundler/bundler.cmd](https://github.com/ServiceStack/Bundler/blob/master/NuGet/content/bundler/bundler.cmd):

    node bundler.js ../Content ../Scripts

Now you can define .bundle files in any of the above folders.

## Setup a Bundler runner

You basically want to run Bundler when a file your website references has changed, so you can see those changes before your next page refresh.
Although `bundler.cmd` is just a simple command-line script, there are a few different ways you can run it during development (in order of most productive):

  1. Automatically on save of a .less, .css, .sass, .js, .coffee and .bundle (after the 2010 VS.NET Extension is installed)
  2. Add an **External Tool** in VS.NET that runs `bundler.cmd`. Optionally assign a short-cut so you can run with 1 key-stroke
  3. Add a Post-Build event to your project to automatically run it at the end of every build

**Reminder:** If you don't check-in compiled or .min files you should also get your CI build agents run `bundler.cmd` after each build.

### Installing the Run on Save VS.NET 2010 Extension

If you have VS.NET 2010 you should also double-click the `bundler\vs2010-extension\BundlerRunOnSave.vsix` package to install Bundler's VS.NET extension which will automatically runs bundler when any .less, .css, .sass, .js, .coffee and .bundle file is saved.

![Bundler VS.NET Extension installer](http://www.servicestack.net/files/BundlerRunOnSave.png)

*Note: You should reboot VS.NET for the changes to take effect*

Once installed the **BundlerRunOnSave.vsix** VS.NET extension runs bundler when you save any file in the project with any of the supported extensions .less, .css, .sass, .js, .coffee and .bundle.

### Create an External Tool inside VS.NET:

Allows you to run **Alt T + B** (or assign your own short-cut) to re-compile and minify your changed assets without re-building your project:

![Add External Tool in VS.NET](http://www.servicestack.net/img/external-tools-bundler.png)

### Run script on post-build event
Alternatively you can run bundler after every successful build. Add the line below to **Properties** > **Build events** > **Post-build event**:

    "$(ProjectDir)bundler\node.exe" "$(ProjectDir)bundler\bundler.js" "$(ProjectDir)Content" "$(ProjectDir)Scripts"

![Add Bundler to VS.NET Post-Build event](http://servicestack.net/img/post-build-bundler.png)

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

## Enable Mvc.Bundler.cs Html helpers inside view pages

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

## Bundle Options

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

## Advanced Options

### Bundle file options

Advanced options can be specified that changes how .bundle's are processed. You can specify bundler options following these rules:

  - Options must be specified on the **first line** of the `.bundle` file, starting with `#options `.
  - Options are comma-delimited. Each option is a key/value pair separated by a colon. Keys are case-insensitive.
  - You can omit the value for boolean options - specified options without a value are set to true.

#### Example file with options

    #options nobundle,skipmin
    css/reset.css
    css/variables.less
    default.css

The currently available options are:

  - **nobundle** - Compiles and minifies all files listed, however it does not bundle them into a single file. This allows you to compile and minify your standalone files without concatenating them into a bundle.
  - **skipmin** - Skips the minimization step for every file
  - **skipremin** - Skips the minification step for files that already contain a '.min.' in their filename. This lowers the chance of multiple minification iterations introducing problems.
  - **folder** - Used a trigger to transform all files in the folder with this bundle file. If the `recursive` value is used, a seek will search recursively from this root transforming all files in all folders searched. When the `folder` option is used, the `nobundle` option is automatically set. When the `folder` option is used, listing files in the bundle file does nothing.

Tip: If you just want bundler to transform all the files in your content folder, add a bundle file in the root of the content folder and set its contents to the following:

    #options folder:recursive

## Development

The Bundler VS.NET extension lives in [/src/vs/BundlerRunOnSave](https://github.com/ServiceStack/Bundler/blob/master/src/vs/BundlerRunOnSave) which requires the VS.NET templates provided by the [Visual Studio 2010 SP1 SDK](http://www.microsoft.com/en-us/download/details.aspx?id=21835) in order to open it.

## Contributors
A big thanks to all of Bundler's contributors:

 - [mythz](https://github.com/mythz) (Demis Bellot)
 - [nicklarsen](https://github.com/NickLarsen) (Nick Larsen)
 - [duncansmart](https://github.com/duncansmart) (Duncan Smart)
 - [cyberlane](https://github.com/Cyberlane) (Justin Nel)
 - [michael-wolfenden](https://github.com/michael-wolfenden) (Michael Wolfenden)
 - [garjitech](https://github.com/garjitech) (Garrett Wolf)
 - [isochronous](https://github.com/isochronous) (Jeremy McLeod)

