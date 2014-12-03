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
          } else if (d.type === "link") {
            appendLink(d3.select(this), d);
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
        if (d.annotation == undefined && d.cell.annotation == undefined) {
          return;
        }
        target = target || d3.event.target;
        svg = target.tagName.toLowerCase() == "svg" ? target : target.ownerSVGElement;
        if (d3.select(svg).select("SVGPoint").empty() == true) {
          point = svg.createSVGPoint();
        } else {
          point = d3.select(svg).select("SVGPoint").node();
        }
        var aData = d.annotation || d.cell.annotation, bbox = getScreenBBox();
        d3.selectAll(".gd3AnnotationViewDiv").remove();
        var container = d3.select(document.createElement("div"));
        container.attr("class", "gd3AnnotationViewDiv");
        container.style({
          background: "rgba(0,0,0,.75)",
          "border-radius": "3px",
          padding: "5px",
          position: "absolute"
        });
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
        var offsetTop = nodeT + scrollTop + 2, offsetLeft = nodeL + scrollLeft;
        container.style("left", offsetLeft.toString() + "px").style("top", offsetTop.toString() + "px");
        var xoutLeft = (node.offsetWidth - 10).toString() + "px";
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
    },
    arrayToSet: function(a) {
      var seen = {};
      return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : seen[item] = true;
      });
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
          var vote = {
            type: "vote",
            score: 100
          };
          var link = {
            type: "link",
            href: "http://www.cs.brown.edu",
            text: "BrownCS"
          };
          var testAnnotation = [ {
            type: "text",
            title: "Sample",
            text: d.sample
          }, {
            type: "table",
            header: [ "Cancer", "PMIDs", "Votes" ],
            data: [ [ "1", link, vote ], [ "4", link, vote ] ]
          } ];
          segJSON.push({
            annotation: testAnnotation,
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
        segments.call(gd3.annotation());
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
  function heatmapData(inputData) {
    var data = {
      annotations: undefined,
      cells: [],
      maxCellValue: Number.NEGATIVE_INFINITY,
      minCellValue: Number.POSITIVE_INFINITY,
      xs: [],
      ys: []
    };
    function defaultParse() {
      data.cells = inputData.cells;
      data.xs = inputData.xs;
      data.ys = inputData.ys;
      data.annotations = inputData.annotations;
      var tmp;
      for (var i = data.cells.length - 1; i >= 0; i--) {
        tmp = data.cells[i].value;
        if (tmp > data.maxCellValue) data.maxCellValue = tmp;
        if (tmp < data.minCellValue) data.minCellValue = tmp;
      }
      if (data.annotations) {
        if (!data.annotations.annotationToColor) data.annotations.annotationToColor = {};
        data.annotations.categories.forEach(function(category) {
          var entry = data.annotations.annotationToColor[category];
          if (entry && Object.keys(entry).length > 0) return;
          var categoryIndex = data.annotations.categories.indexOf(category);
          var annotationNames = Object.keys(data.annotations.sampleToAnnotations), values = annotationNames.map(function(n) {
            return data.annotations.sampleToAnnotations[n][categoryIndex];
          });
          entry = [ d3.min(values), d3.max(values) ];
          data.annotations.annotationToColor[category] = entry;
        });
      }
    }
    defaultParse();
    return data;
  }
  function heatmapChart(style) {
    var renderAnnotations = true, renderXLabels = true, renderYLabels = true;
    function chart(selection) {
      selection.each(function(data) {
        data = heatmapData(data);
        var height = style.height, width = style.width;
        var svg = d3.select(this).selectAll("svg").data([ data ]).enter().append("svg").attr("height", height).attr("width", width).style("font-family", style.fontFamily).style("font-size", style.fontFamily);
        var cells = data.cells, xs = data.xs, ys = data.ys;
        var colorDomain = d3.range(data.minCellValue, data.maxCellValue, (data.maxCellValue - data.minCellValue) / style.colorScale.length).concat([ data.maxCellValue ]), colorScale = d3.scale.linear().domain(colorDomain).range(style.colorScale).interpolate(d3.interpolateLab);
        var heatmap = svg.append("g").attr("class", "gd3heatmapCellsContainer");
        var heatmapCells = heatmap.append("g").attr("class", "gd3heatmapCells").selectAll(".rect").data(cells).enter().append("rect").attr("height", style.cellHeight).attr("width", style.cellWidth).attr("x", function(d, i) {
          return data.xs.indexOf(d.x) * style.cellWidth;
        }).attr("y", function(d, i) {
          return data.ys.indexOf(d.y) * style.cellHeight;
        }).style("fill", function(d) {
          return d.value == null ? style.noCellValueColor : colorScale(d.value);
        });
        heatmapCells.append("title").text(function(d) {
          return [ "x: " + d.x, "y: " + d.y, "value: " + (d.value == null ? "No data" : d.value) ].join("\n");
        });
        var guidelineData = [ {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }, {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }, {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }, {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        } ];
        var guidelinesG = svg.append("g").attr("class", "gd3heatmapGuidlines"), guidelines = guidelinesG.selectAll("line").data(guidelineData).enter().append("line").style("stroke", "#000").style("stroke-width", 1);
        heatmapCells.on("mouseover", function() {
          var xOffset = parseFloat(heatmap.attr("transform").replace(",", "").replace("translate(", ""));
          var thisEl = d3.select(this), h = +thisEl.attr("height"), w = +thisEl.attr("width"), x = +thisEl.attr("x") + xOffset, y = +thisEl.attr("y");
          visibleHeight = +heatmap.node().getBBox().height;
          guidelines.each(function(d, i) {
            var line = d3.select(this);
            if (i == 0) line.attr("x1", 0).attr("x2", style.width).attr("y1", y).attr("y2", y);
            if (i == 1) line.attr("x1", 0).attr("x2", style.width).attr("y1", y + h).attr("y2", y + h);
            if (i == 2) line.attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", visibleHeight);
            if (i == 3) line.attr("x1", x + w).attr("x2", x + w).attr("y1", 0).attr("y2", visibleHeight);
          });
          thisEl.style("stroke", "#000").style("stroke-width", 1);
        }).on("mouseout", function() {
          guidelines.attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 0);
          d3.select(this).style("stroke", "none");
        });
        var legendG = svg.append("g"), legendScale = legendG.append("g");
        yLabelsG = svg.append("g").attr("class", "gd3heatmapYLabels");
        if (renderYLabels) renderYLabelsFn();
        if (renderAnnotations) renderAnnotations();
        if (renderXLabels) renderXLabelsFn();
        var heatmapStartX = parseFloat(heatmap.attr("transform").split("translate(")[1].split(",")[0]), heatmapW = heatmap.node().getBBox().width;
        var zoom = d3.behavior.zoom().on("zoom", function() {
          var t = zoom.translate(), tx = t[0];
          heatmap.attr("transform", "translate(" + (tx + heatmapStartX) + ",0)");
          function inViewPort(x) {
            return x * style.cellWidth + tx > 0;
          }
          function cellVisibility(x) {
            return inViewPort(x) ? 1 : .1;
          }
          heatmapCells.style("opacity", function(d) {
            return cellVisibility(data.xs.indexOf(d.x));
          });
          if (renderXLabels) {
            heatmap.selectAll("g.gd3annotationXLabels text").style("opacity", function(name) {
              return cellVisibility(data.xs.indexOf(name));
            });
          }
          if (renderAnnotations) {
            heatmap.selectAll("g.gd3heatmapAnnotationCells rect").style("opacity", function(x) {
              return cellVisibility(data.xs.indexOf(x));
            });
          }
        });
        svg.call(zoom);
        function renderAnnotations() {
          if (!data.annotations) return;
          var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;
          var annotationCellsG = heatmap.append("g").attr("class", "gd3heatmapAnnotationCells"), annotationYLabelsG = svg.append("g").attr("class", "gd3annotationYLabels");
          annotationYLabelsG.attr("transform", "translate(0," + verticalOffset + ")");
          var annotationYLabels = annotationYLabelsG.selectAll("text").data(data.annotations.categories).enter().append("text").attr("text-anchor", "end").attr("y", function(d, i) {
            return i * (style.annotationCellHeight + style.annotationCategorySpacing) + style.annotationCellHeight;
          }).style("font-size", style.annotationLabelFontSize).text(function(d) {
            return d;
          });
          var yLabelsHOffset = yLabelsG.node().getBBox().width || 0, annotationYLabelsHOffset = annotationYLabelsG.node().getBBox().width || 0, maxLabelWidth = yLabelsHOffset > annotationYLabelsHOffset ? yLabelsHOffset : annotationYLabelsHOffset;
          annotationYLabels.attr("x", maxLabelWidth);
          yLabelsG.selectAll("text").attr("x", maxLabelWidth);
          heatmap.attr("transform", "translate(" + (maxLabelWidth + style.labelMargins.right) + ",0)");
          annotationCellsG.attr("transform", "translate(0," + verticalOffset + ")");
          var annotationCategoryCellsG = annotationCellsG.selectAll("g").data(data.annotations.categories).enter().append("g").attr("transform", function(d, i) {
            var y = i * (style.annotationCellHeight + style.annotationCategorySpacing);
            return "translate(0," + y + ")";
          });
          annotationCategoryCellsG.each(function(category, categoryIndex) {
            var thisEl = d3.select(this);
            var sampleNames = Object.keys(data.annotations.sampleToAnnotations), sampleIndex = sampleNames.map(function(d) {
              return [ d, data.xs.indexOf(d) ];
            });
            sampleIndex = sampleIndex.filter(function(d) {
              return d[1] >= 0;
            });
            sampleIndex = sampleIndex.sort(function(a, b) {
              return a[1] - b[1];
            }).map(function(d) {
              return d[0];
            });
            var colorInfo = data.annotations.annotationToColor[category], annColor;
            if (Object.prototype.toString.call(colorInfo) === "[object Array]") {
              annColor = d3.scale.linear().domain([ colorInfo[0], colorInfo[1] ]).range(style.annotationContinuousColorScale).interpolate(d3.interpolateLab);
            } else {
              var domain = Object.keys(colorInfo), range = domain.map(function(d) {
                return colorInfo[d];
              });
              annColor = d3.scale.ordinal().domain(domain).range(range);
            }
            thisEl.selectAll("rect").data(sampleIndex).enter().append("rect").attr("height", style.annotationCellHeight).attr("width", style.cellWidth).attr("x", function(d) {
              return xs.indexOf(d) * style.cellWidth;
            }).style("fill", function(d) {
              var value = data.annotations.sampleToAnnotations[d][categoryIndex];
              return annColor(value);
            });
          });
        }
        function renderXLabelsFn() {
          var annotationXLabelsG = heatmap.append("g").attr("class", "gd3annotationXLabels");
          var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;
          annotationXLabelsG.attr("transform", "translate(0," + verticalOffset + ")");
          annotationXLabelsG.selectAll("text").data(data.xs).enter().append("text").attr("y", function(d, i) {
            return -i * style.cellWidth;
          }).attr("transform", "rotate(90)").style("font-size", style.annotationLabelFontSize).text(function(d) {
            return d;
          });
        }
        function renderYLabelsFn() {
          var yLabels = yLabelsG.selectAll("text").data(ys).enter().append("text").attr("text-anchor", "end").attr("y", function(d, i) {
            return i * style.cellHeight + style.cellHeight;
          }).style("font-size", style.fontSize).text(function(d) {
            return d;
          });
          var maxLabelWidth = 0;
          yLabels.each(function() {
            var tmpWidth = d3.select(this).node().getBBox().width;
            maxLabelWidth = maxLabelWidth > tmpWidth ? maxLabelWidth : tmpWidth;
          });
          yLabels.attr("x", maxLabelWidth);
          heatmap.attr("transform", "translate(" + (maxLabelWidth + style.labelMargins.right) + ",0)");
        }
      });
    }
    return chart;
  }
  function heatmapStyle(style) {
    return {
      annotationCellHeight: style.annotationCellHeight || 10,
      annotationCategorySpacing: style.annotationCategorySpacing || 5,
      annotationContinuousColorScale: style.annotationContinuousColorScale || [ "#f7fcb9", "#004529" ],
      annotationLabelFontSize: style.annotationLabelFontSize || style.fontSize || 12,
      cellHeight: style.cellHeight || 14,
      cellWidth: style.cellWidth || 14,
      colorScale: style.colorScale || [ "rgb(255,255,217)", "rgb(237,248,177)", "rgb(199,233,180)", "rgb(127,205,187)", "rgb(65,182,196)", "rgb(29,145,192)", "rgb(34,94,168)", "rgb(37,52,148)", "rgb(8,29,88)" ],
      fontFamily: style.fontFamily || '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fontSize: style.fontSize || 12,
      height: style.height || 400,
      labelMargins: style.labelMargins || {
        bottom: 5,
        right: 2
      },
      margins: style.margins || {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0
      },
      noCellValueColor: style.noCellValueColor || "#a7a7a7",
      width: style.width || 400
    };
  }
  gd3.heatmap = function(params) {
    var params = params || {}, style = heatmapStyle(params.style || {});
    return heatmapChart(style);
  };
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
        cells: {},
        columnIdToActiveRows: {},
        rowIdToActiveColumns: {}
      }
    };
    data.get = function(attr) {
      if (!attr) return null; else if (attr === "datasets") return data.datasets; else if (attr === "ids") return data.ids; else if (attr === "labels") return data.labels;
    };
    data.reorderColumns = function() {
      function sortByExclusivity(c1, c2) {
        var c1X = data.matrix.columnIdToActiveRows[c1].length > 1, c2X = data.matrix.columnIdToActiveRows[c2].length > 1;
        return d3.ascending(c1X, c2X);
      }
      function sortByFirstActiveRow(c1, c2) {
        var c1First = data.matrix.columnIdToActiveRows[c1][0], c2First = data.matrix.columnIdToActiveRows[c2][0];
        return d3.ascending(c1First, c2First);
      }
      function sortByName(c1, c2) {
        return d3.ascending(data.labels.columns[c1], data.labels.columns[c2]);
      }
      function sortByColumnType(c1, c2) {
        return d3.ascending(data.maps.columnIdToType[c1], data.maps.columnIdToType[c2]);
      }
      var sortFns = [ sortByFirstActiveRow, sortByColumnType, sortByExclusivity, sortByName ];
      data.ids.columns.sort(function(c1, c2) {
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
    function defaultParse() {
      inputData.samples.forEach(function(s) {
        data.maps.columnIdToLabel[s._id] = s.name;
        data.labels.columns.push(s.name);
      });
      Object.keys(inputData.M).forEach(function(k, i) {
        data.maps.rowIdToLabel[i.toString()] = k;
        var numSamples = Object.keys(inputData.M[k]).length;
        data.labels.rows.push(k + " (" + numSamples + ")");
      });
      data.ids.columns = Object.keys(data.maps.columnIdToLabel);
      data.ids.rows = Object.keys(data.maps.rowIdToLabel);
      var setOfDatasets = {};
      Object.keys(inputData.sampleToTypes).forEach(function(colId) {
        setOfDatasets[inputData.sampleToTypes[colId]] = null;
        data.maps.columnIdToType[colId] = inputData.sampleToTypes[colId];
      });
      data.datasets = Object.keys(setOfDatasets);
      Object.keys(inputData.M).forEach(function(rowLabel, rowId) {
        var columns = Object.keys(inputData.M[rowLabel]);
        rowId = rowId.toString();
        data.matrix.rowIdToActiveColumns[rowId] = columns;
        columns.forEach(function(colId) {
          if (!data.matrix.columnIdToActiveRows[colId]) {
            data.matrix.columnIdToActiveRows[colId] = [];
          }
          data.matrix.columnIdToActiveRows[colId].push(rowId);
          data.matrix.cells[[ rowId, colId ].join()] = {
            dataset: inputData.sampleToTypes[colId],
            type: inputData.M[rowLabel][colId][0]
          };
        });
      });
    }
    defaultParse();
    if (inputData.annotations) {
      data.annotations = inputData.annotations;
    }
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
        data.reorderColumns();
        var wholeVisX = d3.scale.linear().domain([ 0, data.get("labels").columns.length ]).range([ style.labelWidth, width ]);
        var firstGroup = matrix.append("g").attr("class", ".mutmtxFirstGroup");
        var firstGroupColumns = firstGroup.selectAll("g").data(data.get("ids").columns).enter().append("g").attr("class", "mutmtxColumn").attr("id", function(d) {
          return d.key;
        }).attr("transform", function(d, i) {
          return "translate(" + wholeVisX(i) + ",0)";
        });
        svg.attr("height", function(d) {
          return Math.ceil(rowLabelsG.node().getBBox().height + 10);
        });
        if (data.annotations) {
          var names = Object.keys(data.annotations.sampleToAnnotations), categories = data.annotations.categories;
          var annRowLabelsG = svg.append("g").attr("class", "mutmtx-annRowLabels").attr("transform", "translate(0," + rowLabelsG.node().getBBox().height + ")"), annRowLabelsBG = annRowLabelsG.append("rect").style("fill", "#fff");
          var annRowLabels = annRowLabelsG.selectAll("text").data(categories).enter().append("text").attr("text-anchor", "end").attr("x", style.labelWidth - 5).attr("y", function(d, i) {
            return (i + 1) * style.annotationRowHeight + (i + 1) * style.annotationRowSpacing;
          }).style("font-family", style.fontFamily).style("font-size", style.annotationRowHeight).text(function(d) {
            return d;
          });
          annRowLabelsBG.attr("height", annRowLabelsG.node().getBBox().height + style.annotationRowSpacing).attr("width", annRowLabelsG.node().getBBox().width);
          var annColoring = data.annotations.annotationToColor;
          Object.keys(annColoring).forEach(function(d, i) {
            var coloring = annColoring[d];
            if (Object.keys(coloring).length == 0) {
              var names = Object.keys(data.annotations.sampleToAnnotations), max = d3.max(names, function(name) {
                return data.annotations.sampleToAnnotations[name][i];
              }), min = d3.min(names, function(name) {
                return data.annotations.sampleToAnnotations[name][i];
              });
              annColoring[d] = {
                scale: d3.scale.linear().domain([ min, max ]).range(style.annotationContinuousScale).interpolate(d3.interpolateLab),
                typeOfScale: "continuous"
              };
            }
          });
          var maxTextHeight = 0;
          firstGroupColumns.each(function(annKey) {
            var annotationKey = names.reduce(function(prev, cur, i, array) {
              if (annKey.indexOf(cur) > -1) return cur; else return prev;
            }, null);
            if (annotationKey == null) return;
            var annData = data.annotations.sampleToAnnotations[annotationKey];
            var mtxOffset = style.rowHeight * data.ids.rows.length;
            var aGroup = d3.select(this).append("g").attr("id", "annotation-" + annKey);
            aGroup.selectAll("rect").data(annData).enter().append("rect").attr("height", style.annotationRowHeight).attr("x", 0).attr("y", function(d, i) {
              var spacing = style.annotationRowSpacing * (i + 1);
              return mtxOffset + spacing + style.annotationRowHeight * i;
            }).attr("width", 20).style("fill", function(d, i) {
              var coloring = annColoring[categories[i]];
              if (coloring.typeOfScale == "continuous") return coloring.scale(d); else if (Object.keys(coloring).length > 0) return coloring[d]; else return "#000";
            });
            var annTextOffset = annData.length * (style.annotationRowHeight + style.annotationRowSpacing) + style.annotationRowSpacing + mtxOffset;
            var annText = aGroup.append("text").attr("x", annTextOffset).attr("text-anchor", "start").attr("transform", "rotate(90)").style("font-family", style.fontFamily).style("font-size", style.annotationFontSize).text(annotationKey);
            var annTextHeight = annText.node().getBBox().width + style.annotationRowSpacing;
            maxTextHeight = annTextHeight > maxTextHeight ? annTextHeight : maxTextHeight;
          });
          var svgHeight = svg.attr("height"), numAnnotations = data.annotations.sampleToAnnotations[names[0]].length, svgHeight = parseInt(svgHeight) + numAnnotations * (style.annotationRowHeight + 2);
          svg.attr("height", svgHeight + maxTextHeight);
        }
        var zoom = d3.behavior.zoom().x(wholeVisX).scaleExtent([ 1, 14 ]).on("zoom", function() {
          rerenderMutationMatrix();
        });
        svg.call(zoom);
        renderMutationMatrix();
        rerenderMutationMatrix();
        function rerenderMutationMatrix() {
          var t = zoom.translate(), tx = t[0], ty = t[1], scale = zoom.scale();
          tx = Math.min(tx, 0);
          zoom.translate([ tx, ty ]);
          var colWidth = wholeVisX(1) - wholeVisX(0);
          firstGroupColumns.attr("transform", function(d) {
            var colIndex = data.ids.columns.indexOf(d);
            return "translate(" + wholeVisX(colIndex) + ",0)";
          });
          firstGroupColumns.selectAll("rect").attr("width", colWidth);
        }
        function renderMutationMatrix() {
          var colWidth = wholeVisX(1) - wholeVisX(0);
          var rects = firstGroupColumns.append("g").attr("class", "mutmtx-sampleMutationRects").selectAll("rect").data(function(colId) {
            var activeRows = data.matrix.columnIdToActiveRows[colId];
            return activeRows.map(function(rowId) {
              return {
                row: rowId,
                cell: data.matrix.cells[[ rowId, colId ].join()]
              };
            });
          }).enter().append("rect").attr("x", 0).attr("y", function(d) {
            return style.rowHeight * data.ids.rows.indexOf(d.row);
          }).attr("height", style.rowHeight).attr("width", colWidth).style("fill", function(d) {
            return colTypeToColor[d.cell.dataset];
          });
          console.log(firstGroupColumns.selectAll("rect"));
          firstGroupColumns.selectAll("rect").each(function() {
            d3.select(this).call(gd3.annotation());
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
      annotationContinuousScale: style.annotationContinuousScale || [ "#fcc5c0", "#49006a" ],
      annotationFontSize: style.annotationFontSize || 10,
      annotationRowHeight: style.annotationRowHeight || 10,
      annotationRowSpacing: style.annotationRowSpacing || 5,
      bgColor: style.bgColor || "#F6F6F6",
      blockColorMedium: style.blockColorMedium || "#95A5A6",
      blockColorStrongest: style.blockColorStrongest || "#2C3E50",
      boxMargin: style.boxMargin || 5,
      colorSampleTypes: style.colorSampleTypes || true,
      coocurringColor: style.coocurringColor || "orange",
      exclusiveColor: style.exclusiveColor || "blue",
      fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
      fullWidth: style.width || 600,
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
      var proteinDomainDB = cdata.proteinDomainDB || Object.keys(cdata.domains)[0] || "";
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
      var datasetNames = cdata.mutations.map(function(m) {
        return m.dataset;
      });
      tmpMutationCategories = {};
      datasetNames.forEach(function(d) {
        tmpMutationCategories[d] = null;
      });
      d.mutationCategories = Object.keys(tmpMutationCategories);
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
    var showScrollers = true;
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
        var tG = svg.append("g");
        var transcriptAxis = tG.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (style.height / 2 + style.transcriptBarHeight + 6) + ")").style("font-family", style.fontFamily).style("font-size", "12px").style("fill", "#000").call(xAxis);
        var transcriptBar = tG.append("rect").attr("height", style.transcriptBarHeight).attr("width", x(stop) - x(start)).attr("x", x(start)).attr("y", height / 2).style("fill", "#ccc");
        var zoom = d3.behavior.zoom().x(x).scaleExtent([ 1, 100 ]).on("zoom", function() {
          updateTranscript();
        });
        svg.call(zoom);
        var mutationsG = tG.append("g").attr("class", "transcriptMutations"), inactivatingG = mutationsG.append("g"), activatingG = mutationsG.append("g");
        var inactivatingData = data.get("mutations").filter(function(d) {
          return data.isMutationInactivating(d.ty);
        }), activatingData = data.get("mutations").filter(function(d) {
          return !data.isMutationInactivating(d.ty);
        });
        var inactivatingMutations = inactivatingG.selectAll(".symbols").data(inactivatingData).enter().append("path").attr("class", "symbols").attr("d", d3.svg.symbol().type(function(d, i) {
          return d3.svg.symbolTypes[data.get("mutationTypesToSymbols")[d.ty]];
        }).size(style.symbolWidth)).style("fill", function(d, i) {
          return sampleTypeToColor[d.dataset];
        }).style("stroke", function(d, i) {
          return sampleTypeToColor[d.dataset];
        }).style("stroke-width", 2);
        var activatingMutations = activatingG.selectAll(".symbols").data(activatingData).enter().append("path").attr("class", "symbols").attr("d", d3.svg.symbol().type(function(d, i) {
          return d3.svg.symbolTypes[data.get("mutationTypesToSymbols")[d.ty]];
        }).size(style.symbolWidth)).style("fill", function(d, i) {
          return sampleTypeToColor[d.dataset];
        }).style("stroke", function(d, i) {
          return sampleTypeToColor[d.dataset];
        }).style("stroke-width", 2);
        var domainGroupsData = data.get("proteinDomains");
        var domainGroups = tG.selectAll(".domains").data(domainGroupsData ? data.get("proteinDomains").slice() : []).enter().append("g").attr("class", "domains");
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
        if (showScrollers) {
          renderScrollers();
        }
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
          activatingMutations.attr("transform", function(d, i) {
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
          inactivatingMutations.attr("transform", function(d, i) {
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
        function renderScrollers() {
          tG.attr("transform", "translate(20,0)");
          var sG = svg.append("g");
          var activatingYs = [], inactivatingYs = [];
          function getYs(transforms) {
            return function() {
              var transform = d3.select(this).attr("transform");
              if (transform) {
                var y = parseFloat(transform.split(",")[1].split(")")[0]);
                transforms.push(y);
              }
            };
          }
          activatingMutations.each(getYs(activatingYs));
          inactivatingMutations.each(getYs(inactivatingYs));
          var minActivatingY = d3.min(activatingYs), maxInactivatingY = d3.max(inactivatingYs);
          var maxActivatingOffset = minActivatingY < 0 ? Math.abs(minActivatingY) + 1.1 * style.symbolWidth : 0, maxInactivatingOffset = maxInactivatingY > style.height ? maxInactivatingY - style.symbolWidth : 0;
          var gradient = svg.append("svg:defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");
          gradient.append("svg:stop").attr("offset", "0%").attr("stop-color", "#eeeeee").attr("stop-opacity", 1);
          gradient.append("svg:stop").attr("offset", "100%").attr("stop-color", "#666666").attr("stop-opacity", 1);
          var dragSlider = d3.behavior.drag().on("dragstart", dragStart).on("drag", dragMove).on("dragend", dragEnd);
          function dragStart(d) {
            d3.event.sourceEvent.stopPropagation();
            var thisEl = d3.select(this);
            thisEl.style("fill", "#888888");
          }
          function dragMove(d) {
            var thisEl = d3.select(this), higher = d.loc == "top" ? d.max : d.min, lower = higher == d.max ? d.min : d.max;
            if (d3.event.y > lower) {
              thisEl.attr("cy", lower);
            } else if (d3.event.y < higher) {
              thisEl.attr("cy", higher);
            } else {
              thisEl.attr("cy", d3.event.y);
              var activeG = d.loc == "top" ? activatingG : inactivatingG, activeM = d.loc == "top" ? activatingMutations : inactivatingMutations;
              var scrollDomain = lower - higher, scrollNow = d3.event.y - higher, scrollPercent = d.loc == "top" ? 1 - scrollNow / scrollDomain : scrollNow / scrollDomain;
              var offset = d.loc == "top" ? maxActivatingOffset : -1 * maxInactivatingOffset, adjust = offset * scrollPercent;
              activeG.attr("transform", "translate(0," + adjust + ")");
              activeM.each(function() {
                var thisEl = d3.select(this), transform = thisEl.attr("transform");
                if (transform) {
                  var y = parseFloat(transform.split(",")[1].split(")")[0]);
                  if (d.loc == "top") {
                    thisEl.style("opacity", y + adjust > lower ? 0 : 1);
                  } else {
                    thisEl.style("opacity", y + adjust < higher ? 0 : 1);
                  }
                }
              });
            }
          }
          function dragEnd(d) {
            var thisEl = d3.select(this);
            thisEl.style("fill", "url(#gradient)");
          }
          sG.append("rect").attr("x", 0).attr("y", 0).attr("width", 15).attr("height", style.height).style("fill", "#fff");
          sG.append("line").attr("x1", 6).attr("y1", 10).attr("x2", 6).attr("y2", style.height / 2 - style.transcriptBarHeight / 2 + 10).style("stroke", "#ccc").style("stroke-width", 1);
          sG.append("line").attr("x1", 6).attr("y1", style.height / 2 + style.transcriptBarHeight / 2 + 10).attr("x2", 6).attr("y2", style.height - 10).style("stroke", "#ccc").style("stroke-width", 1);
          var sliderBounds = [ {
            min: style.height / 2 - style.transcriptBarHeight / 2 + 4,
            max: 6,
            loc: "top"
          }, {
            min: style.height / 2 + style.transcriptBarHeight + 4,
            max: style.height - 6,
            loc: "bottom"
          } ];
          sG.selectAll("circle").data(sliderBounds).enter().append("circle").attr("r", 5).attr("cx", 6).attr("cy", function(d) {
            return d.min;
          }).style({
            "box-shadow": "0px 0px 5px 0px rgba(0,0,0,0.75)",
            fill: "url(#gradient)",
            stroke: "#666",
            "stroke-width": 1
          }).call(dragSlider);
        }
      });
    }
    function showScrollers(val) {
      showScrollers = val;
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