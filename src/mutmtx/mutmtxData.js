function mutmtxData(inputData) {
  var data = {
    datasets: [],
    ids: {
      columns: [],
      rows: []
    },
    labels: {
      columns: [],
      rows: []
    },
    maps: {
      columnIdToLabel: {},
      rowIdToLabel: {}
    },
    matrix: {
      cells : {},
      columnIdToActiveRows = {},
      rowIdToActiveColumns = {}
    }, // constructed below
  };

  data.get = function(attr) {
    if (!attr) return null;
    else if (attr === 'datasets') return data.datasets;
    else if (attr === 'ids') return data.ids;
    else if (attr === 'labels') return data.labels;
  }

  function parseMagi() {
    // Scrape labels from the matrix
    inputData.samples.forEach(function(s) {
      data.maps.columnIdToLabel[s._id] = s.name;
      data.labels.columns.push(s.name);
    });
    Object.keys(inputData.M).forEach(function(k, i) {
      data.maps.rowIdToLabel[i] = k;
      data.labels.rows.push(k);
    });
    data.ids.columns = Object.keys(data.maps.columnIdToLabel);
    data.ids.rows = Object.keys(data.maps.rowIdToLabel);

    // Make set of datasets in data
    var setOfDatasets = {};
    Object.keys(inputData.sampleToTypes).forEach(function(colId) {
      setOfDatasets[inputData.sampleToTypes[colId]] = null;
    });
    data.datasets = Object.keys(setOfDatasets);

    // Build matrix data and maps
    Object.keys(inputData.M).forEach(function(rowLabel, rowId) {
      var columns = Object.keys(inputData.M[rowLabel]);
      // Add rowId -> columns mapping
      data.matrix.rowIdToActiveColumns[rowId] = columns;
      // Add columnId -> row mapping
      columns.forEach(function(colId) {
        // If the entry doesn't exist, build it
        if(!data.matrix.columnIdToActiveRows[colId]) {
          data.matrix.columnIdToActiveRows[colId] = [];
        }
        // Add the row to the column
        data.matrix.columnIdToActiveRows[colId].push(rowId);

        // Add cell data
        data.matrix.cells[[rowId,colId].join()] = {
          dataset: inputData.sampleToTypes[colId],
          type: inputData.M[rowLabel][colId][0]
        };
        // Track which datasets have been added
      });
    }); // end matrix mapping
    console.log(data.matrix);
    console.log('----');
  }

  parseMagi();

  console.log(inputData);
  console.log(data);

  return data;
}