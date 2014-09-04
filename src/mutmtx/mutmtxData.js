
function mutmtxData(data) {
  function parseCancer(d) {
    // TODO: Need to percolate these down from the main function
    var showDuplicates = false,
        columnTypeToInclude = [],
        colorColumnTypes = true;

    var result = {
      byColumn: {},
      columnsToTypes: d.sampleToTypes || {},
      columnTypes: d.sampleTypes || [],
      hiddenColumns: [],
      numRows: Object.keys(d.M).length,
      raw: d.M,
      rowNames: Object.keys(d.M).sort(),
      typesToColumns: d.typeToSamples || {}
    };

    // If no columns (i.e., samples) were provided, raise an error
    if (!data.samples) {
      throw 'No .samples field given with mutation matrx data. .samples should be an array, where each element corresponds to a column. Each element should have a ._id and a .name.';
    }

    result.columnIds = data.samples.map(function(s) { return s._id; });
    result.columnNames = data.samples.map(function(s) { return s.name; });
    result.columnIdsToNames = {};
    for (var i in data.samples) {
      var sample = data.samples[i];
      result.columnIdsToNames[sample._id] = sample.name;
    }

    // Collect all unique types for all columns, and store in .columnTypes
    for (var i = 0; i < result.columnNames.length; i++) {
      var cs = result.columnIds;
      if(result.columnTypes.indexOf(result.columnsToTypes[cs[i]]) == -1) {
        result.columnTypes.push(result.columnsToTypes[cs[i]]);
      }
    }
    result.columnTypes.sort();
    result.columnTypes.forEach(function(t){ columnTypeToInclude[t] = true; });

    result.columnTypes = result.columnTypes.filter(function(t){ return t != undefined; });

    // Add multiple dataset field
    result.multiDataset = (result.columnTypes.length > 1) && colorColumnTypes;


    // Calculate the number of columns in the data
    if (showDuplicates) {
      result.numColumns = result.columnTypes.reduce(function(total, t){ return total + result.typesToColumns[t].length; }, 0);
    } else {
      var allSampleNames = {};
      if (Object.keys(result.typesToColumns).length > 0) {
        result.columnTypes.forEach(function(t) {
          result.typesToColumns[t].forEach(function(s){ allSampleNames[s] = true; });
        });
      }
      result.numColumns = Object.keys(allSampleNames).length;
    }

    // Map each row to the columns they are associated with (e.g., mutated in)
    result.rowsToColumns = {};
    for(i = 0; i < result.rowNames.length; i++) {
      result.rowsToColumns[result.rowNames[i]] = Object.keys(result.raw[result.rowNames[i]]);
    }

    // Sort rows by their coverage, and make a map of each entry to its row index
    result.rowToIndex = {};
    result.sortedRows = result.rowNames.sort(function(r1,r2) {
      return result.rowsToColumns[r1].length < result.rowsToColumns[r2].length ? 1 : -1;
    });
    d3.range(0, result.rowNames.length).forEach(function(i){ result.rowToIndex[result.sortedRows[i]] = i; });


    // Convert the data such that it is stored in column-major order
    for (var c in result.columnIds) {
      var cId = result.columnIds[c];
      result.byColumn[cId] = {}
      result.byColumn[cId].activeRows = []; // Initialize all cells to be inactive (i.e., unshaded)
    }
    // Apply matrix cell activation data
    for (var k in Object.keys(result.rowsToColumns)) {
      var key = Object.keys(result.rowsToColumns)[k],
          rTC = result.rowsToColumns,
          row = rTC[key];
      row.forEach(function(col) {
        var testAnnotation = []
        annotation.push({
          text: 'Test',
          title: 'Sample',
          type: 'text'
        });
        var cellInformation = {
          annotation: testAnnotation,
          row: key
        };
        result.byColumn[col].activeRows.push(key);
      });
    }


    result.getColumnIds = function() {
      return result.columnIds.filter(function(name) {
        return result.hiddenColumns.indexOf(name) == -1
      });
    }


    result.getColumnNames = function() {
      return result.columnIds.filter(function(name) {
        return result.hiddenColumns.indexOf(name) == -1
      }).map(function(id) {
        return result.columnIdsToNames[id];
      });
    }


    result.getVisibleColumns = function() {
      var cIds = result.columnIds,
          data = [];
      for (var i = 0; i < cIds.length; i++) {
        var cId = cIds[i];

        // Only add the entry if it is not hidden
        if (result.hiddenColumns.indexOf(cId) == -1) {
          var entry = {key:cId, value:result.byColumn[name._id]};
          data.push(entry);
        }
      }
      return data;
    }


    result.getVizData = function() {
      var cIds = result.columnIds,
          data = [],
          currentGroup = [];
      for (var i = 0; i < cIds.length; i++) {
        var cId = cIds[i],
            entry = {key:cId, value:result.byColumn[cId]};
        // Only add the entry if it is not hidden
        if (result.hiddenColumns.indexOf(name) == -1) {
          currentGroup.push(entry);
        } else if(currentGroup.length > 0) {
          data.push(currentGroup);
          currentGroup = [];
        }
      }
      data.push(currentGroup);
      return data;
    }


    result.reorderColumns = function() {
      function sortByExclusivity(c1, c2) {
        var c1X = result.byColumn[c1].activeRows.length > 1,
            c2X = result.byColumn[c2].activeRows.length > 1;
        return d3.ascending(c1X, c2X);
      }
      function sortByFirstActiveRow(c1, c2) {
        function getFirstActiveRow(prevRow, row) {
          var prevIndex = result.rowNames.indexOf(prevRow),
              curIndex = result.rowNames.indexOf(row);
          return prevIndex < curIndex ? prevIndex : curIndex;
        }
        var c1Rows = result.byColumn[c1].activeRows,
            c2Rows = result.byColumn[c2].activeRows,
            c1First = c1Rows.reduce(getFirstActiveRow),
            c2First = c2Rows.reduce(getFirstActiveRow);
        return d3.descending(c1First,c2First);
      }
      function sortByName(c1,c2) {
        return d3.ascending(c1,c2);
      }
      function sortByColumnType(c1,c2) {
        return d3.ascending(result.columnsToTypes[c1], result.columnsToTypes[c2]);
      }

      var sortFns = [sortByFirstActiveRow, sortByColumnType, sortByExclusivity, sortByName];
      result.columnIds.sort(function(c1,c2) {
        var sortResult;
        for(var i = 0; i < sortFns.length; i++) {
          sortResult = sortFns[i](c1,c2);
          if (sortResult != 0) {
            return sortResult;
          }
        }
        return sortResult;
      });
    } // end result.reorderColumns();

    result.summarize = function(yes, threshold) {
      var threshold = threshold || 20;
      result.hiddenColumns = [];
      if(yes) {
        var listOfGroups = [],
            group = [];
        for (var i in result.columnIds) {
          var cId = result.columnIds[i];
          if (i == 0) {
            group.push(cId);
          } else {
            var prevCId = result.columnIds[i-1],
                curRows = result.byColumn[cId].activeRows,
                prevRows = result.byColumn[prevCId].activeRows,
                numActiveCur = curRows.length,
                numActivePrev = prevRows.length;
            if (numActiveCur != numActivePrev || gd3_util.arraysEqual(curRows,prevRows) == false) {
              listOfGroups.push(group);
              group = [cId];
            } else {
              group.push(cId);
            }
          }
        }

        listOfGroups.push(group);

        for (var i in listOfGroups) {
          var group = listOfGroups[i];
          if (group.length < threshold) {
            continue;
          }
          for (var column in group) {
            result.hiddenColumns.push(group[column]);
          }
        }
      }
    } // end result.summarize()


    return result;
  }
  var mutmtxData = parseCancer(data);

  return mutmtxData;
}