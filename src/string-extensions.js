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

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWith = function (str) {
    return this.indexOf(str) === 0;
};

String.prototype.endsWithAny = function (endings) {
    var str = this;
    return endings.some(function (ending) { return str.endsWith(ending); });
};

String.prototype.NormalizeSlash = function (addInitialSlash, removeFinalSlash) {

    var ret = this;
    if (addInitialSlash && !ret.startsWith('/')) {
        ret = "/" + ret;
    }

    if (removeFinalSlash && ret.endsWith("/")) {
        ret = ret.substring(0, this.length - 1);
    }
    return ret;
};

String.prototype.isJs = function () {
    if (this.endsWith('.min.js')) return false;
    if (this.endsWithAny(['.js', '.coffee', '.ls', '.ts', '.mustache'])) return true;
    return false;
}

String.prototype.isCss = function () {
    if (this.endsWith('.min.css')) return false;
    if (this.endsWithAny(['.css', '.less', '.sass', '.scss', '.styl'])) return true;
    return false;
}