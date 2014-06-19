; 
function doJavaScript(el) {
    el.style.backgroundColor = 'green';
}

;(function() {
  var root;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.doCoffeeScript = function(el) {
    return el.style.backgroundColor = 'green';
  };

}).call(this);

;(function(){
  var root;
  root = typeof exports != 'undefined' && exports !== null ? exports : this;
  root.doLiveScript = function(el){
    return el.style.backgroundColor = 'green';
  };
}).call(this);

