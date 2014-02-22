
var ext = require('../string-extensions.js');

function BundlerTestCase(
  testDir,
  extension,
  outputDirectory,
  exec, 
  runs, 
  waitsFor,
  fs
) {
   this.runFunc = runs;
   this.waitFunc = waitsFor;
   this.Exec = exec;
   this.TestDirectory = testDir;
   this.FinishedBundlerRun = false;
   this.Extension = extension;
   this.Error = null;
   this.StdOut = null;
   this.StdError = null;
   this.Options = '';
   this.FileSystem = fs;
   this.Console = { log: function () { } };
   this.TestRootDirectory = __dirname;
   this.OutputDirectory = outputDirectory || '';
   this.ExpectedFile = "expected-results/" + this.TestDirectory + "/verify" + this.Extension;
   this.TestFile = "test-cases/" + this.TestDirectory + this.OutputDirectory + "/test.min" + this.Extension;
   this.CommandOptions = '';
};

exports.BundlerTestCase = BundlerTestCase;
exports.Type = { Javascript: '.js', Css: '.css' }

BundlerTestCase.prototype.GetFile = function(fileName){
        var _this = this;
        _this.Console.log(fileName);
        return _this.FileSystem.readFileSync(
            fileName,
                    {
	            encoding: 'utf8' 
            }
        );
};

BundlerTestCase.prototype.VerifySetUp = function() { };

BundlerTestCase.prototype.RunBundlerAndVerifyOutput = function() {
  var _this = this;
  _this.CleanDirectory(); 
  _this.VerifySetUp();

  _this.runFunc(function () {

      var cmd = "node ../bundler.js " + _this.Options + " test-cases/" + _this.TestDirectory + _this.CommandOptions;
      _this.Console.log('Running: ' + cmd);
      _this.Exec(cmd
       , function(error, stdout, stderr) {
	        _this.Error = error;
            _this.StdOut = stdout;
            _this.StdError = stderr;

            if (_this.StdOut) { _this.Console.log("stdOut: (" + _this.StdOut + ")"); }
            if (_this.StdError) { _this.Console.log("stdErr: (" + _this.StdError + ")"); }
            if (_this.Error) { _this.Console.log("stdErr: (" + _this.Error + ")"); }
		
            _this.FinishedBundlerRun = true;
          });
	});
 
  _this.waitFunc(function() {
        return _this.FinishedBundlerRun;
     }, 
     "Bundler did not complete", 
     750);

  _this.runFunc(function() {	  
    _this.VerifyBundle();
    _this.FinishedVerify = true;
  });
  
  _this.waitFunc(function() {
        return _this.FinishedVerify;
      }, 
      "Verify did not complete", 
      750);

   _this.CleanDirectory();
};

BundlerTestCase.prototype.VerifyBundle = function() {	
  var _this = this;
  _this.runFunc(function() {
        var expectedFile = _this.GetFile(_this.ExpectedFile);
        var resultFile = _this.GetFile(_this.TestFile);
 
        _this.Console.log('Expected File:');
        _this.Console.log(expectedFile);
	
        _this.Console.log('Test File:');
        _this.Console.log(resultFile);

        expect(resultFile).toBe(expectedFile);
    }, 
    function() {
 	_this.VerifyFinished = true;
  });

};          
  
BundlerTestCase.prototype.VerifyFileState = function (files, shouldExist, ignoreOutputDirectory) {
    var _this = this;
    var outputdir = ignoreOutputDirectory ? '' : _this.OutputDirectory;
    var baseTestFile = "test-cases/" + _this.TestDirectory + outputdir + "/";

    _this.Console.log("Verify the min files are "
	            + (shouldExist ? "" : "not ") + "in " + baseTestFile + "."
            );

    for (var i = 0; i < files.length; i++) {
        _this.CheckIfFileExists(baseTestFile, files[i], shouldExist);
    }

    if (_this.OutputDirectory && !ignoreOutputDirectory) {
        _this.Console.log("Make sure nothing was put in the main directories.")
        _this.VerifyFileState(files, false, true);
    }

}

BundlerTestCase.prototype.CheckIfFileExists = function(directory, file, shouldExist) {
    var _this = this;

    var isThere = _this.FileSystem.existsSync(directory + file + _this.Extension);
    if(isThere != shouldExist) {
        var intendedStatus = shouldExist ? ' and should be there' : ' and should not be there.';
        _this.Console.log(directory + file + " is " + (isThere ? "there" : "not there") + intendedStatus);
    }

    if(isThere != shouldExist) {
        console.log(directory + file + _this.Extension)
    }

    expect(isThere).toBe(shouldExist);
}

BundlerTestCase.prototype.SetUpCacheFileTest = function (shouldMinifyBundle, files) {
    var _this = this;
    var minShouldExist = false;

    _this.VerifySetUp = function () {
        var minFiles = files || ["file1.min", "file2.min", "file3.min"];
        _this.VerifyFileState(minFiles, minShouldExist)
    };

    _this.VerifyBundle = function () {
        minShouldExist = true;
        _this.VerifySetUp();
        _this.VerifyFileState(["test.min"], shouldMinifyBundle);
    };
}

BundlerTestCase.prototype.SetUpHashTest = function (shouldHash) {
    var _this = this,
        directory =  "test-cases/" + _this.TestDirectory + _this.OutputDirectory;
    if (shouldHash) {
        _this.TestFile = directory + '/bundle-hashes.json';
    }
    else {

        _this.VerifyBundle = function () {
            var file = directory + 'bundle-hashes.json';
            _this.Console.log('Hash file should not be present: ' + file)
            _this.VerifyFileState([file], false, true);
        };
    }
}

BundlerTestCase.prototype.SetUpAbConfigTest = function (shouldDebug) {
    var _this = this,
        directory =  "test-cases/" + _this.TestDirectory + _this.OutputDirectory;

    if (shouldDebug) {
        _this.VerifyBundle = function () {
            var contains = function(array, item) {
                return array.indexOf(item) >=0;
            };

            var file = directory + 'bundle-ab-configs.json';
            var savedJson = JSON.parse(_this.FileSystem.readFileSync(file, 'utf8'));
            expect(savedJson["test.js.bundle"].length).toBe(3);
            expect(contains(savedJson["test.js.bundle"],"ab.config.1")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"ab.config.2")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"ab.config.3")).toBe(true);

            expect(savedJson["test2.js.bundle"].length).toBe(2);
            expect(contains(savedJson["test2.js.bundle"],"ab.config.4")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"ab.config.5")).toBe(true);
        };
    }
    else {

        _this.VerifyBundle = function () {
            var file = directory + 'bundle-ab-configs.json';
            _this.Console.log('Ab configs file should not be present: ' + file)
            _this.VerifyFileState([file], false);
        };
    }
}

BundlerTestCase.prototype.SetUpLocalizedStringTest = function (shouldDebug) {
    var _this = this,
        directory =  "test-cases/" + _this.TestDirectory + _this.OutputDirectory;

    if (shouldDebug) {
        _this.VerifyBundle = function () {
            var contains = function(array, item) {
                return array.indexOf(item) >=0;
            };

            var file = directory + 'bundle-localization-strings.json';
            var savedJson = JSON.parse(_this.FileSystem.readFileSync(file, 'utf8'));
            expect(savedJson["test.js.bundle"].length).toBe(9);
            expect(contains(savedJson["test.js.bundle"],"ls10.string")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"ls11.string")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"ls12.string")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"ls20.string")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"ls21.string")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"ls22.string")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"js11.string")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"js12.string")).toBe(true);
            expect(contains(savedJson["test.js.bundle"],"js13.string")).toBe(true);

            expect(savedJson["test2.js.bundle"].length).toBe(9);
            expect(contains(savedJson["test2.js.bundle"],"ls30.string")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"ls31.string")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"ls32.string")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"ls40.string")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"ls41.string")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"ls42.string")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"js21.string")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"js22.string")).toBe(true);
            expect(contains(savedJson["test2.js.bundle"],"js23.string")).toBe(true);
        };
    }
    else {

        _this.VerifyBundle = function () {
            var file = directory + 'bundle-localization-strings.json';
            _this.Console.log('Localized strings file should not be present: ' + file)
            _this.VerifyFileState([file], false);
        };
    }
}

BundlerTestCase.prototype.SetUpDebugFileTest = function (shouldDebug) {
    var _this = this,
        directory =  "test-cases/" + _this.TestDirectory + _this.OutputDirectory;
    if (shouldDebug) {
        _this.TestFile = directory + '/bundle-debug.json';
    }
    else {

        _this.VerifyBundle = function () {
            var file = directory + 'bundle-debug.json';
            _this.Console.log('Debug files file should not be present: ' + file)
            _this.VerifyFileState([file], false);
        };
    }
}

BundlerTestCase.prototype.SetUpStagingDirectoryTest = function(isStaging) {

    var _this = this,
        stagingDirectory =  "test-cases/staging-directory/folder-staging/folder-",
        outputDirectory = "test-cases/staging-directory/folder-output/";

    _this.Extension = '';
    _this.VerifyBundle = function () {
        _this.Console.log('Verifying! ' + (isStaging?" should put in staging directory" : "should not use staging"));

        var checkExists = function(directory, files, shouldExist) {

            for (var i = 0; i < files.length; i++) {
                _this.CheckIfFileExists(directory, files[i], shouldExist);
            }
        }

        checkExists(stagingDirectory, [
            'testjs/staging-directory-folder-js-file1.min.js',
            'testjs/staging-directory-folder-js-mustache1.js',
            'testjs/staging-directory-folder-js-mustache1.min.js',
            'testcss/staging-directory-folder-css-file1.min.css',
            'testcss/staging-directory-folder-css-less1.css',
            'testcss/staging-directory-folder-css-less1.min.css',
            'testjs/folder-test.js',
            'testcss/folder-test.css'
        ], isStaging);

        checkExists(outputDirectory, [
            'file1.min.js',
            'mustache1.js',
            'mustache1.min.js',
            'file1.min.css',
            'less1.css',
            'less1.min.css',
            'folder-test.js',
            'folder-test.css'
        ], !isStaging);

        checkExists(outputDirectory, [
            'folder-test.min.js',
            'folder-test.min.css',
        ], true);
    };
};

BundlerTestCase.prototype.CleanDirectory = function() {
    var _this = this, finished = true;

    _this.runFunc(function() {	  
        var unlinkFiles = function (file, currentDir) {

            if (file.match(/min/g)
                || file.endsWith('test.js')
                || file.endsWith('test.css')
                || file.endsWith('.json')
                || (file.indexOf('mustache') >= 0 && file.endsWith('.js'))
                || (file.indexOf('less') >= 0 && file.endsWith('.css'))) {
                _this.FileSystem.unlinkSync(currentDir + '/' + file);

                _this.Console.log(currentDir + "/" + file + ' has been removed.');
            }
            else if (file.startsWith('folder') && !file.endsWith('.bundle')) {
                var subdirectory = currentDir + "/" + file;

                _this.FileSystem
                        .readdirSync(subdirectory)
                        .forEach(function (file) { unlinkFiles(file, subdirectory) });
            }
        };

        _this.Console.log('Cleaning the directory');
        var directory = _this.TestRootDirectory + "/test-cases/" + _this.TestDirectory;
        _this.FileSystem
                .readdirSync(directory)
                .forEach(function (file) { unlinkFiles(file, directory) });

        finished = true;
    });
  
  _this.waitFunc(function () {
          return finished;
      }, 
      "Clean did not complete", 
      750);

  _this.runFunc(function () { _this.Console.log("Clean Complete"); });
};
