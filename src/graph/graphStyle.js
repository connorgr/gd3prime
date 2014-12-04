function graphStyle(style) {
  return {
    fontFamily : style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize : style.fontSize || 12,
    height : style.height || 400,
    margins : style.margins || {bottom: 0, left: 0, right: 0, top: 0},
    nodeColor : style.nodeColor || ['#666','#666'],
    nodeRadius : style.nodeRadius || 8,
    nodeLabelPadding : style.nodeLabelPadding || 2,
    nodeStrokeColor : style.nodeStrokeColor || '#333',
    nodeStrokeWidth : style.nodeStrokeWidth || 1,
    width : style.width || 400,
  };
}