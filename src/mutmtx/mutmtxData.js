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
    matrix: {}, // constructed below
  };

  data.get = function(attr) {
    if (!attr) return null;
    else if (attr === 'datasets') return data.datasets;
    else if (attr === 'labels') return data.labels;
  }

  function parseMagi() {
    // Adds dataset information to matrix and creates a dataset set
    function parseDatasets() {
      var matrix = inputData.M,
          datasetList = {};

      matrix.forEach(function (row) {
        row.forEach(function (column) {
          dataset = inputData.sampleToTypes[colKey];
          // Add dataset to matrix
              matrix[rowKey][colKey].dataset = dataset;
              datasetList[dataset] = null;
        });
      });
      data.datasets = Object.keys(datasetList);
    } // end addDatasetsToMatrix()


    //data.matrix = inputData.M;
    console.log(inputData.M);

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
    data.ids.rows = Object.keys(data.maps.rows);

    parseDatasets();
  }

  parseMagi();

  console.log(inputData);
  console.log(data);

  return data;
}