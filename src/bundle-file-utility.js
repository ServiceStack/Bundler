/*
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var ext = require('./string-extensions.js');

function BundleFileUtility(fs) {
    this.FileSystem = fs;
}


exports.BundleFileUtility = BundleFileUtility;

getSplit = function(fileName) {
    return fileName.indexOf('/') < 0 ? '\\' : '/';
};

getStagingDirectory = function(fs, bundleName, filename, options) {

    var split = getSplit(bundleName);
    var splitBundle = bundleName.split(split);
    var outputDir =  options.stagingdirectory + split + splitBundle.pop().replace('.','');

    var stagingFileName = getStagingFileName(bundleName, filename);

    if(!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    return outputDir + split + stagingFileName;
};

getStagingFileName = function(bundleName, filename) {

    var fileSplit = getSplit(filename);

    if(bundleName == filename) {
        return filename.split(fileSplit).pop();
    }

    var splits = filename.split(fileSplit);
    if(splits.length > 1) {
        splits.splice(0, 1);
    }
    var stagingFileName = splits.join('-');

    return stagingFileName;
}

getOutputDirectory = function(bundleName, filename, options) {
    var split = getSplit(filename);
    var bundleFileName = filename.split(split).pop();
    return options.outputdirectory + split + bundleFileName;
};

BundleFileUtility.prototype.getOutputFilePath = function(bundleName, filename, options) {

    if(options.stagingdirectory) {

        return getStagingDirectory(this.FileSystem, bundleName, filename, options);
    }
    else if(options.outputdirectory) {
        return getOutputDirectory(bundleName, filename, options);
    }

    return filename;
};

BundleFileUtility.prototype.getMinFileName = function(bundleName, fileName, options) {

    if(options.outputdirectory &&
        bundleName == fileName) {
        fileName = getOutputDirectory(bundleName, fileName, options);
    }

    var extension = fileName.substring(fileName.lastIndexOf('.'));
    return fileName.substring(0, fileName.length - extension.length) + ".min" + extension;
}
