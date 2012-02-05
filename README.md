# Bundler

Bundler statically compiles, minifies, combines and adds 'cache-breakers' to your websites CSS, Less, CoffeeScript or JavaScript assets. 

  - All bundling is done at **compile time** with a build-step so no dependencies needed at runtime. 
  - Includes a single C# **MvcBundler.cs** class with exension methods to easily integrate it with an existing MVC website.

All build scripts are in plain text, doesn't rely on any compiled dlls or .exe's (apart from node.exe) so can be easily debugged and customized to suit your needs. 

## Fast at Runtime and Build time
The build scripts use only pure 'js' implementations (uglifyjs, clean-css, coffee-script, etc) allowing all compilation and minification to happen within a single process.

Bundler is designed for maximum runtime performance since no compilation/minification happens at runtime. 
Even the generated HTML output is cached in memory (in production mode) - so it has almost **no runtime overhead**.

## How it works

You define css or js **bundles** (in plain text) that specifies the list of files you wish to bundle together. Running **bundler.cmd** (either as a short-cut key or post-build script) will scan through your **/Content** folder finding all defined **.js.bundle** and **.css.bundle** definition files which it goes through, only compiling and minifying new or modified files.

## Install

To run you just need a copy of the **/bundler** folder in your website host directory. You can do this by cloning this repo or installing via NuGet:

[![Install-Pacakage ServiceStack.Host.Mvc](http://www.servicestack.net/img/nuget-bundler.png)](https://nuget.org/packages/Bundler)

*One installed you can optionally exclude the '/bundler' or '/bundler/node_modules' folders from your VS.NET project since they contain a lot of files (not required to be referenced).*

To get started, define bundles in your /Content directory. For illustration an Example 'app.js.bundle' and 'app.css.bundle' text files are defined below:

**/Content/app.js.bundle**

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
	default.css

Now everytime you run **/bundler/bundler.cmd** it will scan these files, compiling and minifying any new or changed files. 

Tip: Give **bundler.cmd** a keyboard short-cut or run it as a post-build script so you can easily re-run it when your files have changed.

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

    @Html.RenderCssBundle("~/Content/app.css.bundle", BundleOptions.Minified)
    @Html.RenderJsBundle("~/Content/app.js.bundle", BundleOptions.MinifiedAndCombined)

Will generate the following HTML:

    <link href="/Content/css/reset.min.css?b578fa" rel="stylesheet" />
    <link href="/Content/css/variables.min.css?b578fa" rel="stylesheet" />
    <link href="/Content/css/styles.min.css?b578fa" rel="stylesheet" />
    <link href="/Content/default.min.css?b578fa" rel="stylesheet" />
    
    <script src="/Content/app.min.js?b578fa" type="text/javascript"></script>

Note: the '?b578fa' suffix are 'cache-breakers' added to each file, so any changes invalidates local brower caches - important if you end up hosting your static assets on a CDN.

