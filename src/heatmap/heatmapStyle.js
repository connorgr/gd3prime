function heatmapStyle(style) {
  return {
    cellHeight : style.cellHeight || 14,
    cellWidth : style.cellWidth || 14,
    colorScale : style.colorScale || ['rgb(255,255,217)','rgb(237,248,177)','rgb(199,233,180)','rgb(127,205,187)','rgb(65,182,196)','rgb(29,145,192)','rgb(34,94,168)','rgb(37,52,148)','rgb(8,29,88)'],
    fontFamily : style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize : style.fontSize || '10px',
    height : style.height || 400,
    margins : style.margins || {bottom: 0, left: 0, right: 0, top: 0},
    noCellValueColor : style.noCellValueColor || '#a7a7a7',
    width : style.width || 400,
  };
}