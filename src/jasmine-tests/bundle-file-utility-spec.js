var exec = require('child_process').exec,
    fs = require('fs'),
    bundleFileUtilityRequire = require('../bundle-file-utility.js');

describe("BundleFileUtility - ", function() {

    var filePath, _options, bundleName, fileSystem, getUtil, _exists;

    beforeEach(function () {
        filePath = '/folder2/folder1/file1.js';
        bundleName = "bundle.js";
        _options = {};

        _exists = false;
        fileSystem = {};
        fileSystem.existsSync = function() { return _exists; };
        fileSystem.mkdirSync = function() { };

        getUtil = function() {
            spyOn(fileSystem, 'existsSync').andCallThrough();
            spyOn(fileSystem, 'mkdirSync').andCallThrough();
            var util = new bundleFileUtilityRequire.BundleFileUtility(fileSystem);
            return util;
        };
    });

    describe("getOutputFilePath: ", function() {

        var _outputFilePath,
            getOutputFilePath,
            givenOutputDirectory,
            givenStagingDirectory,
            givenFilePath,
            givenStagingDirectoryExistsForBundle,
            givenStagingDirectoryDoesNotExistForBundle,
            verifyDirectoryCreated,
            verifyDirectoryNotCreated,
            givenNoOutputDirectory,
            verifyOutputFilePath;

        it("Given no output directory, then the filepath is unchanged", function() {

            givenNoOutputDirectory();

            getOutputFilePath();

            verifyOutputFilePath(filePath);
        });

        it("Given an output directory, the file is put in that path.", function() {

            givenFilePath('/folder1/file1.js');
            givenOutputDirectory('output-directory');

            getOutputFilePath();

            verifyOutputFilePath('output-directory/file1.js');
        });

        it("The slash used in the file path is not affected.", function() {

            givenFilePath('\\folder1\\folder2\\file1.js');
            givenOutputDirectory('output-directory');

            getOutputFilePath();

            verifyOutputFilePath('output-directory\\file1.js');
        });

        it("Staging directory used for the bundle", function() {

            givenFilePath(bundleName);
            givenStagingDirectory('staging-directory');
            givenOutputDirectory('output-directory');

            getOutputFilePath();

            verifyOutputFilePath('staging-directory\\bundlejs\\bundle.js');
        });

        it("Staging directory used for file", function() {

            givenFilePath('file.js');
            givenStagingDirectory('staging-directory');

            getOutputFilePath();

            verifyOutputFilePath('staging-directory\\bundlejs\\file.js');
        });

        it("Staging directory incorprates the director of the file", function() {

            givenFilePath('folder1/folder2/folder3/file.js');
            givenStagingDirectory('staging-directory');

            getOutputFilePath();

            verifyOutputFilePath('staging-directory\\bundlejs\\folder2-folder3-file.js');
        });


        it("Staging directory created for bundle if it does not exist", function() {

            givenFilePath('file.js');
            givenStagingDirectory('staging-directory');
            givenStagingDirectoryDoesNotExistForBundle();

            getOutputFilePath();

            verifyDirectoryCreated('staging-directory\\bundlejs');
        });

        it("Staging directory not created for bundle if it already exists", function() {

            givenFilePath('file.js');
            givenStagingDirectory('staging-directory');
            givenStagingDirectoryExistsForBundle();

            getOutputFilePath();

            verifyDirectoryNotCreated();
        });

        givenOutputDirectory = function(directory) {
            _options['outputdirectory'] = directory;
        };

        givenFilePath = function(path) {
            filePath = path;
        };

        givenStagingDirectoryExistsForBundle = function() {
            _exists = true;
        };

        verifyDirectoryCreated = function(directory) {
            expect(fileSystem.mkdirSync).toHaveBeenCalledWith(directory)
        };

        verifyDirectoryNotCreated = function() {
            expect(fileSystem.mkdirSync).not.toHaveBeenCalled()
        }

        givenStagingDirectoryDoesNotExistForBundle = function() {
            _exists = false;
        };


        givenStagingDirectory = function(directory) {
            _options['stagingdirectory'] = directory;
        };

        givenNoOutputDirectory = function() { };

        getOutputFilePath = function() {
            _outputFilePath = getUtil().getOutputFilePath(bundleName, filePath, _options);
        };

        verifyOutputFilePath = function(expected) {
            expect(_outputFilePath).toBe(expected);
        }
    });

    describe("getMinFileName: ", function() {

        var _path,
            _minPath,
            getMinFileName,
            givenFilePath,
            givenOutputDirectory,
            verifyMinFileName;

        it("Swaps out the extension with min.extension ", function() {

            givenFilePath('/folder1/file1.js');

            getMinFileName();

            verifyMinFileName('/folder1/file1.min.js');
        });

        it("Handles file paths with multiple periods ", function() {

            givenFilePath('/fol.der1/file1.sauce.css');

            getMinFileName();

            verifyMinFileName('/fol.der1/file1.sauce.min.css');
        });

        it("An output directory has no affect on regular files ", function() {

            givenOutputDirectory('output-directory');
            givenFilePath('/folder1/file1.js');

            getMinFileName();

            verifyMinFileName('/folder1/file1.min.js');
        });

        it("An output directory changes the minified bundle ", function() {

            givenOutputDirectory('output-directory');
            givenFilePath(bundleName);

            getMinFileName();

            verifyMinFileName('output-directory\\bundle.min.js');
        });


        getMinFileName = function() {
            _minPath = getUtil().getMinFileName(bundleName, _path, _options);
        };

        givenFilePath = function(path) {
            _path = path;
        };

        verifyMinFileName = function(expected) {
            expect(_minPath).toBe(expected);
        };

        givenOutputDirectory = function(directory) {
            _options['outputdirectory'] = directory;
        };


    });
});