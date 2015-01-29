function heatmapData(inputData) {
  var data = {
    annotations : undefined,
    cells : [],
    maxCellValue : Number.NEGATIVE_INFINITY,
    minCellValue : Number.POSITIVE_INFINITY,
    xs : [],
    ys : []
  }


  function defaultParse () {
    data.cells = inputData.cells;
    data.name = inputData.name;
    data.xs = inputData.xs;
    data.ys = inputData.ys;

    data.annotations = inputData.annotations;

    // Find max and min values to make color scale
    var tmp;
    for (var i=data.cells.length-1; i>=0; i--) {
      tmp = data.cells[i].value;
      if (tmp > data.maxCellValue) data.maxCellValue = tmp;
      if (tmp < data.minCellValue) data.minCellValue = tmp;
    }

    if(data.annotations) {
      if(!data.annotations.annotationToColor) data.annotations.annotationToColor = {};

      data.annotations.categories.forEach(function(category) {
        var entry = data.annotations.annotationToColor[category];
        if(entry && Object.keys(entry).length > 0) return;

        var categoryIndex = data.annotations.categories.indexOf(category);

        // Assume the data is continuous and find the min and max of the category
        var annotationNames = Object.keys(data.annotations.sampleToAnnotations),
            values = annotationNames.map(function(n) {
              return data.annotations.sampleToAnnotations[n][categoryIndex];
            });

        entry = [d3.min(values), d3.max(values)];

        data.annotations.annotationToColor[category] = entry;

      });
    }
  }

  defaultParse();

  data.sortColumns = function (columnIds) {
    // process columnIDs, not terribly fast
    columnIds = columnIds.map(function(c) {
      var x = null,
          i = 0;
      for(i; i < data.xs.length; i++) {
        if(c.indexOf(data.xs[i]) > 1) x = data.xs[i];
        break;
      }

      return x;
    });

    columnIds = columnIds.filter(function(d) { return d != null; });

    // we now have the ordering of column Ids
    data.xs.sort(function(a,b) { return columnIds.indexOf(a) - columnIds.indexOf(b); });
  }

  return data;
}