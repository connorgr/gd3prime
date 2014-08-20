function cnaStyle(style) {
  return {
    fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
    geneHeight: 24,
    genomeAreaHeight: 40,
    genomeBarHeight: 14,
    height: style.height || 200,
    horizontalBarHeight: style.horizontalBarHeight || 5,
    horizontalBarSpacing: style.horizontalBarSpacing || 6,
    width: style.width || 500
  };
}