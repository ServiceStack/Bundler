var exec = require('child_process').exec,
    fs = require('fs'),
    bundleImageRewrite = require('../bundle-image-rewrite.js');

describe("BundleImageRewriter - ", function () {

    var fileSystem, getImageRewriter, _exists, _filesToText, rootPath, outputRoot, _cssFileText;

    beforeEach(function () {

        outputRoot = "combined";
        rootPath = "root/images/";
        _cssFileText = null;

        _filesToText = {};
        _exists = false;
        fileSystem = {};
        fileSystem.existsSync = function() { return _exists; };
        fileSystem.readFileSync = function (path) {
            return _filesToText[path];
        };

        getImageRewriter = function() {
            spyOn(fileSystem, 'existsSync').andCallThrough();
            spyOn(fileSystem, 'readFileSync').andCallThrough();
            var util = new bundleImageRewrite.BundleImageRewriter(fileSystem, outputRoot, rootPath);
            return util;
        };
    });

    describe("VersionImages: ", function () {

        var fileContents1 = "AN IMAGE FILE 1", fileContents2 = "Something else that is an image too.";;

        it("Given an image that doesnt exist, the image is not versioned.", function() {

            var cssFileText = ".s { background: url('img/alert-03.jpg') center no-repeat; }";

            givenImageDoesNotExist();
            givenCssFileText(cssFileText);

            versionImages();

            verifyOutputTextIs(cssFileText);
        });

        it("Given an image that does exist, it reads the image off disk.", function () {

            givenImageFile('img/an-image.jpg', fileContents1);
            givenCssFileText(".s { background: url('img/an-image.jpg') center no-repeat; }");

            versionImages();

            expect(fileSystem.readFileSync).toHaveBeenCalledWith(rootPath + "img/an-image.jpg");
        });

        it("Given an image that does exist, it is versioned.", function () {

            givenImageFile('img/an-image.jpg', fileContents1);
            givenCssFileText(".s { background: url('img/an-image.jpg') center no-repeat; }");

            versionImages();

            verifyOutputTextIs(".s { background: url('combined/version__18458d2016656fdb823ed3ef01b8f8da__/img/an-image.jpg') center no-repeat; }");
        });

        it("Image urls with double quotes are parsed correctly.", function () {

            givenImageFile('img/an-image.jpg', fileContents1);
            givenCssFileText('.s { background: url("img/an-image.jpg") center no-repeat; }');

            versionImages();

            verifyOutputTextIs(".s { background: url('combined/version__18458d2016656fdb823ed3ef01b8f8da__/img/an-image.jpg') center no-repeat; }");
        });

        it("Image urls with no quotes are parsed correctly.", function () {

            givenImageFile('img/another-image.jpg', fileContents1);
            givenCssFileText('.s { background: url(img/another-image.jpg) center no-repeat; }');

            versionImages();

            verifyOutputTextIs(".s { background: url('combined/version__18458d2016656fdb823ed3ef01b8f8da__/img/another-image.jpg') center no-repeat; }");
        });

        it("Extra slashes are not added if one already exists.", function () {

            givenImageFile('/img/another-image.jpg', fileContents1);
            givenCssFileText('.s { background: url(/img/another-image.jpg) center no-repeat; }');

            versionImages();

            verifyOutputTextIs(".s { background: url('combined/version__18458d2016656fdb823ed3ef01b8f8da__/img/another-image.jpg') center no-repeat; }");
        });

        it("Multiple images in a single file are all versioned.", function () {

            givenImageFile('img/an-image.jpg', fileContents1);
            givenImageFile('img/another-image.jpg', fileContents2);
            givenCssFileText('.a { background: url(img/another-image.jpg) center no-repeat; }\n'
                            + '.b { background: url("img/an-image.jpg") center no-repeat; }\n'
                            + '.c { background: url("img/another-image.jpg") no-repeat; }\n');

            versionImages();

            verifyOutputTextIs(".a { background: url('combined/version__570e1018fd20af9e8e22c860a43d0ac3__/img/another-image.jpg') center no-repeat; }\n"
                            + ".b { background: url('combined/version__18458d2016656fdb823ed3ef01b8f8da__/img/an-image.jpg') center no-repeat; }\n"
                            + ".c { background: url('combined/version__570e1018fd20af9e8e22c860a43d0ac3__/img/another-image.jpg') no-repeat; }\n");
        });


        var givenImageDoesNotExist = function () {
            _exists = false;
        };

        var givenImageFile = function (fileName, fileContents) {
            _exists = true;
            _filesToText[rootPath + fileName] = fileContents;
        };

        var givenCssFileText = function (text) {
            _cssFileText = text;
        };
     
        var versionImages = function () {
            _outputFileText = getImageRewriter().VersionImages(_cssFileText);
        };

        var verifyOutputTextIs = function (expectedFile) {
            expect(_outputFileText).toBe(expectedFile);
        }

    });
});