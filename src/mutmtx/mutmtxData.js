function mutmtxData(inputData) {
  var data = {
    datasets: [],
    labels: {
      columns: {},
      rows: {}
    },
    matrix: {}
  };

  data.get = function(attr) {
    if (!attr) return null;
    if (attr === 'matrix') return data.matrix;
    if (attr === 'labels') return data.labels;
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
    inputData.samples.forEach(function(s) { data.labels.columns[s._id] = s.name; });
    Object.keys(inputData.M).forEach(function(k, i) {
      data.labels.rows[i] = k;
    });

    parseDatasets();
  }

  parseMagi();

  console.log(inputData);
  console.log(data);

  return data;
}