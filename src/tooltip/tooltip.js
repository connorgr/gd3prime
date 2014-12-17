import "tooltipStyle";
import "tooltipView";

////////////////////////////////////////////////////////////////////////////////
// INFORMATION ABOUT GD3.TOOLTIP
//
// The gd3.tooltip() component is largely based on Justin Palmer's d3-tip
// plug-in (https://github.com/Caged/d3-tip). Lots and lots of thanks, Justin!
//
// Differences:
//   1. d3-tip is built such that only one tooltip can exist in a document,
//        we altered this behavior, such that each call of gd3.tooltip() creates
//        a brand new instance, meaning ∞ tooltips!
//   2. to make making tooltips easier with complex data we've created a
//        primitive type language for tooltip data that in turn lead to content
//        factories that can automatically populate and format tooltips
//

gd3.tooltip = function(params) {
  var params = params || {},
      style  = tooltipStyle(params.style || {}),
      votingFns = params.votingFns || {};

  // annotation functions as a partial application, binding the given variables
  //   into the returned instance.
  return tooltipView(style);
};