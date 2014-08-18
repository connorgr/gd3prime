function transcriptStyle(style) {
  return {
    height: style.height || 200,
    numXTicks: style.numXTicks || 5,
    symbolWidth: style.symbolWidth || 10,
    transcriptBarHeight: style.transcriptBarHeight || 20,
    width: style.width || 500,
    xTickPadding: style.xTickPadding || 1.25
  };
}