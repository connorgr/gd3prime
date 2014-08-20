function cnaStyle(style) {
  return {
    fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    fontSize: style.fontSize || '12px',
    geneColor: style.geneColor || '#aaa',
    geneHeight: style.geneHeight || 24,
    geneHighlightColor: style.geneHighlightColor || '#f00',
    geneSelectedColor: style.geneSelectedColor || '#f00',
    genomeAreaHeight: style.genomeAreaHeight || 40,
    genomeBarHeight: style.genomeBarHeight || 14,
    height: style.height || 200,
    horizontalBarHeight: style.horizontalBarHeight || 5,
    horizontalBarSpacing: style.horizontalBarSpacing || 6,
    width: style.width || 500
  };
}