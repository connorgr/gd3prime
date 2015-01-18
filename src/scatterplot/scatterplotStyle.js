function scatterplotStyle(style) {
  return {
    fontFamily : style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize : style.fontSize || 12,
    height : style.height || 200,
    legendFontSize : style.legendFontSize || 11,
    legendScaleWidth : style.legendScaleWidth || 30,
    legendWidth : style.legendWidth || 75,
    margins : style.margins || {bottom: 0, left: 0, right: 0, top: 0},
    width : style.width || 300,
  };
}