var exec = require('child_process').exec,
      fs = require('fs'),
      bundleOptionsRequire = require('../bundle-options.js');

describe("BundlerOptions - ", function() {

    var options,
        _commandLineArgs;

    beforeEach(function () {

        options = new bundleOptionsRequire.BundlerOptions();
        _commandLineArgs = [];
    });

    describe("ParseCommandLineArgs: ", function() {

        var givenCommandLineArg,
            parseOptions,
            verifyOptionParsed,
            verifyDirectoryParsed;

        it("Options are prefaced with a #", function() {

            givenCommandLineArg("#option1:value1");

            parseOptions();

            verifyOptionParsed('option1', 'value1');
        });

        it("Options can alternatively be prefaced with a -", function() {

            givenCommandLineArg("-option1:value1");

            parseOptions();

            verifyOptionParsed('option1', 'value1');
        });

        it("Option values with a : in it are parsed correctly", function() {

            givenCommandLineArg("-option1:value:1");

            parseOptions();

            verifyOptionParsed('option1', 'value:1');
        });

        it("Option with no value are set to true", function() {

            givenCommandLineArg("-option1");

            parseOptions();

            verifyOptionParsed('option1', true);
        });

        it("Multiple Options are parsed correctly", function() {

            givenCommandLineArg("-option1:value1");
            givenCommandLineArg("-option2:value2");

            parseOptions();

            verifyOptionParsed('option1', 'value1');
            verifyOptionParsed('option2', 'value2');
        });

        it("Directories are any arguments not prefaced with # or -", function() {

            givenCommandLineArg("c:/folder1/folder2");

            parseOptions();

            verifyDirectoryParsed("c:/folder1/folder2", 0);
        });

        it("Multiple directories are parsed out.", function() {

            givenCommandLineArg("c:/folder1/folder2");
            givenCommandLineArg("c:/folder3/folder4");

            parseOptions();

            verifyDirectoryParsed("c:/folder1/folder2", 0);
            verifyDirectoryParsed("c:/folder3/folder4", 1);
        });


        givenCommandLineArg = function(option) {
            _commandLineArgs.push(option);
        };

        parseOptions = function() {
            options.ParseCommandLineArgs(_commandLineArgs);
        };

        verifyOptionParsed = function(option, value) {
            expect(options.DefaultOptions[option]).toBe(value);
        }

        verifyDirectoryParsed = function(directory, index) {

            expect(options.Directories[index]).toBe(directory);
        }
    });

    describe("getOptionsForBundle: ", function() {

        var defaultOptions,
            _fileContents,
            givenFileContents,
            getOptionsForBundle,
            verifyOption,
            fileWithNoAdditionalOptions,
            _bundleOptions;

        beforeEach(function () {

            defaultOptions = { option1 : 'value1', option2 : true };
            options.DefaultOptions = defaultOptions;
            _fileContents = null;
            _bundleOptions = null;
            fileWithNoAdditionalOptions = [ 'files1.js' ];
        });

        it("Does not modify the default options", function() {

            givenFileContents(fileWithNoAdditionalOptions);

            getOptionsForBundle();

            expect(_bundleOptions).toNotBe(defaultOptions);
        });

        it("Bundle options contains the default options", function() {

            givenFileContents(fileWithNoAdditionalOptions);

            getOptionsForBundle();

            verifyOption('option1', 'value1');
            verifyOption('option2', true);
        });

        it("Bundle options override the default option", function() {

            givenFileContents([ '#options option1:somethingelse' ]);

            getOptionsForBundle();

            verifyOption('option1', 'somethingelse');
        });

        it("Parses multiple bundle specfic options when comma delimited", function() {

            givenFileContents([ '#options option3:value3,option4:value4' ]);

            getOptionsForBundle();

            verifyOption('option3', 'value3');
            verifyOption('option4', 'value4');
        });


        givenFileContents = function(contents) {
            _fileContents = contents;
        };

        getOptionsForBundle = function() {
            _bundleOptions = options.getOptionsForBundle(_fileContents);
        };

        verifyOption = function(option, value) {
            expect(_bundleOptions[option]).toBe(value);
        };


    });

});