(function() {
  var cube, square;

  square = function(a) {
    return a * a;
  };

  cube = function(a) {
    return a * a * a;
  };

  $("BODY").append("<div id='lesstest'>From CoffeeScript with Less!</div>");

  $("BODY").append("<div id='scsstest'>From CoffeeScript with Scss!</div>");

}).call(this);
