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

function BundlerOptions() {
    this.DefaultOptions = {};
    this.Directories = [];

};

exports.BundlerOptions = BundlerOptions;

function ArgumentisOptional(arg) {
    return arg.startsWith('#') || arg.startsWith('-');
}

BundlerOptions.prototype.ParseCommandLineArgs = function(commandLineArgs) {

    var _this = this;
    var commandLineOptions = commandLineArgs.filter(function (arg) { return ArgumentisOptional(arg); });

    commandLineOptions.forEach(function (option) {
        while (ArgumentisOptional(option)) { option = option.substring(1); }
        var parts = option.split(':');
        _this.DefaultOptions[parts.splice(0,1)[0].toLowerCase()] = parts.length > 0 ? parts.join(':') : true;
    });

    _this.Directories = commandLineArgs.filter(function (arg) { return !ArgumentisOptional(arg); });

};

BundlerOptions.prototype.getOptionsForBundle = function(fileLines) {

    var _this = this,
        options = clone(_this.DefaultOptions);

    if (fileLines.length === 0)  {
        return options;
    }
    var optionsString = fileLines[0];
    if (!optionsString.startsWith('#options ')) {
        return options;
    }

    optionsString.substring(9).split(',').forEach(function (option) {
        var parts = option.split(':');
        options[parts[0].toLowerCase()] = parts.length > 1 ? parts[1] : true;
    });

    return options;

};

function clone(o) {
    var ret = {};
    Object.keys(o).forEach(function (val) {
        ret[val] = o[val];
    });
    return ret;
}



