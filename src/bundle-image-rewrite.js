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

var ext = require('./string-extensions.js'),
    fs = require("fs"),
    hasher = require('crypto');

function BundleImageRewriter(
    fileSystem,
    outputRoot,
    rootPath
) {
    fileSystem = fileSystem || fs;

    if(!outputRoot.endsWith('/')) {
        outputRoot = outputRoot + '/';
    }

    if (!rootPath.endsWith('/')) {
        rootPath = rootPath + '/';
    }

    var generateHashOfFile = function (filepath)
    {
        var fileText = fileSystem.readFileSync(filepath);
        return hasher.createHash('md5').update(fileText).digest('hex');
    };

    this.rewriteUrl = function (url) {
         
        var cleanedUrl = url.replace("url(", "").replace(")", "").replace(/'/g, "").replace(/"/g, "");
        var filepath = rootPath + cleanedUrl;
        var exists = fileSystem.existsSync(filepath);
        if (!exists) {
            return cleanedUrl;
        }

        var hash = generateHashOfFile(filepath);
        
		var seperator = '__/';
		if(cleanedUrl.startsWith('/')) {
			seperator = '__';
		}
		
        return outputRoot + 'version__' + hash + seperator + cleanedUrl;
    }

    this.imageUrlRegex = new RegExp(/url\(.*?g['"]?\)/ig)
}

exports.BundleImageRewriter = BundleImageRewriter;

BundleImageRewriter.prototype.VersionImages = function (cssFileText) {
    var _this = this;

    (cssFileText.match(_this.imageUrlRegex) || []).forEach(function (url) {
        var rewrittenUrl = "url('" + _this.rewriteUrl(url) + "')";
        cssFileText = cssFileText.replace(url, rewrittenUrl);
    });

    return cssFileText;
};
