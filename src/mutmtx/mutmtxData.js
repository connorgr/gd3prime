function mutmtxData(inputData) {
  var data = {
    datasets: [],
    labels: {
      columns: [],
      rows: []
    },
    maps: {
      columnIdToLabel: {},
      rowIdToLabel: {}
    },
    matrix: {}
  };

  data.get = function(attr) {
    if (!attr) return null;
    else if (attr === 'datasets') return data.datsets;
    else if (attr === 'labels') return data.labels;
    else if (attr === 'matrix') return data.matrix;
  }

  function parseMagi() {
    // Adds dataset information to matrix and creates a dataset set
    function parseDatasets() {
      var matrix = data.matrix,
          datasetList = {};
      for (var rowKey in matrix) {
        if (matrix.hasOwnProperty(rowKey)) {
          for (var colKey in matrix[rowKey]) {
            if (matrix[rowKey].hasOwnProperty(colKey)) {
              dataset = inputData.sampleToTypes[colKey];
              matrix[rowKey][colKey].dataset = dataset;
              datasetList[dataset] = null;
            }
          }
        }
      }
      data.datasets = Object.keys(datasetList);
    } // end addDatasetsToMatrix()


    data.matrix = inputData.M;

    // Scrape labels from the matrix
    inputData.samples.forEach(function(s) {
      data.maps.columnIdToLabel[s._id] = s.name;
      data.labels.columns.push(s.name);
    });
    Object.keys(inputData.M).forEach(function(k, i) {
      data.maps.rowIdToLabel[i] = k;
      data.labels.rows.push(k);
    });

    parseDatasets();
  }

  parseMagi();

  console.log(inputData);
  console.log(data);

  return data;
}