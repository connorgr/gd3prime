function mutmtxData(data) {
  function parseCancer(d) {
    // TODO: Need to percolate these down from the main function
    var showDuplicates = false,
        columnTypeToInclude = [],
        colorColumnTypes = true;

    var result = {
      byColumn: {},
      columnNames: data.samples,
      columnsToTypes: d.sampleToTypes || {},
      columnTypes: d.sampleTypes || [],
      hiddenColumns: [],
      numRows: Object.keys(d.M).length,
      raw: d.M,
      rowNames: Object.keys(d.M).sort(),
      typesToColumns: d.typeToSamples || {}
    };

    // If no columns (i.e., samples) were provided, construct them
    if (!result.columnNames) {
      result.columnNames = Object.keys(result.columnsToTypes).sort();
    }

    // Collect all unique types for all columns
    for (var i = 0; i < result.columnNames.length; i++) {
      var cs = result.columnNames;
      if(result.columnTypes.indexOf(result.columnsToTypes[cs[i]]) == -1) {
        result.columnTypes.push(result.columnsToTypes[cs[i]]);
      }
    }
    result.columnTypes.sort();
    result.columnTypes.forEach(function(t){ columnTypeToInclude[t] = true; });

    // Add multiple dataset field
    result.multiDataset = (result.columnTypes.length > 1) && colorColumnTypes;

    // Calculate the number of columns in the data
    if (showDuplicates) {
      result.numColumns = result.columnTypes.reduce(function(total, t){ return total + result.typesToColumns[t].length; }, 0);
    } else {
      var allSampleNames = {};
      if (Object.keys(result.typesToColumns).length > 0) {
        columnTypes.forEach(function(t) {
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
    for (var c in result.columnNames) {
      var name = result.columnNames[c];
      result.byColumn[name] = {}
      result.byColumn[name].activeRows = []; // Initialize all cells to be inactive (i.e., unshaded)
    }
    // Apply matrix cell activation data
    for (var k in Object.keys(result.rowsToColumns)) {
      var key = Object.keys(result.rowsToColumns)[k],
          rTC = result.rowsToColumns,
          row = rTC[key];
      row.forEach(function(col) {result.byColumn[col].activeRows.push(key);});
    }


    result.getColumnNames = function() {
      return result.columnNames.filter(function(name) {
        return result.hiddenColumns.indexOf(name) == -1
      });
    }


    result.getVizData = function() {
      var cNames = result.columnNames,
          data = [];
      for (var i = 0; i < cNames.length; i++) {
        var name = cNames[i],
            entry = {key:name, value:result.byColumn[name]};
        // Only add the entry if it is not hidden
        if (result.hiddenColumns.indexOf(name) == -1) {
          data.push(entry);
        }
      }
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
      result.columnNames.sort(function(c1,c2) {
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
        for (var n in result.columnNames) {
          var name = result.columnNames[n];
          if (n == 0) {
            group.push(name);
          } else {
            var prevName = result.columnNames[n-1],
                curRows = result.byColumn[name].activeRows,
                prevRows = result.byColumn[prevName].activeRows,
                numActiveCur = curRows.length,
                numActivePrev = prevRows.length;
            if (numActiveCur != numActivePrev || gd3_util.arraysEqual(curRows,prevRows) == false) {
              listOfGroups.push(group);
              group = [name];
            } else {
              group.push(name);
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