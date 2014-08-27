function transcriptStyle(style) {
  return {
    fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    height: style.height || 200,
    numXTicks: style.numXTicks || 5,
    symbolWidth: style.symbolWidth || 20,
    transcriptBarHeight: style.transcriptBarHeight || 20,
    width: style.width || 500,
    xTickPadding: style.xTickPadding || 1.25
  };
}