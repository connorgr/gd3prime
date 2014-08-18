!function() {
  var gd3 = {
    version: "0.2.1"
  };
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
      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
  };
  function mutmtxData(data) {
    function parseCancer(d) {
      var showDuplicates = false, columnTypeToInclude = [], colorColumnTypes = true;
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
      if (!result.columnNames) {
        result.columnNames = Object.keys(result.columnsToTypes).sort();
      }
      for (var i = 0; i < result.columnNames.length; i++) {
        var cs = result.columnNames;
        if (result.columnTypes.indexOf(result.columnsToTypes[cs[i]]) == -1) {
          result.columnTypes.push(result.columnsToTypes[cs[i]]);
        }
      }
      result.columnTypes.sort();
      result.columnTypes.forEach(function(t) {
        columnTypeToInclude[t] = true;
      });
      result.multiDataset = result.columnTypes.length > 1 && colorColumnTypes;
      if (showDuplicates) {
        result.numColumns = result.columnTypes.reduce(function(total, t) {
          return total + result.typesToColumns[t].length;
        }, 0);
      } else {
        var allSampleNames = {};
        if (Object.keys(result.typesToColumns).length > 0) {
          columnTypes.forEach(function(t) {
            result.typesToColumns[t].forEach(function(s) {
              allSampleNames[s] = true;
            });
          });
        }
        result.numColumns = Object.keys(allSampleNames).length;
      }
      result.rowsToColumns = {};
      for (i = 0; i < result.rowNames.length; i++) {
        result.rowsToColumns[result.rowNames[i]] = Object.keys(result.raw[result.rowNames[i]]);
      }
      result.rowToIndex = {};
      result.sortedRows = result.rowNames.sort(function(r1, r2) {
        return result.rowsToColumns[r1].length < result.rowsToColumns[r2].length ? 1 : -1;
      });
      d3.range(0, result.rowNames.length).forEach(function(i) {
        result.rowToIndex[result.sortedRows[i]] = i;
      });
      for (var c in result.columnNames) {
        var name = result.columnNames[c];
        result.byColumn[name] = {};
        result.byColumn[name].activeRows = [];
      }
      for (var k in Object.keys(result.rowsToColumns)) {
        var key = Object.keys(result.rowsToColumns)[k], rTC = result.rowsToColumns, row = rTC[key];
        row.forEach(function(col) {
          result.byColumn[col].activeRows.push(key);
        });
      }
      result.getColumnNames = function() {
        return result.columnNames.filter(function(name) {
          return result.hiddenColumns.indexOf(name) == -1;
        });
      };
      result.getVisibleColumns = function() {
        var cNames = result.columnNames, data = [];
        for (var i = 0; i < cNames.length; i++) {
          var name = cNames[i], entry = {
            key: name,
            value: result.byColumn[name]
          };
          if (result.hiddenColumns.indexOf(name) == -1) {
            data.push(entry);
          }
        }
        return data;
      };
      result.getVizData = function() {
        var cNames = result.columnNames, data = [], currentGroup = [];
        for (var i = 0; i < cNames.length; i++) {
          var name = cNames[i], entry = {
            key: name,
            value: result.byColumn[name]
          };
          if (result.hiddenColumns.indexOf(name) == -1) {
            currentGroup.push(entry);
          } else if (currentGroup.length > 0) {
            data.push(currentGroup);
            currentGroup = [];
          }
        }
        data.push(currentGroup);
        return data;
      };
      result.reorderColumns = function() {
        function sortByExclusivity(c1, c2) {
          var c1X = result.byColumn[c1].activeRows.length > 1, c2X = result.byColumn[c2].activeRows.length > 1;
          return d3.ascending(c1X, c2X);
        }
        function sortByFirstActiveRow(c1, c2) {
          function getFirstActiveRow(prevRow, row) {
            var prevIndex = result.rowNames.indexOf(prevRow), curIndex = result.rowNames.indexOf(row);
            return prevIndex < curIndex ? prevIndex : curIndex;
          }
          var c1Rows = result.byColumn[c1].activeRows, c2Rows = result.byColumn[c2].activeRows, c1First = c1Rows.reduce(getFirstActiveRow), c2First = c2Rows.reduce(getFirstActiveRow);
          return d3.descending(c1First, c2First);
        }
        function sortByName(c1, c2) {
          return d3.ascending(c1, c2);
        }
        function sortByColumnType(c1, c2) {
          return d3.ascending(result.columnsToTypes[c1], result.columnsToTypes[c2]);
        }
        var sortFns = [ sortByFirstActiveRow, sortByColumnType, sortByExclusivity, sortByName ];
        result.columnNames.sort(function(c1, c2) {
          var sortResult;
          for (var i = 0; i < sortFns.length; i++) {
            sortResult = sortFns[i](c1, c2);
            if (sortResult != 0) {
              return sortResult;
            }
          }
          return sortResult;
        });
      };
      result.summarize = function(yes, threshold) {
        var threshold = threshold || 20;
        result.hiddenColumns = [];
        if (yes) {
          var listOfGroups = [], group = [];
          for (var n in result.columnNames) {
            var name = result.columnNames[n];
            if (n == 0) {
              group.push(name);
            } else {
              var prevName = result.columnNames[n - 1], curRows = result.byColumn[name].activeRows, prevRows = result.byColumn[prevName].activeRows, numActiveCur = curRows.length, numActivePrev = prevRows.length;
              if (numActiveCur != numActivePrev || gd3_util.arraysEqual(curRows, prevRows) == false) {
                listOfGroups.push(group);
                group = [ name ];
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
      };
      return result;
    }
    var mutmtxData = parseCancer(data);
    return mutmtxData;
  }
  function mutmtxChart(style) {
    var options = {
      showSummary: false
    };
    function chart(selection) {
      selection.each(function(data) {
        data = mutmtxData(data);
        var height = style.fullHeight, width = style.fullWidth;
        var d3color = d3.scale.category20(), colTypeToColor = {};
        for (var i = 0; i < data.columnTypes.length; i++) {
          colTypeToColor[data.columnTypes[i]] = d3color(i);
        }
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg");
        svg.attr("id", "mutation-matrix").attr("width", width).attr("height", height + style.labelHeight).attr("xmlns", "http://www.w3.org/2000/svg");
        var matrix = svg.append("g");
        var rowLabelsG = svg.append("g").attr("class", "mutmtx-rowLabels"), rowLabelsBG = rowLabelsG.append("rect").attr("x", 0).attr("y", 0).style("fill", "#fff"), rowLabels = rowLabelsG.selectAll("text").data(data.rowNames).enter().append("text").attr("text-anchor", "end").attr("x", 0).attr("y", function(d, i) {
          return style.rowHeight * data.rowNames.indexOf(d) + style.rowHeight - 3;
        }).style("font-family", style.fontFamily).text(function(d) {
          return d;
        });
        var maxTextWidth = -Infinity;
        rowLabels.each(function(d) {
          var w = this.getComputedTextLength();
          maxTextWidth = w > maxTextWidth ? w : maxTextWidth;
        });
        rowLabels.attr("x", maxTextWidth);
        style.labelWidth = Math.ceil(maxTextWidth) + 5;
        style.matrixWidth = width - style.labelWidth;
        rowLabelsBG.attr("width", style.labelWidth).attr("height", rowLabelsG.node().getBBox().height);
        var rowRules = svg.append("g").attr("class", "mutmtxRowRules").selectAll("line").data(data.rowNames).enter().append("line").attr("x1", style.labelWidth).attr("x2", style.labelWidth + style.matrixWidth).attr("y1", function(d, i) {
          return style.rowHeight * data.rowNames.indexOf(d) + style.rowHeight;
        }).attr("y2", function(d, i) {
          return style.rowHeight * data.rowNames.indexOf(d) + style.rowHeight;
        }).style("stroke-width", ".5px").style("stroke", "#ddd");
        data.reorderColumns();
        var wholeVisX = d3.scale.linear().domain([ 0, data.getVisibleColumns().length ]).range([ style.labelWidth, width ]);
        var firstGroup = matrix.append("g").attr("class", ".mutmtxFirstGroup");
        var firstGroupColumns = firstGroup.selectAll("g").data(data.getVizData()[0]).enter().append("g").attr("class", "mutmtxColumn").attr("id", function(d) {
          return d.key;
        }).attr("transform", function(d) {
          var colIndex = data.columnNames.indexOf(d.key);
          return "translate(" + wholeVisX(colIndex) + ",0)";
        });
        var summaryGroups = matrix.selectAll(".mutmtxSummaryGroup").data(data.getVizData().slice(1, data.getVizData().length)).enter().append("g").attr("class", "mutmtxSummaryGroup");
        var summaryGroupsColumns = summaryGroups.selectAll("g").data(function(d) {
          return d;
        }).enter().append("g").attr("class", "mutmtxColumn").attr("id", function(d) {
          return d.key;
        });
        var zoom = d3.behavior.zoom().x(wholeVisX).scaleExtent([ 1, 14 ]).on("zoom", function() {
          rerenderMutationMatrix();
        });
        svg.call(zoom);
        renderMutationMatrix();
        svg.attr("height", function(d) {
          return Math.ceil(rowLabelsG.node().getBBox().height + 10);
        });
        function rerenderMutationMatrix() {
          var colWidth = wholeVisX(1) - wholeVisX(0);
          firstGroupColumns.attr("transform", function(d) {
            var colIndex = data.getColumnNames().indexOf(d.key);
            return "translate(" + wholeVisX(colIndex) + ",0)";
          });
          summaryGroupsColumns.attr("transform", function(d) {
            var colIndex = data.getColumnNames().indexOf(d.key);
            return "translate(" + wholeVisX(colIndex) + ",0)";
          });
          firstGroupColumns.selectAll("rect").attr("width", colWidth);
          summaryGroupsColumns.selectAll("rect").attr("width", colWidth);
        }
        function renderMutationMatrix() {
          var colWidth = wholeVisX(1) - wholeVisX(0);
          firstGroupColumns.selectAll("rect").data(function(d) {
            return d.value.activeRows.map(function(row) {
              return {
                row: row,
                type: data.columnsToTypes[d.key]
              };
            });
          }).enter().append("rect").attr("x", 0).attr("y", function(d) {
            return style.rowHeight * data.rowNames.indexOf(d.row) + style.rowHeight;
          }).attr("height", style.rowHeight).attr("width", colWidth).style("fill", function(d) {
            return colTypeToColor[d.type];
          });
          summaryGroupsColumns.selectAll("rect").data(function(d) {
            return d.value.activeRows.map(function(row) {
              return {
                row: row,
                type: data.columnsToTypes[d.key]
              };
            });
          }).enter().append("rect").attr("x", 0).attr("y", function(d) {
            return style.rowHeight * data.rowNames.indexOf(d.row) + style.rowHeight;
          }).attr("height", style.rowHeight).attr("width", colWidth).style("fill", function(d) {
            return colTypeToColor[d.type];
          });
        }
        if (options.showSummary == true) {
          var summaryArea = selection.append("div");
          summaryArea.append("span").text("Summary:");
          summaryArea.append("input").attr("type", "checkbox").on("click", function() {
            matrix.attr("transform", "translate(0,0)");
            data.summarize(this.checked, 40);
            var updatedData = data.getVizData(), firstGroupData = updatedData[0], summaryGroupsData = updatedData.slice(1, updatedData.length);
            numVisibleCols = data.getVisibleColumns().length, columnWidth = (width - style.labelWidth) / numVisibleCols;
            firstGroupColumns = firstGroup.selectAll(".mutmtxColumn").data(firstGroupData);
            firstGroupColumns.enter().append("g");
            firstGroupColumns.exit().remove();
            firstGroupColumns.attr("class", "mutmtxColumn").attr("id", function(d) {
              return d.key;
            }).attr("transform", function(d) {
              var colIndex = data.getColumnNames().indexOf(d.key);
              return "translate(" + wholeVisX(colIndex) + ",0)";
            });
            summaryGroups = matrix.selectAll(".mutmtxSummaryGroup").data(summaryGroupsData);
            summaryGroups.enter().append("g");
            summaryGroups.exit().remove();
            summaryGroups.attr("class", "mutmtxSummaryGroup").attr("transform", function(d, i) {
              return "translate(" + (i * 30 + 30) + ",0)";
            });
            summaryGroupsColumns = summaryGroups.selectAll("g").data(function(d) {
              return d;
            }).enter().append("g").attr("class", "mutmtxColumn").attr("id", function(d) {
              return d.key;
            }).attr("transform", function(d) {
              var colIndex = data.getColumnNames().indexOf(d.key);
              return "translate(" + wholeVisX(colIndex) + ",0)";
            });
            renderMutationMatrix();
          });
        }
      });
    }
    chart.addSummaryToggle = function(state) {
      var state = state || true;
      options.showSummary = state;
      return chart;
    };
    return chart;
  }
  function mutmtxStyle(style) {
    return {
      animationSpeed: style.animationSpeed || 300,
      bgColor: style.bgColor || "#F6F6F6",
      blockColorMedium: style.blockColorMedium || "#95A5A6",
      blockColorStrongest: style.blockColorStrongest || "#2C3E50",
      boxMargin: style.boxMargin || 5,
      colorSampleTypes: style.colorSampleTypes || true,
      coocurringColor: style.coocurringColor || "orange",
      exclusiveColor: style.exclusiveColor || "blue",
      fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fullWidth: style.width || 500,
      fullHeight: style.height || 300,
      rowHeight: style.rowHeight || 20,
      labelHeight: style.labelHeight || 40,
      labelWidth: style.labelWidth || 100,
      minBoxWidth: style.minBoxWidth || 20,
      mutationLegendHeight: style.mutationLegendHeight || 30,
      sampleStroke: style.sampleStroke || 1,
      zBottom: 0,
      zTop: 100
    };
  }
  gd3.mutationMatrix = function(params) {
    var params = params || {}, style = mutmtxStyle(params.style || {});
    return mutmtxChart(style);
  };
  function transcriptData(data) {
    function parseCancer(cdata) {
      var defaultInactivatingMutations = {
        Nonsense_Mutation: true,
        Frame_Shift_Del: true,
        Frame_Shift_Ins: true,
        Missense_Mutation: false,
        Splice_Site: true,
        In_Frame_Del: false,
        In_Frame_Ins: false
      };
      var defaultMutationTypesToSymbols = {
        Nonsense_Mutation: 0,
        Frame_Shift_Del: 1,
        Frame_Shift_Ins: 1,
        Missense_Mutation: 2,
        Splice_Site: 3,
        In_Frame_Del: 4,
        In_Frame_Ins: 4
      };
      var proteinDomainDB = cdata.proteinDomainDB || "";
      var d = {
        geneName: cdata.gene,
        inactivatingMutations: cdata.inactivatingMutations || defaultInactivatingMutations,
        length: cdata.length,
        mutationCategories: cdata.mutationCategories || [],
        mutations: cdata.mutations,
        mutationTypesToSymbols: cdata.mutationTypesToSymbols || defaultMutationTypesToSymbols,
        proteinDomainDB: proteinDomainDB,
        proteinDomains: cdata.domains[proteinDomainDB]
      };
      d.get = function(str) {
        if (str == "length") return d.length; else if (str == "mutationCategories") return d.mutationCategories; else if (str == "mutations") return d.mutations; else if (str == "mutationTypesToSymbols") return d.mutationTypesToSymbols; else if (str == "proteinDomains") return d.proteinDomains; else return null;
      };
      d.isMutationInactivating = function(mut) {
        return d.inactivatingMutations[mut];
      };
      return d;
    }
    var tData = parseCancer(data);
    return tData;
  }
  function transcriptChart(style) {
    function chart(selection) {
      selection.each(function(data) {
        data = transcriptData(data);
        var d3color = d3.scale.category20(), sampleTypeToColor = {};
        for (var i = 0; i < data.get("mutationCategories").length; i++) {
          sampleTypeToColor[data.get("mutationCategories")[i]] = d3color(i);
        }
        var height = style.height, width = style.width;
        var mutationResolution = Math.floor(width / style.symbolWidth);
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg");
        var start = 0, stop = data.get("length");
        var x = d3.scale.linear().domain([ start, stop ]).range([ 0, width ]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(style.numXTicks).tickSize(0).tickPadding(style.xTickPadding);
        var transcriptAxis = svg.append("g").attr("class", "xaxis").attr("transform", "translate(5," + (style.height / 2 + style.transcriptBarHeight + 2) + ")").style("font-size", "12px").style("fill", "#000").call(xAxis);
        var transcriptBar = svg.append("rect").attr("height", style.transcriptBarHeight).attr("width", x(stop) - x(start)).attr("x", x(start)).attr("y", height / 2).style("fill", "#ccc");
        var zoom = d3.behavior.zoom().x(x).scaleExtent([ 1, 100 ]).on("zoom", function() {
          updateTranscript();
        });
        svg.call(zoom);
        var mutationsG = svg.append("g").attr("class", "transcriptMutations");
        var mutations = mutationsG.selectAll(".symbols").data(data.get("mutations")).enter().append("path").attr("class", "symbols").attr("d", d3.svg.symbol().type(function(d, i) {
          return d3.svg.symbolTypes[data.get("mutationTypesToSymbols")[d.ty]];
        }).size(5)).style("fill", function(d, i) {
          return sampleTypeToColor[d.dataset];
        }).style("stroke", function(d, i) {
          return sampleTypeToColor[d.dataset];
        }).style("stroke-width", 2);
        console.log(data.get("proteinDomains"));
        var test = data.get("proteinDomains");
        console.log(test.slice());
        console.log("---");
        var domainGroups = svg.selectAll(".domains").data(data.get("proteinDomains").slice()).enter().append("g").attr("class", "domains");
        var domains = domainGroups.append("rect").attr("id", function(d, i) {
          return "domain-" + i;
        }).attr("width", function(d, i) {
          return x(d.end) - x(d.start);
        }).attr("height", style.transcriptBarHeight + 5).style("fill", "#aaa").style("fill-opacity", .5);
        var domainLabels = domainGroups.append("text").attr("id", function(d, i) {
          return "domain-label-" + i;
        }).attr("text-anchor", "middle").attr("y", style.transcriptBarHeight).style("fill", "#000").style("fill-opacity", 0).text(function(d, i) {
          return d.name;
        });
        domainGroups.on("mouseover", function(d, i) {
          d3.select(this).selectAll("rect").style("fill", "#f00");
          domainGroups.select("#domain-label-" + i).style("fill-opacity", 1);
        }).on("mouseout", function(d, i) {
          d3.select(this).selectAll("rect").style("fill", "#aaa");
          domainGroups.select("#domain-label-" + i).style("fill-opacity", 0);
        });
        updateTranscript();
        function updateTranscript() {
          var curMin = d3.min(x.domain()), curMax = d3.max(x.domain()), curRes = Math.round((curMax - curMin) / mutationResolution);
          curRes = curRes ? curRes : 1;
          var bottomIndex = {}, topIndex = {}, pX = {}, pY = {};
          var endIter = Math.ceil(curMax / curRes) + 5;
          startIter = Math.floor(curMin / curRes) - 5;
          for (var i = startIter; i < endIter; i++) {
            bottomIndex[i] = 0;
            topIndex[i] = 0;
          }
          mutations.attr("transform", function(d, i) {
            var curRes = 1;
            var indexDict = data.isMutationInactivating(d.ty) ? bottomIndex : topIndex, curIndex = Math.round(d.locus / curRes), px = x(curIndex * curRes), py;
            if (indexDict[curIndex] == undefined) indexDict[curIndex] = 0;
            if (data.isMutationInactivating(d.ty)) {
              py = height / 2 + (style.transcriptBarHeight + indexDict[curIndex] * style.symbolWidth + 3 + 10);
            } else {
              py = height / 2 - (indexDict[curIndex] * style.symbolWidth + 3 + 5);
            }
            indexDict[curIndex]++;
            pX[i] = px;
            pY[i] = py;
            return "translate(" + px + ", " + py + ")";
          }).style("fill", function(d) {
            return sampleTypeToColor[d.dataset];
          }).style("fill-opacity", 1).style("stroke", function(d) {
            return sampleTypeToColor[d.dataset];
          }).style("stroke-opacity", 1);
          transcriptAxis.call(xAxis);
          transcriptBar.attr("x", x(start)).attr("width", x(stop) - x(start));
          domainGroups.attr("transform", function(d, i) {
            return "translate(" + x(d.start) + "," + height / 2 + ")";
          });
          domains.attr("width", function(d, i) {
            return x(d.end) - x(d.start);
          });
          domainLabels.attr("x", function(d, i) {
            var w = d3.select(this.parentNode).select("rect").attr("width");
            return w / 2;
          });
        }
      });
    }
    return chart;
  }
  function transcriptStyle(style) {
    return {
      height: style.height || 200,
      numXTicks: style.numXTicks || 5,
      symbolWidth: style.symbolWidth || 10,
      transcriptBarHeight: style.transcriptBarHeight || 20,
      width: style.width || 500,
      xTickPadding: style.xTickPadding || 1.25
    };
  }
  gd3.transcript = function(params) {
    var params = params || {}, style = transcriptStyle(params.style || {});
    return transcriptChart(style);
  };
  if (typeof define === "function" && define.amd) define(gd3); else if (typeof module === "object" && module.exports) module.exports = gd3;
  this.gd3 = gd3;
}();