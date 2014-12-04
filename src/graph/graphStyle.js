function graphStyle(style) {
  return {
    edgeColors : style.edgeColors || d3.scale.category10().range(),
    edgeWidth : style.edgeWidth || 2,
    fontFamily : style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize : style.fontSize || 12,
    height : style.height || 400,
    margins : style.margins || {bottom: 0, left: 0, right: 0, top: 0},
    nodeColor : style.nodeColor || ['#ccc','#ccc'],
    nodeRadius : style.nodeRadius || 8,
    nodeLabelPadding : style.nodeLabelPadding || 2,
    nodeStrokeColor : style.nodeStrokeColor || '#aaa',
    nodeStrokeWidth : style.nodeStrokeWidth || 1,
    width : style.width || 400,
  };
}