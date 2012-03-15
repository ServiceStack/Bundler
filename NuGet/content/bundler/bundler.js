/*
Copyright (c) 2012 Demis Bellot <demis.bellot@gmail.com>

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

//recursively scans the directory below for *.js.bundle and *.css.bundle files
var SCAN_ROOT_DIRS = process.argv.splice(2); //directories specified in bundler.cmd
if (!SCAN_ROOT_DIRS.length) {
    console.log("No directories were specified.");
    console.log("Usage: bundler.cmd ../Content ../Scripts");
    return;
}

var fs = require("fs"),
    path = require("path"),
    jsp = require("uglify-js").parser,
    pro = require("uglify-js").uglify,
    less = require('less'),
    sass = require('sass'),
    coffee = require('coffee-script'),
    cleanCss = require('clean-css'),
    Step = require('step'),
    startedAt = Date.now();

String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
};
String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var walk = function (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return done(null, results);
            file = dir + '/' + file;
            fs.stat(file, function (_, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (_, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
};

var scanIndex = 0;
(function scanNext() {
    if (scanIndex < SCAN_ROOT_DIRS.length) {
        var rootDir = SCAN_ROOT_DIRS[scanIndex++];
        path.exists(rootDir, function(exists) {
            if (exists) {
                walk(rootDir, function(err, allFiles) {
                    if (err) throw err;
                    scanDir(allFiles, scanNext);
                });
            } else {
                console.log("\nSpecified dir '" + rootDir + "' does not exist, skipping...");
                scanNext();
            }
        });
    } else
        console.log("\nDone. " + (Date.now() - startedAt) + "ms");
})();

function scanDir(allFiles, cb) {

    var jsBundles  = allFiles.filter(function (file) { return file.endsWith(".js.bundle"); });
    var cssBundles = allFiles.filter(function (file) { return file.endsWith(".css.bundle"); });

    Step(
        function () {
            var next = this;
            var index = 0;
            var nextBundle = function () {
                if (index < jsBundles.length)
                    processBundle(jsBundles[index++]);
                else
                    next();
            };
            function processBundle(jsBundle) {
                var bundleDir = path.dirname(jsBundle);
                var bundleName = jsBundle.replace('.bundle', '');
                readTextFile(jsBundle, function (data) {
                    var jsFiles = removeCR(data).split("\n");
                    processJsBundle(jsBundle, bundleDir, jsFiles, bundleName, nextBundle);
                });
            };
            nextBundle();
        },
        function () {
            var next = this;
            var index = 0;
            var nextBundle = function () {
                if (index < cssBundles.length)
                    processBundle(cssBundles[index++]);
                else
                    next();
            };
            function processBundle(cssBundle) {
                var bundleDir = path.dirname(cssBundle);
                var bundleName = cssBundle.replace('.bundle', '');
                readTextFile(cssBundle, function (data) {
                    var cssFiles = removeCR(data).split("\n");
                    processCssBundle(cssBundle, bundleDir, cssFiles, bundleName, nextBundle);
                });
            };
            nextBundle();
        },
        cb
    );
}

function processJsBundle(jsBundle, bundleDir, jsFiles, bundleName, cb) {

    console.log("\nprocessing " + jsBundle + ":");

    var allJsArr = [], allMinJsArr = [], index = 0, pending = 0;
    var whenDone = function () {
        console.log("writing " + bundleName + "...");

        var allJs = "", allMinJs = "";
        for (var i = 0; i < allJsArr.length; i++) {
            allJs += ";" + allJsArr[i] + "\n";
            allMinJs += ";" + allMinJsArr[i] + "\n";
        }

        fs.writeFile(bundleName, allJs, function (_) {
            fs.writeFile(bundleName.replace(".js", ".min.js"), allMinJs, cb);
        });
    };

    jsFiles.forEach(function (file) {
        // Skip blank lines/files beginning with '.' or '#', but allow ../relative paths
        if (!(file = file.trim()) 
            || (file.startsWith(".") && !file.startsWith(".."))
            || file.startsWith('#')) 
            return; 

        var isCoffee = file.endsWith(".coffee"), jsFile = isCoffee
                ? file.replace(".coffee", ".js")
                : file;

        var filePath = path.join(bundleDir, file),
                jsPath = path.join(bundleDir, jsFile),
                minJsPath = jsPath.replace(".js", ".min.js");

        var i = index++;
        pending++;
        Step(
            function () {
                var next = this;
                if (isCoffee) {
                    readTextFile(filePath, function (coffee) {
                        getOrCreateJs(coffee, filePath, jsPath, next);
                    });
                } else {
                    readTextFile(jsPath, next);
                }
            },
            function (js) {
                getOrCreateMinJs(js, jsPath, minJsPath, function (minJs) {
                    allJsArr[i] = js;
                    allMinJsArr[i] = minJs;

                    if (! --pending) whenDone();                    
                });
            }
        );
    });
}

function processCssBundle(cssBundle, bundleDir, cssFiles, bundleName, cb) {
    console.log("\nprocessing " + cssBundle + ":");

    var allCssArr = [], allMinCssArr = [], index = 0, pending = 0;
    var whenDone = function () {
        console.log("writing " + bundleName + "...");

        var allCss = "", allMinCss = "";
        for (var i = 0; i < allCssArr.length; i++) {
            allCss += allCssArr[i] + "\n";
            allMinCss += allMinCssArr[i] + "\n";
        }

        fs.writeFile(bundleName, allCss, function(_) {
            fs.writeFile(bundleName.replace(".css", ".min.css"), allMinCss, cb);
        });
    };

    cssFiles.forEach(function (file) {
        if (!(file = file.trim()) 
            || (file.startsWith(".") && !file.startsWith(".."))
            || file.startsWith('#')) 
            return; 

        var isLess = file.endsWith(".less"), isSass = file.endsWith(".sass"),
            cssFile = isLess
                ? file.replace(".less", ".css")
                : isSass 
                    ? file.replace(".sass", ".css")
                    : file;

        var filePath = path.join(bundleDir, file),
                cssPath = path.join(bundleDir, cssFile),
                minCssPath = cssPath.replace(".css", ".min.css");

        var i = index++;
        pending++;
        Step(
            function () {
                var next = this;
                if (isLess) {
                    readTextFile(filePath, function (lessText) {
                        getOrCreateLessCss(lessText, filePath, cssPath, next);
                    });
                } else if (isSass) {
                    readTextFile(filePath, function (sassText) {
                        getOrCreateSassCss(sassText, filePath, cssPath, next);
                    });
                } else {
                    readTextFile(cssPath, next);
                }
            },
            function (css) {
                getOrCreateMinCss(css, cssPath, minCssPath, function (minCss) {
                    allCssArr[i] = css;
                    allMinCssArr[i] = minCss;

                    if (! --pending) whenDone();                    
                });
            }
        );
    });            
}

function getOrCreateJs(coffeeScript, csPath, jsPath, cb /*cb(js)*/) {
    compileAsync("compiling", function (coffeeScript, csPath, cb) {
            cb(coffee.compile(coffeeScript));
        }, coffeeScript, csPath, jsPath, cb);
}

function getOrCreateMinJs(js, jsPath, minJsPath, cb /*cb(minJs)*/) {
    compileAsync("minifying", function (js, jsPath, cb) {
        cb(minifyjs(js));
    }, js, jsPath, minJsPath, cb);
}

function getOrCreateLessCss(less, lessPath, cssPath, cb /*cb(css)*/) {
    compileAsync("compiling", compileLess, less, lessPath, cssPath, cb);
}

function getOrCreateSassCss(sassText, sassPath, cssPath, cb /*cb(sass)*/) {
    compileAsync("compiling", function (sassText, sassPath, cb) {
        cb(sass.render(removeCR(sassText), { options: path.basename(sassPath) }));
    }, sassText, sassPath, cssPath, cb);
}

function getOrCreateMinCss(css, cssPath, minCssPath, cb /*cb(minCss)*/) {
    compileAsync("minifying", function (css, cssPath, cb) {
            cb(cleanCss.process(css));
        }, css, cssPath, minCssPath, cb);
}

function compileAsync(mode, compileFn /*compileFn(text, textPath, cb(compiledText))*/, 
    text, textPath, compileTextPath, cb /*cb(compiledText)*/) {
    Step(
        function () {
            path.exists(compileTextPath, this);
        },
        function (exists) {
            var next = this;
            if (!exists)
                next(!exists);
            else
                fs.stat(textPath, function (_, textStat) {
                    fs.stat(compileTextPath, function (_, minTextStat) {
                        next(minTextStat.mtime.getTime() < textStat.mtime.getTime());
                    });
                });
        },
        function (doCompile) {
            if (doCompile) {
                console.log(mode + " " + compileTextPath + "...");
                var onAfterCompiled = function(minText) {
                    fs.writeFile(compileTextPath, minText, 'utf-8', function(_) {
                        cb(minText);
                    });
                };
                try {
                    compileFn(text, textPath, onAfterCompiled);
                } catch (e) {
                    console.log(e);
                }
            }
            else {
                readTextFile(compileTextPath, cb);
            }
        }
    );
}

function compileLess(lessCss, lessPath, cb) {
    var lessDir = path.dirname(lessPath),
        fileName = path.basename(lessPath),
        options = {
            paths: ['.', lessDir], // Specify search paths for @import directives
            filename: fileName
        };
    
    less.render(lessCss, options, function (err, css) {
        if (err) return cb("") && console.error(err);
        cb(css);
    });
}

function minifyjs(js) {
    var ast = jsp.parse(js);
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
    var minJs = pro.gen_code(ast);
    return minJs;
}

function removeCR(text) {
    return text.replace(/\r/g, '');
}

function stripBOM(content) {
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    return content;
}

function readTextFile(filePath, cb) {
    fs.readFile(filePath, 'utf-8', function(err, fileContents) {
        if (err) throw err;
        cb(stripBOM(fileContents));
    });
}