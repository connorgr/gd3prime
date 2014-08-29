import "annotationStyle";
import "annotationView";

gd3.annotation = function(params) {
  var params = params || {},
      style  = annotationStyle(params.style || {});

  // annotation functions as a partial application, binding the given variables
  //   into the returned instance.
  return annotationView(style);
};