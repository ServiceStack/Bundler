To enable MVC Html helper's add ServiceStack.Mvc namespace to your views base class by editing your Views/Web.config:

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
  

To get Started, define bundles in your /Content directory. For illustration An Example 'app.js.bundle' and 'app.css.bundle' text files are defined below:

[/Content/app.js.bundle]
js/underscore.js
js/backbone.js
js/includes.js
js/functions.coffee
js/base.coffee
bootstrap.js

[/Content/app.css.bundle]
css/reset.css
css/variables.less
css/styles.less
default.css

Now everytime you run '/bundler/bundler.cmd' it will scan these files, compiling and minifying any new or changed files. 
Tip: Give **bundler.cmd** a keyboard short-cut or run it as a post-build script so you can easily re-run it when your files have changed.

You can then reference these bundles in your MVC _Layout.cshtml or View.cshtml pages with the @Html.RenderCssBundle() and @Html.RenderJsBundle() helpers:

The different BundleOptions supported are:

  public enum BundleOptions
  {
    Normal,              // Left as individual files, references pre-compiled .js / .css files
    Minified,            // Left as individual files, references pre-compiled and minified .min.js / .min.css files
    Combined,            // Combined into single unminified app.js / app.css file
    MinifiedAndCombined  // Combined and Minified into a single app.min.js / app.min.css file
  }

With the above bundle configurations, the following helpers below:

@Html.RenderCssBundle("~/Content/app.css.bundle", BundleOptions.Minified)
@Html.RenderJsBundle("~/Content/app.js.bundle", BundleOptions.MinifiedAndCombined)

will generate the following HTML:

<link href="/Content/css/reset.min.css?b578fa" rel="stylesheet" />
<link href="/Content/css/variables.min.css?b578fa" rel="stylesheet" />
<link href="/Content/css/styles.min.css?b578fa" rel="stylesheet" />
<link href="/Content/default.min.css?b578fa" rel="stylesheet" />

<script src="/Content/app.min.js?b578fa" type="text/javascript"></script>


