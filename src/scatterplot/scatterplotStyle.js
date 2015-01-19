function scatterplotStyle(style) {
  return {
    categoryColors : d3.scale.category10().range(),
    categoryShapes : ['circle', 'diamond', 'cross', 'triangle-down', 'square', 'triangle-up'],
    fontFamily : style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize : style.fontSize || 12,
    height : style.height || 300,
    legendFontSize : style.legendFontSize || 11,
    legendScaleWidth : style.legendScaleWidth || 30,
    legendWidth : style.legendWidth || 75,
    margins : style.margins || {bottom: 50, left: 25, right: 15, top: 15},
    width : style.width || 300,
  };
}