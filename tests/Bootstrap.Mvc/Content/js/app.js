(function() {
  var cube, square;

  square = function(a) {
    return a * a;
  };

  cube = function(a) {
    return a * a * a;
  };

  $("BODY").append("<div id='lesstest'>From CoffeeScript with Less</div>");

}).call(this);
