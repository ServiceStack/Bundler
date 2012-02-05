//recursively scans the directory below for *.js.bundle and *.css.bundle files
var SCAN_ROOT_DIR = "../Content"; 

var fs = require("fs"),
    path = require("path"),
	jsp = require("uglify-js").parser,
	pro = require("uglify-js").uglify,
    less = require('less'),
    coffee = require('coffee-script'),
    cleanCss = require('clean-css');

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
String.prototype.startsWith = function (str){
	return this.indexOf(str) === 0;
};
String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

walk(SCAN_ROOT_DIR, function (err, allFiles) {
    if (err) throw err;
    var jsBundles = allFiles.filter(function(file) { return file.endsWith(".js.bundle"); });
    var cssBundles = allFiles.filter(function (file) { return file.endsWith(".css.bundle"); });

    jsBundles.forEach(function (jsBundle) {
        var bundleDir = path.dirname(jsBundle);
        var jsFiles = fs.readFileSync(jsBundle).toString('utf-8').replace("\r", "").split("\n");
        var bundleName = jsBundle.replace('.bundle', '');

        console.log("\nprocessing " + jsBundle + ":");

        var allJs = "", allMinJs = "";
        jsFiles.forEach(function (file) {
            if (!(file = file.trim()) || file.startsWith(".")) return; // . ..

            var isCoffee = file.endsWith(".coffee"), jsFile = isCoffee
                ? file.replace(".coffee", ".js")
                : file;

            var filePath = path.join(bundleDir, file),
            jsPath = path.join(bundleDir, jsFile);
            var minJsPath = jsPath.replace(".js", ".min.js");

            var js = isCoffee
                ? getOrCreateJs(fs.readFileSync(filePath).toString('utf-8'), filePath, jsPath)
                : fs.readFileSync(jsPath).toString('utf-8');

            var minJs = getOrCreateMinJs(js, jsPath, minJsPath);

            allJs += js + ";";
            allMinJs += minJs + ";";
        });

        console.log("writing " + bundleName + "...");
        fs.writeFileSync(bundleName, allJs);
        fs.writeFileSync(bundleName.replace(".js", ".min.js"), allMinJs);
    });

    cssBundles.forEach(function (cssBundle) {
        var bundleDir = path.dirname(cssBundle);
        var cssFiles = fs.readFileSync(cssBundle).toString('utf-8').replace("\r", "").split("\n");
        var bundleName = cssBundle.replace('.bundle', '');

        console.log("\nprocessing " + cssBundle + ":");

        var allCss = "", allMinCss = "";
        cssFiles.forEach(function (file) {
            if (!(file = file.trim()) || file.startsWith(".")) return; // . ..

            var isLess = file.endsWith(".less"), jsFile = isLess
                ? file.replace(".less", ".css")
                : file;

            var filePath = path.join(bundleDir, file),
            jsPath = path.join(bundleDir, jsFile);
            var minJsPath = jsPath.replace(".css", ".min.css");

            var css = isLess
                ? getOrCreateCss(fs.readFileSync(filePath).toString('utf-8'), filePath, jsPath)
                : fs.readFileSync(jsPath).toString('utf-8');

            var minCss = getOrCreateMinCss(css, jsPath, minJsPath);

            allCss += css + ";";
            allMinCss += minCss + ";";
        });

        console.log("writing " + bundleName + "...");
        fs.writeFileSync(bundleName, allCss);
        fs.writeFileSync(bundleName.replace(".css", ".min.css"), allMinCss);
    });    

    console.log("\nDone!");
});

function getOrCreateJs(coffeeScript, csPath, jsPath) {
    var csStat = fs.statSync(csPath);

    var compileJs = !path.existsSync(jsPath)
        || fs.statSync(jsPath).mtime.getTime() < csStat.mtime.getTime();

    if (compileJs)
        console.log("compiling " + jsPath + "...");

    var js = compileJs
        ? coffee.compile(coffeeScript)
        : fs.readFileSync(jsPath).toString('utf-8');

    if (compileJs)
        fs.writeFileSync(jsPath, js);

    return js;
}

function getOrCreateMinJs(js, jsPath, minJsPath) {
    var jsStat = fs.statSync(jsPath);

    var rewriteMinJs = !path.existsSync(minJsPath)
        || fs.statSync(minJsPath).mtime.getTime() < jsStat.mtime.getTime();

    if (rewriteMinJs)
        console.log("minifying " + minJsPath + "...");

    var minJs = rewriteMinJs
        ? minifyjs(js)
        : fs.readFileSync(minJsPath).toString('utf-8');

    if (rewriteMinJs)
        fs.writeFileSync(minJsPath, minJs);

    return minJs;
}

function getOrCreateCss(less, lessPath, cssPath) {
    var csStat = fs.statSync(lessPath);

    var compileCss = !path.existsSync(cssPath)
        || fs.statSync(cssPath).mtime.getTime() < csStat.mtime.getTime();

    if (compileCss)
        console.log("compiling " + cssPath + "...");

    var css = compileCss
        ? compileLess(less)
        : fs.readFileSync(cssPath).toString('utf-8');

    if (compileCss)
        fs.writeFileSync(cssPath, css);

    return css;
}

function compileLess(lessCss) {
    var ret = "";
    less.render(function(e, css) {
        ret = css;
    });
    return ret;
}

function getOrCreateMinCss(css, cssPath, minCssPath) {
    var jsStat = fs.statSync(cssPath);

    var rewriteMinCss = !path.existsSync(minCssPath)
        || fs.statSync(minCssPath).mtime.getTime() < jsStat.mtime.getTime();

    if (rewriteMinCss)
        console.log("minifying " + minCssPath + "...");

    var minJs = rewriteMinCss
        ? cleanCss.process(css)
        : fs.readFileSync(minCssPath).toString('utf-8');

    if (rewriteMinCss)
        fs.writeFileSync(minCssPath, minJs);

    return minJs;
}

function minifyjs(js) {
    var ast = jsp.parse(js);
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
    var minJs = pro.gen_code(ast);
    return minJs;
}
