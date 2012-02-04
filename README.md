# Bundler

Bundler statically compiles, minifies, combines and adds 'cache breakers' to your websites CSS, Less, CoffeeScript or JavaScript assets. 

  - All bundling is done at 'compile time' with no dependencies needed at runtime. Requires no outside dependencies outside of the included node.exe and pure javascript npm modules. 
  - Includes a single C# **MvcBundler.cs** class with exension methods to easily integrate it with an existing MVC website.

All build scripts are in plain text, doesn't rely on any compiled dlls or .exe's (apart from node.exe) so it can be easily debugged and customized to suit your environment. 

## How it works

You define css or js **bundles** (in plain text) that specifies the list of files you wish to bundle together. Running **bundler.cmd** (either as a short-cut key or post-build script) will scan through your **/Content** folder finding all defined **.js.bundle** and **.css.bundle** which it goes through, only compiling minifying new or changed files.

