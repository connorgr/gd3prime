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
    function addDatasetsToMatrix() {
      var matrix = data.matrix;
      for (var rowKey in matrix) {
        if (matrix.hasOwnProperty(rowKey)) {
          for (var colKey in matrix[rowKey]) {
            if (matrix[rowKey].hasOwnProperty(colKey)) {
              matrix[rowKey][colKey].dataset = inputData.sampleToTypes[colKey];
            }
          }
        }
      }
    } // end addDatasetsToMatrix()


    data.matrix = inputData.M;

    // Scrape labels from the matrix
    inputData.samples.forEach(function(s) { columns[s._id] = s.name; });
    Object.keys(inputData.M).forEach(function(k, i) {
      data.labels.rows[i] = k;
    });

    addDatasetsToMatrix();
  }

  parseMagi();

  console.log(inputData);
  console.log(data);

  return data;
}