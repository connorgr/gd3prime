!function() {
  var gd3 = {version: '0.2.1'};
// Thanks goes to mbostock and D3 implementation
// https://github.com/mbostock/d3/blob/master/src/core/class.js

function gd3_class(ctor, properties) {
  try {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  } catch (e) {
    ctor.prototype = properties;
  }
}
var gd3_util = {
  arraysEqual: function(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;

        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.

        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
}
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
      // result.columnNames.sort(function(c1,c2) {
      //   var c1Gene = result.byColumn[c1].activeRows[0] || '',
      //       c2Gene = result.byColumn[c2].activeRows[0] || '';
      //   return d3.ascending(c1Gene,c2Gene);
      // });

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
        return d3.ascending(c1First,c2First);
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

function mutmtxChart(style) {
  var options = {
    showSummary: false
  }
  function chart(selection) {
    selection.each(function(data) {
      data = mutmtxData(data);

      var height = style.fullHeight,
          width = style.fullWidth;

      // Determine coloration
      var d3color = d3.scale.category20(),
          colTypeToColor = {};
      for (var i = 0; i < data.columnTypes.length; i++) {
        colTypeToColor[data.columnTypes[i]] = d3color(i);
      }

      // Select the svg element, if it exists.
      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg');

      // Scales for the height/width of rows/columns
      var x = d3.scale.linear()
          .domain([0, data.numUniqueColumns])
          .range([style.labelWidth + style.boxMargin, style.width - style.boxMargin]);

      // Zoom behavior
      var zoom = d3.behavior.zoom()
          .x(x)
          .scaleExtent([1, Math.round( style.minBoxWidth * data.numUniqueColumns / style.width)])
          .on('zoom', function() { renderMutationMatrix(); });

      svg.attr('id', 'mutation-matrix')
          .attr('width', width)
          .attr('height', height + style.labelHeight)
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .call(zoom);

      data.reorderColumns();
      data.summarize(true, 40);
      renderMutationMatrix();

      function renderMutationMatrix() {
        var matrix = svg.append('g'),
            columns = matrix.selectAll('g')
                .data(data.getVizData())
                .enter()
                .append('g')
                  .attr('id', function(d) { return d.key; })
                  .attr('transform', function(d) {
                    return 'translate('+data.columnNames.indexOf(d.key)+',0)';
                  });
        columns.selectAll('rect')
          .data(function(d){ return d.value.activeRows.map(function(row){return {row:row, type:data.columnsToTypes[d.key]}});})
          .enter()
          .append('rect')
            .attr('x', 0)
            .attr('y', function(d) {
              return style.rowHeight*data.rowNames.indexOf(d.row);
            })
            .attr('height', style.rowHeight)
            .attr('width', 1)
            .style('fill', function(d) { return colTypeToColor[d.type]; });
      }
    });

    if(options.showSummary == true) {
      selection.append('p').text('hello');
    }
  }

  chart.addSummaryToggle = function(state) {
    var state = state || true;
    options.showSummary(state);
    return chart;
  }

  return chart;
}

function mutmtxStyle(style) {
  console.log(style);
  return {
      animationSpeed : style.animationSpeed || 300,
      bgColor : style.bgColor || '#F6F6F6',
      blockColorMedium : style.blockColorMedium || '#95A5A6',
      blockColorStrongest : style.blockColorStrongest || '#2C3E50',
      boxMargin : style.boxMargin || 5, // assumes uniform margins on all sides
      colorSampleTypes : style.colorSampleTypes || true,
      coocurringColor : style.coocurringColor || 'orange',
      exclusiveColor : style.exclusiveColor || 'blue',
      fullWidth : style.width || 500,
      fullHeight : style.height || 300,
      rowHeight : style.rowHeight || 20,
      labelHeight : style.labelHeight || 40,
      labelWidth : style.labelWidth || 100,
      minBoxWidth : style.minBoxWidth || 20,
      mutationLegendHeight : style.mutationLegendHeight || 30,
      sampleStroke : style.sampleStroke || 1
  };
}

gd3.mutationMatrix = function(params) {
  var params = params || {},
      style  = mutmtxStyle(params.style || {});

  // mutmtxChart functions as a partial application, binding the given variables
  //   into the returned instance.
  return mutmtxChart(style);
};

  if (typeof define === 'function' && define.amd) define(gd3);
  else if (typeof module === 'object' && module.exports) module.exports = gd3;
  this.gd3 = gd3;
}();
