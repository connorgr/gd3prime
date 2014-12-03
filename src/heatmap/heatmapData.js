function heatmapData(inputData) {
  var data = {
    cells : [],
    maxCellValue : Number.NEGATIVE_INFINITY,
    minCellValue : Number.POSITIVE_INFINITY,
    xs : [],
    ys : []
  }


  function defaultParse () {
    data.cells = inputData.cells;
    data.xs = inputData.xs;
    data.ys = inputData.ys;

    // Find max and min values to make color scale
    var tmp;
    for (var i=data.cells.length-1; i>=0; i--) {
      tmp = data.cells[i].value;
      if (tmp > data.maxCellValue) data.maxCellValue = tmp;
      if (tmp < data.minCellValue) data.minCellValue = tmp;
    }
  }

  defaultParse();

  return data;
}