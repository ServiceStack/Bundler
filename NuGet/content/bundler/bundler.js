//recursively scans the directory below for *.js.bundle and *.css.bundle files
var SCAN_ROOT_DIR = "../Content"; 

var fs = require("fs"),
    path = require("path"),
    jsp = require("uglify-js").parser,
    pro = require("uglify-js").uglify,
    less = require('less'),
    coffee = require('coffee-script'),
    cleanCss = require('clean-css'),
    Step = require('step');

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
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
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

walk(SCAN_ROOT_DIR, function (err, allFiles) {
    if (err) throw err;
    var jsBundles  = allFiles.filter(function(file) { return file.endsWith(".js.bundle"); });
    var cssBundles = allFiles.filter(function(file) { return file.endsWith(".css.bundle"); });

    Step(
        function () {
            var next = this;
            var index = 0;
            var nextBundle = function() {
                if (index == jsBundles.length)
                    next();
                else 
                    processBundle(jsBundles[index++]);
            };
            function processBundle(jsBundle) {                
                var bundleDir = path.dirname(jsBundle);
                var bundleName = jsBundle.replace('.bundle', '');
                fs.readFile(jsBundle, 'utf-8', function (_, data) {
                    var jsFiles = data.toString().replace("\r", "").split("\n");
                    processJsBundle(jsBundle, bundleDir, jsFiles, bundleName, nextBundle);
                });
            };
            nextBundle();
        },
        function () {
            var next = this;
            var index = 0;
            var nextBundle = function () {
                if (index == cssBundles.length)
                    next();
                else
                    processBundle(cssBundles[index++]);
            };
            function processBundle(cssBundle) {
                var bundleDir = path.dirname(cssBundle);
                var bundleName = cssBundle.replace('.bundle', '');
                fs.readFile(cssBundle, 'utf-8', function(_, data) {
                    var cssFiles = data.toString().replace("\r", "").split("\n");
                    processCssBundle(cssBundle, bundleDir, cssFiles, bundleName, nextBundle);
                });
            };
            nextBundle();
        },
        function () {
            console.log("\nDone.");
        }
    );

});

function processJsBundle(jsBundle, bundleDir, jsFiles, bundleName, cb) {

    console.log("\nprocessing " + jsBundle + ":");

    var allJsArr = [], allMinJsArr = [], index = 0, pending = 0;
    var whenDone = function () {
        console.log("writing " + bundleName + "...");

        var allJs = "", allMinJs = "";
        for (var i = 0; i < allJsArr.length; i++) {
            allJs += allJsArr[i] + ";";
            allMinJs += allMinJsArr[i] + ";";
        }

        fs.writeFile(bundleName, allJs, function (_) {
            fs.writeFile(bundleName.replace(".js", ".min.js"), allMinJs, function (_) {
                cb();
            });
        });
    };

    jsFiles.forEach(function (file) {
        if (!(file = file.trim()) || file.startsWith(".")) return; // . ..

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
                    fs.readFile(filePath, 'utf-8', function (_, less) {
                        getOrCreateJs(less, filePath, jsPath, next);
                    });
                } else {
                    fs.readFile(jsPath, 'utf-8', function (_, js) {
                        next(js);
                    });
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
            allCss += allCssArr[i] + ";";
            allMinCss += allMinCssArr[i] + ";";
        }

        fs.writeFile(bundleName, allCss, function(_) {
            fs.writeFile(bundleName.replace(".css", ".min.css"), allMinCss, function (_) {
                cb();                
            });
        });
    };

    cssFiles.forEach(function (file) {
        if (!(file = file.trim()) || file.startsWith(".")) return; // . ..

        var isLess = file.endsWith(".less"), cssFile = isLess
                ? file.replace(".less", ".css")
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
                    fs.readFile(filePath, 'utf-8', function (_, less) {
                        getOrCreateCss(less, filePath, cssPath, next);
                    });
                } else {
                    fs.readFile(cssPath, 'utf-8', function (_, css) {
                        next(css);
                    });
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

function getOrCreateCss(less, lessPath, cssPath, cb /*cb(css)*/) {
    compileAsync("compiling", compileLess, less, lessPath, cssPath, cb);
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
                compileFn(text, textPath, onAfterCompiled);
            }
            else {
                fs.readFile(compileTextPath, 'utf-8', function (_, minText) {
                    cb(minText);
                });
            }
        }
    );
}

function compileLess(lessCss, lessPath, cb) {
    var lessDir = path.dirname(lessPath),
        fileName = path.basename(lessPath),
        options = {
            paths: [SCAN_ROOT_DIR, '.', lessDir], // Specify search paths for @import directives
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
