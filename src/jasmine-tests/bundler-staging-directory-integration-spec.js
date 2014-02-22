
describe("Integration Tests for outputting to a Staging Directory - ", function() {

  var exec = require('child_process').exec,
    fs = require('fs'),
    testCase = require('./bundler-test-case.js'),
    getTestCase = function(directory, shouldStage) {
      var test =  new testCase.BundlerTestCase(
          directory,
          ".js",
          "folder-output",
          exec,
          runs,
          waitsFor,
          fs
      );

      test.CommandOptions = '  -outputdirectory:test-cases/' + directory + '/folder-output';

      if (shouldStage) {
          test.CommandOptions = test.CommandOptions + '  -stagingdirectory:test-cases/' + directory + '/folder-staging';
      }

      return test;
    };

    it("Does not output to staging directory if not specified.", function () {
        var test = getTestCase("staging-directory", false);
        test.SetUpStagingDirectoryTest(false);
        test.RunBundlerAndVerifyOutput();
    });

    it("Outputs to staging directory when option is specified.", function () {
        var test = getTestCase("staging-directory", true);
        test.SetUpStagingDirectoryTest(true);
        test.RunBundlerAndVerifyOutput();
    });


});