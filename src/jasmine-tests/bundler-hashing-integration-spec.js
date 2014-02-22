
describe("Integration Tests for Bundle Stats Collecting - ", function() {

  var exec = require('child_process').exec,
    fs = require('fs'),
    testCase = require('./bundler-test-case.js'),
    getTestCase = function(directory, outputDirectory, bundle) { 
      var test =  new testCase.BundlerTestCase(
          directory,
          ".js",
          outputDirectory,
          exec,
          runs,
          waitsFor,
          fs
      );
      if (bundle) {
          test.CommandOptions = ' -outputbundlestats:true -outputdirectory:test-cases/' + directory + '/folder-output';
      }

      return test;
    };

    describe("Hashing: ", function() {

          it(" hashes not computed if the option is not specified.", function () {
              var test = getTestCase("bundle-hashing", "/folder-output/", false);
              test.SetUpHashTest(false);
              test.RunBundlerAndVerifyOutput();
          });

          it("The stats option computes a hash for all bundles and puts it in the output directory.", function () {
              var test = getTestCase("bundle-hashing", "/folder-output/", true);
              test.SetUpHashTest(true);
              test.RunBundlerAndVerifyOutput();
          });
    });

    describe("Debug Files: ", function() {

        it("No debug files are computed if the option is not specified.", function () {
            var test = getTestCase("bundle-debug-files", "/folder-output/", false);
            test.SetUpDebugFileTest(false);
            test.RunBundlerAndVerifyOutput();
        });

        it("The stats option computes a collection of files for all bundles and puts it in the output directory.", function () {
            var test = getTestCase("bundle-debug-files", "/folder-output/", true);
            test.SetUpDebugFileTest(true);
            test.RunBundlerAndVerifyOutput();
        });
    });

    describe("Localization Files: ", function() {

        it("No localization files are computed if the option is not specified.", function () {
            var test = getTestCase("bundle-localization-files", "/folder-output/", false);
            test.SetUpLocalizedStringTest(false);
            test.RunBundlerAndVerifyOutput();
        });

        it("The stats option computes a set of localized strings for all bundles and puts it in the output directory.", function () {
            var test = getTestCase("bundle-localization-files", "/folder-output/", true);
            test.SetUpLocalizedStringTest(true);
            test.RunBundlerAndVerifyOutput();
        });
    });

    describe("Ab Congig Files: ", function() {

        it("No ab config files are computed if the option is not specified.", function () {
            var test = getTestCase("bundle-ab-files", "/folder-output/", false);
            test.SetUpAbConfigTest(false);
            test.RunBundlerAndVerifyOutput();
        });

        it("The stats option computes a set of localized strings for all bundles and puts it in the output directory.", function () {
            var test = getTestCase("bundle-ab-files", "/folder-output/", true);
            test.SetUpAbConfigTest(true);
            test.RunBundlerAndVerifyOutput();
        });
    });

});
