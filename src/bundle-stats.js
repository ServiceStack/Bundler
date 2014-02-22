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

var fs = require("fs"),
    hasher = require('crypto'),
    HASH_FILE_NAME = 'bundle-hashes.json',
    DEBUG_FILE_NAME = 'bundle-debug.json',
    LOCALIZATION_FILE_NAME = 'bundle-localization-strings.json',
    AB_FILE_NAME = 'bundle-ab-configs.json';

function BundleStatsCollector(fileSystem) {

    this.FileSystem = fileSystem || fs;
    this.GenerateHash = function (fileText) {
        return hasher.createHash('md5').update(fileText).digest('hex');
    };
    this.HashCollection = { };
    this.DebugCollection = { };
    this.LocalizedStrings = { };
    this.AbConfigs = { };
    this.MustacheLocalizationRegex = new RegExp("\{\{# *i18n *}}[^\{]*\{\{/ *i18n *}}", "gim");
    this.JsLocalizationRegex = new RegExp("(// @localize .*|i18n.t\\((\"|')[^(\"|')]*(\"|')\\))", "g");
    this.JsAbConfigRegex = new RegExp("AB.isOn\\((\"|')[^(\"|')]*(\"|')\\)", "g");
    this.LocalizationStartRegex = new RegExp("\{\{# *i18n *}}", "gim");
    this.LocalizationEndRegex = new RegExp("\{\{/ *i18n *}}", "gim");
    this.JsLocalizationRegexStart1 = new RegExp("// @localize ", "i");
    this.JsLocalizationRegexStart2 = new RegExp("i18n.t\\((\"|')", "i");
    this.JsLocalizationEndRegex = new RegExp("(\"|')\\)", "gim");
    this.JsAbConfigRegexStart = new RegExp("AB.isOn\\((\"|')", "i");
    this.Console = { log: function () { } };
}

exports.BundleStatsCollector = BundleStatsCollector;
exports.HASH_FILE_NAME = HASH_FILE_NAME;
exports.DEBUG_FILE_NAME = DEBUG_FILE_NAME;
exports.LOCALIZATION_FILE_NAME = LOCALIZATION_FILE_NAME;
exports.AB_FILE_NAME = AB_FILE_NAME;

var GetOutputFile = function (outputdirectory, filename) {
    var seperator = '/';
    if (outputdirectory[outputdirectory.length - 1] == seperator) {
        seperator = '';
    }
    return outputdirectory + seperator + filename;
}

BundleStatsCollector.prototype.LoadStatsFromDisk = function (outputdirectory) {

    var _this = this,
        loadFromDisk = function(fs, outputdirectory, fileName) {

        var ret;
        var outputFile = GetOutputFile(outputdirectory, fileName);
        try {
            var file = fs.readFileSync(outputFile, 'utf8')
            ret = JSON.parse(file);
        }
        catch (err) {
            ret = {};
        }
        return ret;
    }

    _this.HashCollection = loadFromDisk(_this.FileSystem, outputdirectory, HASH_FILE_NAME);
    _this.DebugCollection = loadFromDisk(_this.FileSystem, outputdirectory, DEBUG_FILE_NAME);
    _this.LocalizedStrings = loadFromDisk(_this.FileSystem, outputdirectory, LOCALIZATION_FILE_NAME);
    _this.AbConfigs = loadFromDisk(_this.FileSystem, outputdirectory, AB_FILE_NAME);
};

BundleStatsCollector.prototype.SaveStatsToDisk = function (outputdirectory) {

    var _this = this,
        saveToDisk = function(fs, outputdirectory, fileName, data) {
            var outputFile = GetOutputFile(outputdirectory, fileName);
            fs.writeFileSync(outputFile, JSON.stringify(data, null, 4))
        };

    saveToDisk(_this.FileSystem, outputdirectory, HASH_FILE_NAME, _this.HashCollection);
    saveToDisk(_this.FileSystem, outputdirectory, DEBUG_FILE_NAME, _this.DebugCollection);
    saveToDisk(_this.FileSystem, outputdirectory, LOCALIZATION_FILE_NAME, _this.LocalizedStrings);
    saveToDisk(_this.FileSystem, outputdirectory, AB_FILE_NAME, _this.AbConfigs);
}

BundleStatsCollector.prototype.AddFileHash = function (bundleName, bundleContents) {

    var _this = this;
    var hash = _this.GenerateHash(bundleContents),
        bundleShortName = bundleName.split('/').pop();

    _this.HashCollection[bundleShortName] = hash;
}

var addToCollection = function(bundleName, collection, item) {
    var bundleShortName = bundleName.split('/').pop();

    if(!collection[bundleShortName])
    {
        collection[bundleShortName] = [];
    }

    if(collection[bundleShortName].indexOf(item) < 0) {
        collection[bundleShortName].push(item);
    }
};

var parseAndAddToCollection = function(bundleName, text, collection, parseRegex, cleaningFunc) {

    var parsed = [];
    (text.match(parseRegex) || []).forEach(function(item) {
        parsed.push(cleaningFunc(item));
    });

    for(var i=0; i <parsed.length; i++) {
        addToCollection(bundleName, collection, parsed[i]);
    }


};

BundleStatsCollector.prototype.ClearStatsForBundle = function(bundleName) {
    var _this = this,
        clearCollection = function(bundleName, collection) {
            var _this = this,
                bundleShortName = bundleName.split('/').pop();

            if(collection[bundleShortName])
            {
                collection[bundleShortName] = [];
            }
        };

    clearCollection(bundleName, _this.DebugCollection);
    clearCollection(bundleName, _this.LocalizedStrings);
    clearCollection(bundleName, _this.AbConfigs);
};

BundleStatsCollector.prototype.AddDebugFile = function (bundleName, fileName) {
    var _this = this;
    addToCollection(bundleName, _this.DebugCollection, fileName);
};


BundleStatsCollector.prototype.ParseMustacheForStats = function (bundleName, text) {
    var _this = this;

    parseAndAddToCollection(
        bundleName,
        text,
        _this.LocalizedStrings,
        _this.MustacheLocalizationRegex,
        function(item) {
            return item.replace(_this.LocalizationStartRegex,'')
                .replace(_this.LocalizationEndRegex, '')
                .replace(/(\r\n|\n|\r)/gim, '');
        }
    );
};

BundleStatsCollector.prototype.ParseJsForStats = function (bundleName, text) {
    var _this = this;

    parseAndAddToCollection(
        bundleName,
        text,
        _this.LocalizedStrings,
        _this.JsLocalizationRegex,
        function(item) {
            return item.replace(_this.JsLocalizationRegexStart1,'')
                       .replace(_this.JsLocalizationRegexStart2, '')
                       .replace(_this.JsLocalizationEndRegex, '');
        }
    );

    parseAndAddToCollection(
        bundleName,
        text,
        _this.AbConfigs,
        _this.JsAbConfigRegex,
        function(item) {
            return item.replace(_this.JsAbConfigRegexStart, '')
                .replace(_this.JsLocalizationEndRegex, '');
        }
    );

};