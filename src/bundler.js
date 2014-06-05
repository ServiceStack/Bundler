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

// uncaught exceptions should cause the application to crash and exit
// with an exit code that will be identified as a failure by most
// windows build systems

process.on("uncaughtException", function (err) {
    console.error(err);
    process.exit(1);
});

function clone(o) {
  var ret = {};
  Object.keys(o).forEach(function (val) {
    ret[val] = o[val];
  });
  return ret;
}
String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
};
String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.endsWithAny = function (endings) {
    var str = this;
    return endings.some(function (ending) { return str.endsWith(ending); });
};
String.prototype.toBoolOrString = function () {
    return this === 'true' ? true : this === 'false' ? false : this.toString();
};

//recursively scans the directory below for *.js.bundle and *.css.bundle files
var commandLineArgs = process.argv.splice(2); //directories specified in bundler.cmd

var commandLineOptions = commandLineArgs.filter(function (arg) { return arg.startsWith('#'); });
var defaultOptions = {};
commandLineOptions.forEach(function (option) {
    while (option.startsWith('#')) { option = option.substring(1); }
    var parts = option.split(':');
    defaultOptions[parts[0].toLowerCase()] = parts.length > 1 ? parts[1].toBoolOrString() : true;
});

var SCAN_ROOT_DIRS = commandLineArgs.filter(function (arg) { return !arg.startsWith('#'); });
if (!SCAN_ROOT_DIRS.length) {
    console.log("No directories were specified.");
    console.log("Usage: bundler.js [#option:value] ../Content [../Scripts]");
    return;
}

var fs = require("fs"),
    path = require("path"),
    jsp = require("uglify-js").parser,
    pro = require("uglify-js").uglify,
    less = require('less'),
    sass = require('node-sass'),
    stylus = require('stylus'),
    nib = require('nib'),
    coffee = require('coffee-script'),
    livescript = require('livescript'),
    CleanCss = require('clean-css'),
    Step = require('step'),
    startedAt = Date.now();

var walk = function (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) throw err;
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
        fs.exists(rootDir, function(exists) {
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

    function getOptions(fileLines) {
        var options = clone(defaultOptions);
        if (fileLines.length === 0) return options;
        var optionsString = fileLines[0];
        if (!optionsString.startsWith('#options ')) return options;
        optionsString.substring(9).split(',').forEach(function (option) {
            var parts = option.split(':');
            options[parts[0].toLowerCase()] = parts.length > 1 ? parts[1].toBoolOrString() : true;
        });
        return options;
    };

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
                    var options = getOptions(jsFiles);
                    if (options.folder !== undefined) {
                        options.nobundle = true;
                        var recursive = options.folder === 'recursive';
                        jsFiles = allFiles.map(function jsMatches(fileName) {
                            if (!fileName.startsWith(bundleDir)) return '#';
                            if (!fileName.endsWithAny(['.js', '.coffee', '.ls', '.ts'])) return '#';
                            if (fileName.endsWithAny(['.min.js'])) return '#';
                            if (!recursive && (path.dirname(fileName) !== bundleDir)) return '#';
                            return fileName.substring(bundleDir.length + 1);
                        });
                    }
                    processJsBundle(options, jsBundle, bundleDir, jsFiles, bundleName, nextBundle);
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
                    var options = getOptions(cssFiles);
                    if (options.folder !== undefined) {
                        options.nobundle = true;
                        var recursive = options.folder === 'recursive';
                        cssFiles = allFiles.map(function cssMatches(fileName) {
                            if (!fileName.startsWith(bundleDir)) return '#';
                            if (!fileName.endsWithAny(['.css', '.less', '.sass', '.scss', '.styl'])) return '#';
                            if (fileName.endsWithAny(['.min.css'])) return '#';
                            if (!recursive && (path.dirname(fileName) !== bundleDir)) return '#';
                            if (fileName.match(/_[^/]+\.s[ca]ss$/)) return '#';
                            return fileName.substring(bundleDir.length + 1);
                        });
                    }
                    processCssBundle(options, cssBundle, bundleDir, cssFiles, bundleName, nextBundle);
                });
            };
            nextBundle();
        },
        cb
    );
}

function getMinFileName(fileName) {
    var extension = fileName.substring(fileName.lastIndexOf('.'));
    return fileName.substring(0, fileName.length - extension.length) + ".min" + extension;
}

function processJsBundle(options, jsBundle, bundleDir, jsFiles, bundleName, cb) {

    console.log("\nprocessing " + jsBundle + ":");
    for (var optionKey in options) {
        console.log("option: " + optionKey + " -> " + options[optionKey]);
    }

    var allJsArr = [], allMinJsArr = [], index = 0, pending = 0;
    var whenDone = function () {
        if (options.nobundle && options.outputbundleonly !== true) {
            setTimeout(cb, 0);
            return;
        }

        console.log("writing " + bundleName + "...");

        var allJs = "", allMinJs = "";
        for (var i = 0; i < allJsArr.length; i++) {
            allJs += ";" + allJsArr[i] + "\n";
            allMinJs += ";" + allMinJsArr[i] + "\n";
        }

        var afterBundle = options.skipmin ? cb : function (_) {
            var minFileName = getMinFileName(bundleName);
            fs.writeFile(minFileName, allMinJs, cb);
        };
        if (!options.bundleminonly) {
            fs.writeFile(bundleName, allJs, afterBundle);
        } else {
            afterBundle();
        }
    };

    jsFiles.forEach(function (file) {
        // Skip blank lines/files beginning with '.' or '#', but allow ../relative paths
        if (!(file = file.trim())
            || (file.startsWith(".") && !file.startsWith(".."))
            || file.startsWith('#'))
            return;

        var isCoffee = file.endsWith(".coffee");
        var isLiveScript = file.endsWith(".ls");
        var jsFile = isCoffee ?
            file.replace(".coffee", ".js")
    		: isLiveScript ?
            file.replace(".ls", ".js") :
            file;

        var filePath = path.join(bundleDir, file),
              jsPath = path.join(bundleDir, jsFile),
           minJsPath = getMinFileName(jsPath);

        var i = index++;
        pending++;
        Step(
            function () {
                var next = this;
                if (isCoffee) {
                    readTextFile(filePath, function (coffee) {
                        getOrCreateJs(options, coffee, filePath, jsPath, next);
                    });
                } else if(isLiveScript){
                    readTextFile(filePath, function(livescriptText){
                        getOrCreateJsLiveScript(options, livescriptText, filePath, jsPath, next);
                    });
                } else {
                    readTextFile(jsPath, next);
                }
            },
            function (js) {
                allJsArr[i] = js;
                var withMin = function (minJs) {
                    allMinJsArr[i] = minJs;

                    if (! --pending) whenDone();
                };
                if (options.skipmin) {
                    withMin('');
                } else if (/(\.min\.|\.pack\.)/.test(file) && options.skipremin) {
                    readTextFile(jsPath, withMin);
                }  else {
                    getOrCreateMinJs(options, js, jsPath, minJsPath, withMin);
                }
            }
        );
    });
}

function processCssBundle(options, cssBundle, bundleDir, cssFiles, bundleName, cb) {
    console.log("\nprocessing " + cssBundle + ":");
    for (var optionKey in options) {
        console.log("option: " + optionKey + " -> " + options[optionKey]);
    }

    var allCssArr = [], allMinCssArr = [], index = 0, pending = 0;
    var whenDone = function () {
        if (options.nobundle && options.outputbundleonly !== true) {
            setTimeout(cb, 0);
            return;
        }

        console.log("writing " + bundleName + "...");

        var allCss = "", allMinCss = "";
        for (var i = 0; i < allCssArr.length; i++) {
            allCss += allCssArr[i] + "\n";
            allMinCss += allMinCssArr[i] + "\n";
        }

        var afterBundle = options.skipmin ? cb : function (_) {
            var minFileName = getMinFileName(bundleName);
            fs.writeFile(minFileName, allMinCss, cb);
        };

        if (!options.bundleminonly) {
            fs.writeFile(bundleName, allCss, afterBundle);
        } else {
            afterBundle();
        }
    };

    cssFiles.forEach(function (file) {
        if (!(file = file.trim())
            || (file.startsWith(".") && !file.startsWith(".."))
            || file.startsWith('#'))
            return;

        var isLess = file.endsWith(".less");
        var isSass = (file.endsWith(".sass") || file.endsWith(".scss"));
        var isStylus = file.endsWith(".styl");
        var cssFile = isLess ?
            file.replace(".less", ".css")
            : isSass ?
            file.replace(".sass", ".css").replace(".scss", ".css")
            : isStylus ?
            file.replace(".styl", ".css") :
            file;

        var filePath = path.join(bundleDir, file),
             cssPath = path.join(bundleDir, cssFile),
          minCssPath = getMinFileName(cssPath);

        var i = index++;
        pending++;
        Step(
            function () {
                var next = this;
                if (isLess) {
                    readTextFile(filePath, function (lessText) {
                        getOrCreateLessCss(options, lessText, filePath, cssPath, next);
                    });
                } else if (isSass) {
                    readTextFile(filePath, function (sassText) {
                        getOrCreateSassCss(options, sassText, filePath, cssPath, next);
                    });
				} else if (isStylus){
					readTextFile(filePath, function (stylusText) {
						getOrCreateStylusCss(options, stylusText, filePath, cssPath, next);
					});
                } else {
                    readTextFile(cssPath, next);
                }
            },
            function (css) {
                allCssArr[i] = css;
                var withMin = function (minCss) {
                    var rebaseOptions = {
                        target: path.resolve(bundleName),
                        relativeTo: path.resolve(path.dirname(cssPath)),
                        noAdvanced: true
                    };
                    allMinCssArr[i] = new CleanCss(rebaseOptions).minify(minCss);

                    if (! --pending) whenDone();
                };
                if (options.skipmin) {
                    withMin('');
                } else if (/(\.min\.|\.pack\.)/.test(file) && options.skipremin) {
                    readTextFile(cssPath, withMin);
                }else {
                    getOrCreateMinCss(options, css, cssPath, minCssPath, withMin);
                }
            }
        );
    });
}

function getOrCreateJs(options, coffeeScript, csPath, jsPath, cb /*cb(js)*/) {
    compileAsync(options, "compiling", function (coffeeScript, csPath, cb) {
            cb(coffee.compile(coffeeScript));
        }, coffeeScript, csPath, jsPath, cb);
}

function getOrCreateJsLiveScript(options, livescriptText, lsPath, jsPath, cb /*cb(js)*/) {
    compileAsync(options, "compiling", function (livescriptText, lsPath, cb) {
            cb(livescript.compile(livescriptText));
        }, livescriptText, lsPath, jsPath, cb);
}

function getOrCreateMinJs(options, js, jsPath, minJsPath, cb /*cb(minJs)*/) {
    compileAsync(options, "minifying", function (js, jsPath, cb) {
        cb(minifyjs(js));
    }, js, jsPath, minJsPath, cb);
}

function getOrCreateLessCss(options, less, lessPath, cssPath, cb /*cb(css)*/) {
    compileAsync(options, "compiling", compileLess, less, lessPath, cssPath, cb);
}

function getOrCreateSassCss(options, sassText, sassPath, cssPath, cb /*cb(sass)*/) {
    var explodedSassPath = sassPath.split('\\');

    if (explodedSassPath.length == 0) {
        explodedSassPath = sassPath.split('/');
    }

    var sassFileName = explodedSassPath.pop();
    var includePaths = [sassPath.replace(sassFileName, '')];

    compileAsync(options, "compiling", function (sassText, sassPath, cb) {
        cb(sass.renderSync({
            file: sassPath,
            includePaths: includePaths
        }));
    }, sassText, sassPath, cssPath, cb);
}

function getOrCreateStylusCss(options, stylusText, stylusPath, cssPath, cb /*cb(css)*/) {
    compileAsync(options, "compiling", function (stylusText, stylusPath, cb) {
        stylus(stylusText)
			.set('filename', stylusPath)
			.use(nib())
			.render(function(err, css){
				if(err){
					throw new Error(err);
				}

				cb(css);
			});
    }, stylusText, stylusPath, cssPath, cb);
}

function getOrCreateMinCss(options, css, cssPath, minCssPath, cb /*cb(minCss)*/) {
    compileAsync(options, "minifying", function (css, cssPath, cb) {
            cb(new CleanCss(options).minify(css));
        }, css, cssPath, minCssPath, cb);
}

function compileAsync(options, mode, compileFn /*compileFn(text, textPath, cb(compiledText))*/,
    text, textPath, compileTextPath, cb /*cb(compiledText)*/) {
    Step(
        function () {
            fs.exists(compileTextPath, this);
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
                    if (options.outputbundleonly) {
                        cb(minText);
                    } else {
                        fs.writeFile(compileTextPath, minText, 'utf-8', function(_) {
                            cb(minText);
                        });
                    }
                };
                compileFn(text, textPath, onAfterCompiled);
            } else {
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
        if (err) throw err;
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
