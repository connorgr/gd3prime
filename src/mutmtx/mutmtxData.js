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
      columnIdToType: {},
      rowIdToLabel: {}
    },
    matrix: {
      cells : {},
      columnIdToActiveRows : {},
      rowIdToActiveColumns : {}
    },
  };

  data.get = function(attr) {
    if (!attr) return null;
    else if (attr === 'datasets') return data.datasets;
    else if (attr === 'ids') return data.ids;
    else if (attr === 'labels') return data.labels;
  }

  data.reorderColumns = function() {
    function sortByExclusivity(c1, c2) {
      var c1X = data.matrix.columnIdToActiveRows[c1].length > 1,
          c2X = data.matrix.columnIdToActiveRows[c2].length > 1;
      return d3.ascending(c1X, c2X);
    }
    function sortByFirstActiveRow(c1, c2) {
      var c1First = data.matrix.columnIdToActiveRows[c1][0],
          c2First = data.matrix.columnIdToActiveRows[c2][0];
      return d3.ascending(c1First,c2First);
    }
    function sortByName(c1,c2) {
      return d3.ascending(data.labels.columns[c1],data.labels.columns[c2]);
    }
    function sortByColumnType(c1,c2) {
      return d3.ascending(data.maps.columnIdToType[c1], data.maps.columnIdToType[c2]);
    }

    var sortFns = [sortByFirstActiveRow, sortByColumnType, sortByExclusivity, sortByName];
    data.ids.columns.sort(function(c1,c2) {
      var sortResult;
      for(var i = 0; i < sortFns.length; i++) {
        sortResult = sortFns[i](c1,c2);
        if (sortResult != 0) {
          return sortResult;
        }
      }
      return sortResult;
    });
  } // end data.reorderColumns()

  function defaultParse() {
    // Scrape labels from the matrix
    inputData.samples.forEach(function(s) {
      data.maps.columnIdToLabel[s._id] = s.name;
      data.labels.columns.push(s.name);
    });
    Object.keys(inputData.M).forEach(function(k, i) {
      data.maps.rowIdToLabel[i.toString()] = k;
      var numSamples = Object.keys(inputData.M[k]).length;
      data.labels.rows.push(k + ' ('+numSamples+')');
    });
    data.ids.columns = Object.keys(data.maps.columnIdToLabel);
    data.ids.rows = Object.keys(data.maps.rowIdToLabel);

    // Make set of datasets in data
    var setOfDatasets = {};
    Object.keys(inputData.sampleToTypes).forEach(function(colId) {
      setOfDatasets[inputData.sampleToTypes[colId]] = null;
      data.maps.columnIdToType[colId] = inputData.sampleToTypes[colId];
    });
    data.datasets = Object.keys(setOfDatasets);

    // Build matrix data and maps
    Object.keys(inputData.M).forEach(function(rowLabel, rowId) {
      var columns = Object.keys(inputData.M[rowLabel]);
      rowId = rowId.toString();
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
  }

  defaultParse();

  // sample annotation data processing, if present
  if(inputData.annotations) {
    data.annotations = inputData.annotations;
  }

  // create simulated annotation data if it does not exist.
  // Object.keys(data.matrix.cells).forEach(function(key) {
  //   if (data.matrix.cells[key].annotation == undefined) {
  //     var vote = {
  //       type: 'vote',
  //       score: 100
  //     }
  //     var link = {
  //       type: 'link',
  //       href: 'http://www.cs.brown.edu',
  //       text: 'BrownCS'
  //     }
  //     data.matrix.cells[key].annotation = [
  //       {
  //         type: 'text',
  //         title: 'Sample',
  //         text: key
  //       },
  //       {
  //         type: 'table',
  //         header: ['Cancer', 'PMIDs', 'Votes'],
  //         data: [
  //           ['1', link, vote],
  //           ['4', link, vote]
  //         ]
  //       }
  //     ];
  //   }
  // }); // end simulated annotation data

  return data;
}