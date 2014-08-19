import "cnaData";

function cnaChart(style) {
  function chart(selection) {
    selection.each(function(data) {
      data = cnaData(data);
    });//end selection.each()
  }
  return chart;
}