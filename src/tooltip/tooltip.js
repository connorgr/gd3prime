import "tooltipStyle";
import "tooltipView";

gd3.tooltip = function(params) {
  var params = params || {},
      style  = tooltipStyle(params.style || {}),
      votingFns = params.votingFns || {};

  // annotation functions as a partial application, binding the given variables
  //   into the returned instance.
  return tooltipView(style);
};