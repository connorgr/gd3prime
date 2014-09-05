!function() {
  var gd3 = {
    version: "0.2.1"
  };
  function annotationStyle(style) {
    return {
      fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: "12px",
      height: style.height || 200,
      width: style.width || 500
    };
  }
  function annotationView(style, votingFns) {
    var point = null, svg = null, target = null;
    var votingFns = votingFns || {};
    function getScreenBBox() {
      var targetel = d3.event.target, bbox = {}, matrix = targetel.getScreenCTM(), tbbox = targetel.getBBox(), width = tbbox.width, height = tbbox.height, x = tbbox.x, y = tbbox.y;
      point.x = x;
      point.y = y;
      bbox.nw = point.matrixTransform(matrix);
      point.x += width;
      bbox.ne = point.matrixTransform(matrix);
      point.y += height;
      bbox.se = point.matrixTransform(matrix);
      point.x -= width;
      bbox.sw = point.matrixTransform(matrix);
      point.y -= height / 2;
      bbox.w = point.matrixTransform(matrix);
      point.x += width;
      bbox.e = point.matrixTransform(matrix);
      point.x -= width / 2;
      point.y -= height / 2;
      bbox.n = point.matrixTransform(matrix);
      point.y += height;
      bbox.s = point.matrixTransform(matrix);
      return bbox;
    }
    function view(selection) {
      function appendText(selection, data) {
        var title = data.title ? data.title + ": " : "", text = data.text ? data.text : "";
        selection.append("p").style("color", "#fff").style("font-family", style.fontFamily).style("font-size", style.fontSize).style("margin", "0px").style("padding", "0px").text(title + text);
      }
      function appendLink(selection, data) {
        selection.append("a").attr("href", data.href).style("color", "#fff").style("font-family", style.fontFamily).style("font-size", style.fontSize).style("margin", "0px").style("padding", "0px").text(data.text);
      }
      function appendTable(selection, data) {
        var table = selection.append("table"), header = table.append("thead").append("tr"), body = table.append("tbody");
        table.style({
          "border-collapse": "collapse",
          "border-bottom": "2px solid #ccc",
          "border-top": "2px solid #ccc",
          "margin-top": "3px"
        });
        header.style("border-bottom", "1px solid #ccc");
        header.selectAll("td").data(data.header).enter().append("td").style("color", "#fff").style("font-family", style.fontFamily).style("font-size", style.fontSize).style("margin", "0px").style("padding", "0 5px 2px 0").text(function(d) {
          return d;
        });
        var rows = body.selectAll("tr").data(data.data).enter().append("tr");
        var cells = rows.selectAll("td").data(function(d) {
          return d;
        }).enter().append("td").style("max-width", "115px").style("padding", "0 3px 0 3px").each(function(d) {
          if (typeof d === "string") {
            appendText(d3.select(this), {
              text: d
            });
          } else if (d.type === "vote") {
            appendVote(d3.select(this), d);
          }
        });
      }
      function appendVote(selection, data) {
        var down = null, score = null, up = null;
        var defaultColor = "rgb(255, 255, 255)", activeColor = "rgb(255, 165, 0)";
        function abstractVote(clickedArrow, otherArrow) {
          var upvote = clickedArrow == up, adjust = upvote ? 1 : -1;
          var scoreDatum = score.datum();
          if (clickedArrow.style("color") == defaultColor) {
            if (otherArrow.style("color") == activeColor) {
              score.text(parseInt(score.text()) + adjust);
            }
            clickedArrow.style("color", activeColor);
            otherArrow.style("color", defaultColor);
            score.text(parseInt(score.text()) + adjust);
            scoreDatum.voted = upvote ? "upVote" : "downVote";
          } else {
            clickedArrow.style("color", defaultColor);
            score.text(parseInt(score.text()) - adjust);
            scoreDatum.voted = "none";
          }
          scoreDatum.score = parseInt(score.text());
          score.datum(scoreDatum);
          console.log(scoreDatum);
        }
        function downVote(d) {
          abstractVote(down, up);
          if (votingFns.downVote != undefined) votingFns.downVote(d);
        }
        function upVote(d) {
          abstractVote(up, down);
          if (votingFns.upVote) votingFns.upVote(d);
        }
        var textStyle = {
          color: "#fff",
          display: "inline-block",
          "font-family": style.fontFamily,
          "font-size": style.fontSize,
          margin: "0px",
          "-webkit-touch-callout": "none",
          "-webkit-user-select": "none",
          "-khtml-user-select": "none",
          "-moz-user-select": "none",
          "-ms-user-select": "none",
          "user-select": "none"
        };
        down = selection.append("p").style(textStyle).style("padding", "0").style("cursor", "pointer").text("▼").on("click", downVote);
        score = selection.append("p").style(textStyle).style("padding", "0 1px 0 1px").text(data.score);
        up = selection.append("p").style(textStyle).style("padding", "0").style("cursor", "pointer").text("▲").on("click", upVote);
        if (score.datum().voted != undefined) {
          if (score.datum().voted == "upVote") up.style("color", activeColor);
          if (score.datum().voted == "downVote") down.style("color", activeColor);
        }
      }
      function activate(d) {
        if (d.annotation == undefined) {
          return;
        }
        target = target || d3.event.target;
        svg = target.tagName.toLowerCase() == "svg" ? target : target.ownerSVGElement;
        if (d3.select(svg).select("SVGPoint").empty() == true) {
          point = svg.createSVGPoint();
        } else {
          point = d3.select(svg).select("SVGPoint").node();
        }
        var aData = d.annotation, bbox = getScreenBBox();
        d3.selectAll(".gd3AnnotationViewDiv").remove();
        var container = d3.select(document.createElement("div"));
        container.attr("class", "gd3AnnotationViewDiv");
        container.style({
          background: "rgba(0,0,0,.75)",
          "border-radius": "3px",
          padding: "5px",
          position: "absolute"
        });
        console.log(bbox);
        for (var i in aData) {
          var aPart = aData[i], type = aPart.type;
          if (type == "link") {
            appendLink(container, aPart);
          } else if (type == "table") {
            appendTable(container, aPart);
          } else if (type == "text") {
            appendText(container, aPart);
          }
        }
        document.body.appendChild(container.node());
        var node = container.node(), scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft, scrollTop = document.documentElement.scrollTop || document.body.scrollTop, nodeL = bbox.s.x - node.offsetWidth / 2, nodeT = bbox.s.y;
        var offsetTop = nodeT + scrollTop, offsetLeft = nodeL + scrollLeft;
        container.style("left", offsetLeft.toString() + "px").style("top", offsetTop.toString() + "px");
        var xoutLeft = (node.offsetWidth - 10).toString() + "px";
        console.log(xoutLeft, "xoutLeft");
        container.append("span").text("☓").on("click", function() {
          d3.selectAll(".gd3AnnotationViewDiv").remove();
        }).style({
          color: "#000",
          cursor: "pointer",
          display: "inline",
          "font-size": "10px",
          "font-weight": "bold",
          left: xoutLeft,
          "line-height": 1,
          position: "absolute",
          "text-align": "right",
          top: "-10px",
          width: "10px"
        });
        console.log(container.node().offsetWidth);
      }
      selection.on("mouseover", activate);
    }
    return view;
  }
  gd3.annotation = function(params) {
    var params = params || {}, style = annotationStyle(params.style || {}), votingFns = params.votingFns || {};
    return annotationView(style);
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
  function cnaData(data) {
    function braph(cdata) {
      var gene = cdata.gene || "", geneinfo = cdata.neighbors || [], region = cdata.region || {};
      samplesToTypes = cdata.sampleToTypes || {}, seg = cdata.segments;
      var chrm = region.chr, allmin = 0, allmax = 0, minSegXLoc = region.minSegX, maxSegXLoc = region.maxSegX;
      var geneJSON = geneinfo.map(function(d) {
        var selected = d.name == gene;
        return {
          fixed: selected ? true : false,
          start: d.start,
          end: d.end,
          label: d.name,
          selected: selected
        };
      });
      var sampleTypes = [], samplelst = [], segJSON = [];
      seg.forEach(function(d) {
        samplelst.push(d.sample);
        var dSegments = d.segments;
        dSegments.forEach(function(s) {
          segJSON.push({
            gene: gene,
            start: s.start,
            end: s.end,
            label: s.sample,
            sample: d.sample,
            dataset: samplesToTypes[d.sample],
            ty: s.ty
          });
          if (sampleTypes.indexOf(samplesToTypes[d.sample])) {
            sampleTypes.push(samplesToTypes[s.sample]);
          }
        });
      });
      segJSON.sort(function(a, b) {
        if (a.dataset != b.dataset) return d3.ascending(a.dataset, b.dataset); else return d3.ascending(a.end - a.start, b.end - b.start);
      });
      var d = {
        genes: geneJSON,
        sampleTypes: sampleTypes,
        samplesToTypes: samplesToTypes,
        segments: segJSON,
        segmentDomain: [ minSegXLoc, maxSegXLoc ]
      };
      d.get = function(arg) {
        if (arg == "genes") return d.genes; else if (arg == "sampleTypes") return d.sampleTypes; else if (arg == "samplesToTypes") return d.samplesToTypes; else if (arg == "segments") return d.segments; else if (arg == "segmentDomain") return d.segmentDomain; else return undefined;
      };
      return d;
    }
    var cnaData = braph(data);
    return cnaData;
  }
  function cnaChart(style) {
    function chart(selection) {
      selection.each(function(data) {
        data = cnaData(data);
        var height = style.height, width = style.width;
        var d3color = d3.scale.category20(), segmentTypeToColor = {};
        for (var i = 0; i < data.get("sampleTypes").length; i++) {
          segmentTypeToColor[data.get("sampleTypes")[i]] = d3color(i);
        }
        var sampleTypesToInclude = {}, samplesToTypes = data.get("samplesToTypes");
        data.sampleTypes.sort().forEach(function(d) {
          sampleTypesToInclude[d] = true;
        });
        var svgActual = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("height", height).attr("width", width);
        var svg = svgActual.append("g");
        var bgMask = svg.append("rect").attr("width", width).style("fill", "#fff");
        var start = d3.min(data.segmentDomain), stop = d3.max(data.segmentDomain);
        var x = d3.scale.linear().domain([ start, stop ]).range([ 0, width ]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5).tickSize(0).tickPadding(1.25);
        var normalize = d3.scale.linear().domain([ start, stop ]).range([ 0, width ]);
        var zoom = d3.behavior.zoom().x(x).scaleExtent([ 1, 100 ]).on("zoom", function() {
          updateAllComponents();
        });
        svg.call(zoom).on("dblclick.zoom", null);
        var genomeG = svg.append("g"), genomeBar = svg.append("rect").attr("class", "genome").attr("y", style.genomeAreaHeight / 2 - style.genomeBarHeight).attr("x", 0).attr("width", width).attr("height", style.genomeBarHeight).style("fill", "#ccc");
        var geneGroups = svg.selectAll(".genes").data(data.get("genes")).enter().append("g").attr("class", "genes"), genes = geneGroups.append("rect").attr("width", function(d) {
          return normalize(d.end) - normalize(d.start);
        }).attr("height", style.geneHeight).style("fill-opacity", function(d) {
          return d.selected ? 1 : .2;
        }).style("fill", function(d) {
          return d.selected ? style.geneSelectedColor : style.geneColor;
        }).attr("id", function(d, i) {
          return "gene-" + i;
        }), geneLabels = geneGroups.append("text").attr("y", style.genomeAreaHeight / 2 - 2).attr("text-anchor", "middle").style("fill-opacity", function(d) {
          return d.selected ? 1 : 0;
        }).style("fill", "#000").style("font-family", style.fontFamily).style("font-size", style.fontSize).text(function(d) {
          return d.label;
        });
        geneGroups.on("mouseover", function(d) {
          if (!d.fixed) {
            d3.select(this).select("rect").style("fill", style.geneHighlightColor);
            d3.select(this).select("text").style("fill-opacity", 1);
          }
        });
        geneGroups.on("mouseout", function(d, i) {
          if (!d.fixed) {
            d3.select(this).select("rect").style("fill", function(d) {
              return d.selected ? style.geneSelectedColor : style.geneColor;
            });
            d3.select(this).select("text").style("fill-opacity", 0);
          }
        });
        geneGroups.on("dblclick", function(d, i) {
          d.fixed = d.fixed ? false : true;
          if (d.fixed) {
            d3.select(this).select("rect").style("fill", function(d) {
              return d.selected ? style.geneSelectedColor : style.geneHighlightColor;
            });
            d3.select(this).select("text").style("fill-opacity", 1);
          }
        });
        var segmentsG = svg.append("g").attr("class", "cnaSegmentsGroup").attr("transform", "translate(0," + style.genomeAreaHeight + ")"), segments = segmentsG.selectAll(".segments").data(data.get("segments")).enter().append("g").attr("class", "intervals");
        var minSegmentX = d3.min(data.get("segmentDomain")), maxSegmentX = d3.max(data.get("segmentDomain"));
        segs = segments.append("rect").attr("fill", function(d) {
          return segmentTypeToColor[samplesToTypes[d.sample]];
        }).attr("width", function(d) {
          return normalize(d.end, minSegmentX, maxSegmentX) - normalize(d.start, minSegmentX, maxSegmentX);
        }).attr("height", style.horizontalBarHeight).attr("id", function(d, i) {
          return "interval-" + i;
        });
        var verticalBar = svg.selectAll(".vert-bar").data(data.get("genes").filter(function(d) {
          return d.selected;
        })).enter().append("rect").attr("y", style.geneHeight).attr("width", function(d) {
          return normalize(d.end) - normalize(d.start);
        }).style("fill", style.geneSelectedColor).style("fill-opacity", .5);
        updateGeneBar();
        updateSegments();
        function updateAllComponents() {
          var t = zoom.translate(), tx = t[0], ty = t[1], scale = zoom.scale();
          tx = Math.min(tx, 0);
          zoom.translate([ tx, ty ]);
          var curMin = d3.min(x.domain()), curMax = d3.max(x.domain());
          normalize.domain([ curMin, curMax ]);
          updateGeneBar();
          updateSegments();
        }
        function updateGeneBar() {
          verticalBar.attr("x", function(d) {
            return normalize(d.start);
          }).attr("width", function(d) {
            return normalize(d.end) - normalize(d.start);
          });
          genes.attr("transform", function(d, i) {
            return "translate(" + normalize(d.start) + ",0)";
          });
          genes.attr("width", function(d, i) {
            return normalize(d.end) - normalize(d.start);
          });
          geneLabels.attr("transform", function(d, i) {
            var x1 = d3.max([ d.start, d3.max(normalize.domain()) ]), x2 = d3.min([ d.end, d3.min(normalize.domain()) ]);
            return "translate(" + normalize(d.start + (d.end - d.start) / 2) + ",0)";
          });
        }
        function updateSegments() {
          segs.attr("transform", function(d, i) {
            return "translate(" + normalize(d.start) + "," + style.horizontalBarSpacing * i + ")";
          }).attr("width", function(d, i) {
            return normalize(d.end) - normalize(d.start);
          });
          var activeIntervals = segments.filter(function(d) {
            return sampleTypesToInclude[samplesToTypes[d.sample]];
          }).style("opacity", 1);
          segments.filter(function(d) {
            return !sampleTypesToInclude[samplesToTypes[d.sample]];
          }).style("opacity", 0);
        }
        svgActual.attr("height", function() {
          height = svg.node().getBBox().height + style.horizontalBarHeight;
          bgMask.attr("height", height);
          verticalBar.attr("height", height - style.geneHeight);
          return height;
        });
      });
    }
    return chart;
  }
  function cnaStyle(style) {
    return {
      fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: style.fontSize || "12px",
      geneColor: style.geneColor || "#aaa",
      geneHeight: style.geneHeight || 24,
      geneHighlightColor: style.geneHighlightColor || "#f00",
      geneSelectedColor: style.geneSelectedColor || "#f00",
      genomeAreaHeight: style.genomeAreaHeight || 40,
      genomeBarHeight: style.genomeBarHeight || 14,
      height: style.height || 200,
      horizontalBarHeight: style.horizontalBarHeight || 5,
      horizontalBarSpacing: style.horizontalBarSpacing || 6,
      width: style.width || 500
    };
  }
  gd3.cna = function(params) {
    var params = params || {}, style = cnaStyle(params.style || {});
    return cnaChart(style);
  };
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
      if (!attr) return null; else if (attr === "datasets") return data.datasets; else if (attr === "labels") return data.labels; else if (attr === "matrix") return data.matrix;
    };
    function parseMagi() {
      function parseDatasets() {
        var matrix = data.matrix, datasetList = {};
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
      }
      data.matrix = inputData.M;
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
  function mutmtxChart(style) {
    var options = {
      showSummary: false
    };
    function chart(selection) {
      selection.each(function(data) {
        data = mutmtxData(data);
        var height = style.fullHeight, width = style.fullWidth;
        var d3color = d3.scale.category20(), colTypeToColor = {}, datasets = data.get("datasets");
        for (var i = 0; i < datasets.length; i++) {
          colTypeToColor[datasets[i]] = d3color(i);
        }
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg");
        svg.attr("id", "mutation-matrix").attr("width", width).attr("height", height + style.labelHeight).attr("xmlns", "http://www.w3.org/2000/svg");
        var matrix = svg.append("g");
        var rowLabelsG = svg.append("g").attr("class", "mutmtx-rowLabels"), rowLabelsBG = rowLabelsG.append("rect").attr("x", 0).attr("y", 0).style("fill", "#fff"), rowLabels = rowLabelsG.selectAll("text").data(data.get("labels").rows).enter().append("text").attr("text-anchor", "end").attr("x", 0).attr("y", function(d, i) {
          return style.rowHeight * data.labels.rows.indexOf(d) + style.rowHeight - 3;
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
        var rowNames = data.get("labels").rows, rowRules = svg.append("g").attr("class", "mutmtxRowRules").selectAll("line").data(rowNames).enter().append("line").attr("x1", style.labelWidth).attr("x2", style.labelWidth + style.matrixWidth).attr("y1", function(d, i) {
          return style.rowHeight * rowNames.indexOf(d) + style.rowHeight;
        }).attr("y2", function(d, i) {
          return style.rowHeight * rowNames.indexOf(d) + style.rowHeight;
        }).style("stroke-width", ".5px").style("stroke", "#ddd");
        var wholeVisX = d3.scale.linear().domain([ 0, data.get("labels").columns.length ]).range([ style.labelWidth, width ]);
        var firstGroup = matrix.append("g").attr("class", ".mutmtxFirstGroup");
        var firstGroupColumns = firstGroup.selectAll("g").data(data.get("labels").columns).enter().append("g").attr("class", "mutmtxColumn").attr("id", function(d) {
          return d.key;
        }).attr("transform", function(d, i) {
          return "translate(" + wholeVisX(i) + ",0)";
        });
        var zoom = d3.behavior.zoom().x(wholeVisX).scaleExtent([ 1, 14 ]).on("zoom", function() {
          rerenderMutationMatrix();
        });
        svg.call(zoom);
        renderMutationMatrix();
        rerenderMutationMatrix();
        svg.attr("height", function(d) {
          return Math.ceil(rowLabelsG.node().getBBox().height + 10);
        });
        function rerenderMutationMatrix() {
          var t = zoom.translate(), tx = t[0], ty = t[1], scale = zoom.scale();
          tx = Math.min(tx, 0);
          zoom.translate([ tx, ty ]);
          var colWidth = wholeVisX(1) - wholeVisX(0);
          firstGroupColumns.attr("transform", function(d) {
            var colIndex = data.getColumnIds().indexOf(d.key);
            return "translate(" + wholeVisX(colIndex) + ",0)";
          });
          firstGroupColumns.selectAll("rect").attr("width", colWidth);
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
            return style.rowHeight * data.rowNames.indexOf(d.row);
          }).attr("height", style.rowHeight).attr("width", colWidth).style("fill", function(d) {
            return colTypeToColor[d.type];
          }).call(gd3.annotation());
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
              var colIndex = data.getColumnIds().indexOf(d.key);
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
              var colIndex = data.getColumnIds().indexOf(d.key);
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
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("height", height).attr("width", width);
        var start = 0, stop = data.get("length");
        var x = d3.scale.linear().domain([ start, stop ]).range([ 0, width ]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(style.numXTicks).tickSize(0).tickPadding(style.xTickPadding);
        var transcriptAxis = svg.append("g").attr("class", "xaxis").attr("transform", "translate(5," + (style.height / 2 + style.transcriptBarHeight + 6) + ")").style("font-family", style.fontFamily).style("font-size", "12px").style("fill", "#000").call(xAxis);
        var transcriptBar = svg.append("rect").attr("height", style.transcriptBarHeight).attr("width", x(stop) - x(start)).attr("x", x(start)).attr("y", height / 2).style("fill", "#ccc");
        var zoom = d3.behavior.zoom().x(x).scaleExtent([ 1, 100 ]).on("zoom", function() {
          updateTranscript();
        });
        svg.call(zoom);
        var mutationsG = svg.append("g").attr("class", "transcriptMutations");
        var mutations = mutationsG.selectAll(".symbols").data(data.get("mutations")).enter().append("path").attr("class", "symbols").attr("d", d3.svg.symbol().type(function(d, i) {
          return d3.svg.symbolTypes[data.get("mutationTypesToSymbols")[d.ty]];
        }).size(style.symbolWidth)).style("fill", function(d, i) {
          return sampleTypeToColor[d.dataset];
        }).style("stroke", function(d, i) {
          return sampleTypeToColor[d.dataset];
        }).style("stroke-width", 2);
        var domainGroupsData = data.get("proteinDomains");
        var domainGroups = svg.selectAll(".domains").data(domainGroupsData ? data.get("proteinDomains").slice() : []).enter().append("g").attr("class", "domains");
        var domains = domainGroups.append("rect").attr("id", function(d, i) {
          return "domain-" + i;
        }).attr("width", function(d, i) {
          return x(d.end) - x(d.start);
        }).attr("height", style.transcriptBarHeight + 10).style("fill", "#aaa").style("fill-opacity", .5);
        var domainLabels = domainGroups.append("text").attr("id", function(d, i) {
          return "domain-label-" + i;
        }).attr("text-anchor", "middle").attr("y", style.transcriptBarHeight).style("fill", "#000").style("fill-opacity", 0).style("font-size", 12).style("font-family", style.fontFamily).text(function(d, i) {
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
          var t = zoom.translate(), tx = t[0], ty = t[1], scale = zoom.scale();
          tx = Math.min(tx, 0);
          zoom.translate([ tx, ty ]);
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
            var indexDict = data.isMutationInactivating(d.ty) ? bottomIndex : topIndex, curIndex = Math.round(d.locus / curRes), px = x(curIndex * curRes), py;
            if (indexDict[curIndex] == undefined) indexDict[curIndex] = 0;
            if (data.isMutationInactivating(d.ty)) {
              py = height / 2 + (style.transcriptBarHeight + indexDict[curIndex] * (style.symbolWidth / 2) + 21);
            } else {
              py = height / 2 - (indexDict[curIndex] * (style.symbolWidth / 2) + 11);
            }
            indexDict[curIndex]++;
            pX[i] = px;
            pY[i] = py;
            return "translate(" + px + ", " + py + ")";
          }).style("fill", function(d) {
            return sampleTypeToColor[d.dataset];
          }).style("fill-opacity", 1).style("stroke", function(d) {
            return sampleTypeToColor[d.dataset];
          }).style("stroke-opacity", 1).call(gd3.annotation());
          transcriptAxis.call(xAxis);
          transcriptBar.attr("x", x(start)).attr("width", x(stop) - x(start));
          domainGroups.attr("transform", function(d, i) {
            return "translate(" + x(d.start) + "," + (height / 2 - 5) + ")";
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
      fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      height: style.height || 200,
      numXTicks: style.numXTicks || 5,
      symbolWidth: style.symbolWidth || 20,
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