
describe("Css Bundling:", function() {

    var exec = require('child_process').exec,
      fs = require('fs'),
      testCase = require('./bundler-test-case.js'),
      getTestCase = function(directory, outputDirectory) { 
          return  new testCase.BundlerTestCase(
              directory,
              ".css",
              outputDirectory,
              exec,
              runs,
              waitsFor,
              fs
          );
      },
      runTestCase = function (
          directory,
          outputDirectory,
          logToConsole,
          additionaloptions
      ) {
        var testCase = getTestCase(directory, outputDirectory);

        if (logToConsole) {
            testCase.Console = console;
        }
        testCase.CommandOptions += (additionaloptions || '');

        testCase.RunBundlerAndVerifyOutput();
    };

  it("Concatenates individual css files in a .bundle file into a single minified bundle.", function() {
         runTestCase("combines-individual-css-files");
  });  

  it("Compiles and Concatenates .less files", function() {
      runTestCase("combines-less");
  });

  it("Optionally versions images in the minified file", function () {
      runTestCase("image-versioning-css", null, false, " -rewriteimagefileroot:test-cases/image-versioning-css -rewriteimageoutputroot:combined");
  });

  it("An error is thrown for invalid less.", function () {
      var testCase = getTestCase("invalid-less");
      testCase.VerifyBundle = function () {
          var hasError = testCase.StdError.indexOf("missing closing `}`") >= 0;
          expect(hasError).toBe(true);
      };
      testCase.RunBundlerAndVerifyOutput();
  });

  it("Compiles and Concatenates .less files with css files", function() {
      runTestCase("combines-less-and-css");
  });

  it("Folder option by default minifies, but does not bundle."
    , function() {
        var testCase = getTestCase("default-folder-option-css");
        testCase.SetUpCacheFileTest(false);
        testCase.RunBundlerAndVerifyOutput();
  });
 
  it("The recursive option on a folder searches sub-directories", function () {
      runTestCase("recursive-folder-css");
  });

  it("The directory option allows entire subdirectories to be included", function () {
      runTestCase("directory-source-css");
  });

  it("Folder option will bundle with force bundle option", function () {
      runTestCase("combines-css-folder-with-forcebundle");
  });

  it("If an output directory is specified, then the minified bundle is put in it.", function () {
      runTestCase("output-directory-css", "/folder-output/");
  });

  it("If an output directory is specified, then any computed files are put in it.", function () {
      var testCase = getTestCase("output-directory-css", "/folder-output/");
      testCase.SetUpCacheFileTest(true, ["file1.min", "file2.min"]);
      testCase.RunBundlerAndVerifyOutput();
  });

  it("If an output directory is specified, then the un-minified less files as .css are put in there..", function () {
      var testCase = getTestCase("output-directory-less", "/folder-output/");
      testCase.SetUpCacheFileTest(true, ["less1.min", "less2.min", "less1", "less2"]);
      testCase.RunBundlerAndVerifyOutput();
  });

});
