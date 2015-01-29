import "mutmtxData";

function mutmtxChart(style) {
  var drawHoverLegend = true,
      drawLegend = false,
      drawSortingMenu = true;

  var sortingOptionsData = [
    'First active row',
    'Column category',
    'Exclusivity',
    'Name'
  ];

  function chart(selection) {
    selection.each(function(data) {
      data = mutmtxData(data);

      var height = style.height,
          width = style.width;

      // Determine coloration
      var d3color = d3.scale.category20(),
          colCategoryToColor = {},
          datasets = data.get('datasets');

      for (var i = 0; i < datasets.length; i++) {
        colCategoryToColor[datasets[i]] = d3color(i);
      }

      // Select the svg element, if it exists.
      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg');

      svg.attr('id', 'mutation-matrix')
          .attr('width', width)
          .attr('height', height + style.labelHeight)
          .attr('xmlns', 'http://www.w3.org/2000/svg');

      // Append the matrix/cell rendering area. This needs to be done this early
      //    for z-indexing purposes
      var matrix = svg.append('g');

      var rowLabelsG = svg.append('g')
              .attr('class', 'mutmtx-rowLabels'),
          rowLabels = rowLabelsG.selectAll('text')
              .data(data.get('labels').rows)
              .enter()
                .append('text')
                    .attr('text-anchor', 'end')
                    .attr('x', 0)
                    .attr('y', function(d,i) { return style.rowHeight*data.labels.rows.indexOf(d) + style.rowHeight - 3})
                    .style('font-family', style.fontFamily)
                    .style('font-size', style.fontSize)
                    .text(function(d){return d});

      // Adjust the label width to minimize the label area and maximize matrix area
      var maxTextWidth = -Infinity;
      rowLabels.each(function(d) {
        var w = this.getComputedTextLength();
        maxTextWidth = w > maxTextWidth ? w : maxTextWidth;
      });
      rowLabels.attr('x', maxTextWidth)
      style.labelWidth = Math.ceil(maxTextWidth)+5;

      style.matrixWidth = width - style.labelWidth;

      // Add horizontal rules to the table
      var rowNames = data.get('labels').rows,
          rowRules = svg.append('g')
              .attr('class', 'mutmtxRowRules')
              .selectAll('line')
              .data(rowNames)
              .enter()
                .append('line')
                    .attr('x1', style.labelWidth)
                    .attr('x2', style.labelWidth + style.matrixWidth)
                    .attr('y1', function(d,i) { return style.rowHeight*rowNames.indexOf(d) + style.rowHeight})
                    .attr('y2', function(d,i) { return style.rowHeight*rowNames.indexOf(d) + style.rowHeight})
                    .style('stroke-width', '.5px')
                    .style('stroke', '#ddd');


      data.reorderColumns();

      var wholeVisX = d3.scale.linear()
          .domain([0, data.get('labels').columns.length])
          .range([style.labelWidth, width]);

      var columnsG = matrix.append('g')
                .attr('class', '.mutmtxColumnsGroup');
      var columns = columnsG.selectAll('g')
              .data(data.get('ids').columns)
              .enter()
              .append('g')
                .attr('class', 'mutmtxColumn')
                .attr('id', function(d) { return d.key; })
                .attr('transform', function(d, i) {
                  return 'translate('+wholeVisX(i)+',0)';
                });

      // adjust height based on column height
      svg.attr('height', function(d) {
        return Math.ceil(rowLabelsG.node().getBBox().height + 10);
      });


      // Render sample annotations should they exist
      if(data.annotations) {
        var names = Object.keys(data.annotations.sampleToAnnotations),
            categories = data.annotations.categories;

        var annRowLabelsG = svg.append('g').attr('class', 'mutmtx-annRowLabels')
                .attr('transform', 'translate(0,'+rowLabelsG.node().getBBox().height+')');

        var annRowLabels = annRowLabelsG.selectAll('text')
            .data(categories)
            .enter()
            .append('text')
                .attr('text-anchor', 'end')
                .attr('x', style.labelWidth - 5)
                .attr('y', function(d,i) {
                    return (i+1)*style.annotationRowHeight + (i+1)*style.annotationRowSpacing;
                })
                .style('font-family', style.fontFamily)
                .style('font-size', style.annotationRowHeight)
                .text(function(d) { return d; });

        var annColoring = data.annotations.annotationToColor;

        // For each coloring see if there is a predefined categorical set,
        // otherwise assume that it is continuous and create a scale
        Object.keys(annColoring).forEach(function(d,i) {
          var coloring = annColoring[d];
          if(Object.keys(coloring).length == 0) {
            // Find the maximum and minimum values for the category
            var names = Object.keys(data.annotations.sampleToAnnotations),
                max = d3.max(names, function(name) {
                  return data.annotations.sampleToAnnotations[name][i];
                }),
                min = d3.min(names, function(name) {
                  return data.annotations.sampleToAnnotations[name][i];
                });

            annColoring[d] = {
                max: max,
                min: min,
                scale: d3.scale.linear()
                    .domain([min,max])
                    .range(style.annotationContinuousScale)
                    .interpolate(d3.interpolateLab),
                typeOfScale: 'continuous'
            };
          }
        });

        // track the size of each text annotation for svg rescale
        var maxTextHeight = 0;

        // add annotation data for each sample in the matrix
        columns.each(function(annKey) {
          var annotationKey = names.reduce(function(prev,cur,i,array) {
            if(annKey.indexOf(cur) > -1) return cur;
            else return prev;
          }, null);

          if (annotationKey == null) return;
          var annData = data.annotations.sampleToAnnotations[annotationKey];

          // Get the offset caused by the matrix cells
          var mtxOffset = style.rowHeight * data.ids.rows.length;

          // render annotation data;
          var aGroup = d3.select(this).append('g').attr('id','annotation-'+annKey);
          aGroup.selectAll('rect').data(annData).enter()
              .append('rect')
                  .attr('height',style.annotationRowHeight)
                  .attr('x', 0)
                  .attr('y', function(d,i) {
                    var spacing = style.annotationRowSpacing*(i+1);
                    return mtxOffset + spacing + style.annotationRowHeight*i;
                  })
                  .attr('width', 20)
                  .style('fill', function(d,i) {
                    var coloring = annColoring[ categories[i] ];

                    if(coloring.typeOfScale == 'continuous') return coloring.scale(d);
                    else if(Object.keys(coloring).length > 0) return coloring[d];
                    else return '#000';
                  });

          var annTextOffset = annData.length
              * (style.annotationRowHeight + style.annotationRowSpacing)
              + style.annotationRowSpacing
              + mtxOffset;

          var annText = aGroup.append('text')
              .attr('x', annTextOffset)
              .attr('text-anchor', 'start')
              .attr('transform', 'rotate(90)')
              .style('font-family', style.fontFamily)
              .style('font-size', style.annotationFontSize)
              .text(annotationKey);

          // width because of rotation
          var annTextHeight = annText.node().getBBox().width + style.annotationRowSpacing;
          maxTextHeight =  annTextHeight > maxTextHeight ? annTextHeight : maxTextHeight;
        });

        // Modify the SVG height based on the sample annotations
        var svgHeight = svg.attr('height'),
            numAnnotations = data.annotations.sampleToAnnotations[names[0]].length,
            svgHeight = parseInt(svgHeight) + numAnnotations*(style.annotationRowHeight+2);

        svg.attr('height', svgHeight + maxTextHeight);
      }

      // Zoom behavior

      var zoom = d3.behavior.zoom()
          .x(wholeVisX)
          .scaleExtent([1, 14])
          .on('zoom', function() {
              rerenderMutationMatrix();
          });
      svg.call(zoom);

      renderMutationMatrix();
      rerenderMutationMatrix();

      if(drawLegend) drawLegendFn(selection.append('div').style('width', style.width));
      if(drawHoverLegend) {
        var container = selection.append('div'),
            legendHoverHeader = container.append('span')
                .style('cursor', 'pointer')
                .style('font-family', style.fontFamily)
                .style('font-size', style.fontSize + 'px')
                .text('Legend (mouse over)'),
            legend = container.append('div')
                .style('background', '#fff')
                .style('border', '1px solid #ccc')
                .style('padding', '10px')
                .style('position','absolute')
                .style('display','none')
                .style('visibility','hidden');

        legendHoverHeader.on('mouseover', function() {
          // make sure the width of the legend is less than the window size
          var legendW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
          legendW = legendW - 20 - 20; // - 20 for page space, -20 for div padding
          legendW = legendW < style.width - 20 - 20 ? legendW : style.width - 20 - 20;

          var body = document.body,
              docElement = document.documentElement,
              legendHeaderBounds = legendHoverHeader.node().getBoundingClientRect(),

              clientTop = docElement.clientTop || body.clientTop || 0,
              clientLeft = docElement.clientLeft || body.clientLeft || 0,
              scrollLeft = window.pageXOffset || docElement.scrollLeft || body.scrollLeft,
              scrollTop = window.pageYOffset || docElement.scrollTop || body.scrollTop,

              top = legendHeaderBounds.top + scrollTop - clientTop,
              left = legendHeaderBounds.left + scrollLeft - clientLeft;

          legend.style('left', left)
              .style('top', top + legendHeaderBounds.height + 5)
              .style('display','block')
              .style('visibility', 'visible');

          drawLegendFn(legend.style('width', legendW+'px'));
        })
        .on('mouseout', function() {
          legend.selectAll('*').remove();
          legend.style('display','none')
                .style('visibility','hidden');
        });
      }
      if(drawSortingMenu) drawSortingMenu();


      // Legend should be a DIV d3 selection
      function drawLegendFn(legend) {
        legend.style('font-size', style.fontSize + 'px')
        var columnCategories = legend.append('div')
                .style('min-width', legend.style('width'))
                .style('width', legend.style('width')),
            cellTypes = legend.append('div');

        // Tabulate categories
        var categories = {};
        Object.keys(data.maps.columnIdToCategory).forEach(function(k) {
          categories[data.maps.columnIdToCategory[k]] = null;
        });
        categories = Object.keys(categories).sort();
        var categoryLegendKeys = columnCategories.selectAll('div')
            .data(categories)
            .enter()
            .append('div')
                .style('display', 'inline-block')
                .style('font-family', style.fontFamily)
                .style('font-size', style.fontSize)
                .style('margin-right', function(d,i) {
                    return i == categories.length - 1 ? '0px' : '10px';
                });
        // Append the color blocks
        categoryLegendKeys.append('div')
            .style('background', function(d) { return colCategoryToColor[d]; })
            .style('display', 'inline-block')
            .style('height', style.fontSize + 'px')
            .style('width', (style.fontSize/2) + 'px');
        categoryLegendKeys.append('span')
            .style('display', 'inline-block')
            .style('margin-left', '2px')
            .text(function(d) { return d; });
        // Resize the category legend key widths based on max bounding box
        var categoryLegendKeyWidths = [];
        categoryLegendKeys.each(function () {
          var cWidth = this.getBoundingClientRect().width;
          categoryLegendKeyWidths.push(cWidth);
        });
        categoryLegendKeys.style('width', d3.max(categoryLegendKeyWidths) + 'px')
            .style('min-width', d3.max(categoryLegendKeyWidths) + 'px');

        // Tabulate cell type glyphs, if present
        if(Object.keys(data.maps.cellTypeToGlyph).length > 1) {
          var cellTypesData = Object.keys(data.maps.cellTypeToGlyph);
          var cellTypeLegendKeys = cellTypes.selectAll('div')
              .data(cellTypesData)
              .enter()
              .append('div')
                  .style('display', 'inline-block')
                  .style('font-family', style.fontFamily)
                  .style('font-size', style.fontSize)
                  .style('margin-right', function(d,i) {
                      return i == cellTypesData.length - 1 ? '0px' : '10px';
                  });

          cellTypeLegendKeys.append('svg')
              .attr('height', style.fontSize + 'px')
              .attr('width', style.fontSize + 'px')
              .style('background', d3color(0))
              .style('margin-right', '2px')
              .each(function(type) {
                var glyph = data.maps.cellTypeToGlyph[type]
                if(!glyph || glyph == null) return;

                d3.select(this).append('path')
                  .attr('d', function(type) {
                    var diameter = style.fontSize - style.fontSize/2;
                    return d3.svg.symbol().type(glyph).size(diameter*diameter)();
                  })
                  .attr('transform','translate('+(style.fontSize/2)+','+(style.fontSize/2)+')')
                  .style('fill', style.glyphColor)
                  .style('stroke', style.glyphStrokeColor)
                  .style('strokew-width', .5);
              });

          cellTypeLegendKeys.append('span')
              .text(function(d) { return d; });
        }


        if(data.annotations) {
          var annotationLegends = legend.append('div')
              .selectAll('div')
              .data(data.annotations.categories)
              .enter()
              .append('div');

          annotationLegends.each(function(annotationName) {
            var thisEl = d3.select(this),
                scale = data.annotations.annotationToColor[annotationName];

            thisEl.style('font-family', style.fontFamily)
                .style('font-size', style.fontSize);
            thisEl.append('span').text(annotationName+': ');

            if(scale.typeOfScale && scale.typeOfScale == 'continuous') {
              var scaleHeight = style.fontSize,
                  scaleWidth = style.fontSize*5;

              thisEl.append('span').text(scale.min);
              var gradientSvg = thisEl.append('svg')
                  .attr('height', scaleHeight)
                  .attr('width', scaleWidth)
                  .style('margin-left', '2px')
                  .style('margin-right', '2px');
              thisEl.append('span').text(scale.max);
              thisEl.selectAll('*').style('display','inline-block');

              // Create a unique ID for the color map gradient in case multiple heatmaps are made
              var now = Date.now(),
                  gradientId = 'gd3-mutmtx-gradient'+now;

              // Configure the gradient to be mapped on to the legend
              var gradient = gradientSvg.append('svg:defs')
                    .append('svg:linearGradient')
                      .attr('id', gradientId)
                      .attr('x1', '0%')
                      .attr('y1', '0%')
                      .attr('x2', '100%')
                      .attr('y2', '0%');

              var scaleRange = scale.scale.range();
              scaleRange.forEach(function(c, i){
                gradient.append('svg:stop')
                    .attr('offset', i*1./(scaleRange.length-1))
                    .attr('stop-color', c)
                    .attr('stop-opacity', 1);
              });

              gradientSvg.append('rect')
                  .attr('height', scaleHeight)
                  .attr('width', scaleWidth)
                  .attr('fill', 'url(#'+gradientId+')');
            } else {
              var annKeys = thisEl.selectAll('div')
                  .data(Object.keys(scale))
                  .enter()
                  .append('div')
                      .style('display', 'inline-block')
                      .style('font-family', style.fontFamily)
                      .style('font-size', style.fontSize)
                      .style('margin-right', function(d,i) {
                          return i == Object.keys(scale).length - 1 ? '0px' : '10px';
                      });
              annKeys.append('div')
                  .style('background', function(d) { return scale[d]; })
                  .style('display', 'inline-block')
                  .style('height', style.fontSize + 'px')
                  .style('width', (style.fontSize/2) + 'px');
              annKeys.append('span')
                  .style('display', 'inline-block')
                  .style('margin-left','2px')
                  .text(function(d) { return d; });
            }
          });
        }

      }


      function drawSortingMenu() {
        var menu = selection.append('div');
        var title = menu.append('p')
            .style('cursor', 'pointer')
            .style('font-family', style.fontFamily)
            .style('font-size', style.fontSize + 'px')
            .style('margin-bottom','0px')
            .text('Sort columns [+]');

        var optionsMenu = menu.append('ul')
            .style('display', 'none')
            .style('list-style', 'none')
            .style('margin-right', '0px')
            .style('margin-bottom', '0px')
            .style('margin-left', '0px')
            .style('margin-top', '0px')
            .style('padding-left', 0);

        title.on('click', function() {
          var optionsShown = optionsMenu.style('display') == 'block',
              display = optionsShown ? 'none' : 'block',
              visibility = optionsShown ? 'hidden' : 'visible';

          d3.select('p').text('Sort columns ' + (optionsShown ? '[+]' : '[-]'));

          optionsMenu.style('display', display);
          optionsMenu.style('visibility', visibility);
        });

        renderMenu();

        function renderMenu() {
          optionsMenu.selectAll('li').remove();
          var menuItem = optionsMenu.selectAll('li')
              .data(sortingOptionsData)
              .enter()
              .append('li')
                  .style('font-family', style.fontFamily)
                  .style('font-size', style.sortingMenuFontSize + 'px');

          // Populate each menu item with up/down sort toggles and text
          menuItem.each(function(menuText,menuPosition) {
              var texts = [(menuPosition+1)+'. ','↑',' ','↓',' ',' ',menuText],
                  thisLi = d3.select(this);
              thisLi.selectAll('span')
                  .data(texts)
                  .enter()
                  .append('span')
                      .text(function(d) { return d; })
                      .each(function(d,i) {
                        // Define behavior for voting glyphs
                        if(i != 1 && i != 3) return;
                        d3.select(this).style('cursor','pointer')
                            .on('mouseover', function() {
                              d3.select(this).style('color', 'red');
                            })
                            .on('mouseout', function() {
                              d3.select(this).style('color', style.fontColor);
                            })
                            .on('click', function() {
                              if(i == 1 && menuPosition == 0) return;
                              if(i == 3 && menuPosition == sortingOptionsData.length - 1) return;

                              var neighbor = menuPosition + (i == 1 ? -1 : 1),
                                  neighborText = sortingOptionsData[neighbor];
                              sortingOptionsData[neighbor] = menuText;
                              sortingOptionsData[menuPosition] = neighborText;

                              data.reorderColumns(sortingOptionsData);
                              renderMenu();
                              rerenderMutationMatrix(true);

                              var orderedLabels = data.ids.columns.map(function(d) {
                                return data.maps.columnIdToLabel[d];
                              });
                              gd3.dispatch.sort({columnLabels: orderedLabels});
                            });
                      });
          });
        }
      }


      function rerenderMutationMatrix(transition) {
        var t = zoom.translate(),
          tx = t[0],
          ty = t[1],
          scale = zoom.scale();

        tx = Math.min(tx, 0);

        zoom.translate([tx, ty]);

        var colWidth = wholeVisX(1)-wholeVisX(0);
        if(transition && transition == true) {
          columns.transition().attr('transform', function(d) {
            var colIndex = data.ids.columns.indexOf(d);
            return 'translate('+wholeVisX(colIndex)+',0)';
          });
        } else {
          columns.attr('transform', function(d) {
            var colIndex = data.ids.columns.indexOf(d);
            return 'translate('+wholeVisX(colIndex)+',0)';
          });
        }

        // Redraw each cell and any glyphs the cell might have
        columns.selectAll('rect').attr('width', colWidth);
        columns.selectAll('.gd3mutmtx-cellClyph').attr('transform', function (d) {
              var str = d3.select(this).attr('transform'),
                  then = str.replace('translate','').replace(')','').split(','),
                  x = colWidth/2,
                  y = +then[1],
                  now = 'translate('+x+','+y+')';
              return now;
            })
            .attr('d', function(d) {
              var cellType = d.cell.type,
                  glyph = data.maps.cellTypeToGlyph[cellType],
                  gWidth = d3.min([colWidth, style.rowHeight - style.rowHeight/2]);
              return d3.svg.symbol().type(glyph).size(gWidth*gWidth)();
            });
      }


      function renderMutationMatrix() {
        var colWidth = wholeVisX(1)-wholeVisX(0);

        var cells = columns.append('g')
            .attr('class', 'mutmtx-sampleMutationCells')
            .selectAll('g')
            .data(function(colId){
              var activeRows = data.matrix.columnIdToActiveRows[colId];
              return activeRows.map(function(rowId){
                return {colId: colId, row:rowId, cell:data.matrix.cells[[rowId, colId].join()]}
              });
            })
            .enter()
            .append('g');

        // For each cell append a rect and if appropriate a glyph on the rect
        cells.each(function(d) {
          var thisCell = d3.select(this),
              y = style.rowHeight*data.ids.rows.indexOf(d.row);

          thisCell.append('rect')
              .attr('data-column-id', d.colId)
              .attr('x', 0)
              .attr('y', y)
              .attr('height', style.rowHeight)
              .attr('width', colWidth)
              .style('fill', colCategoryToColor[d.cell.dataset]);

          var cellType = d.cell.type,
              glyph = data.maps.cellTypeToGlyph[cellType];

          if(glyph && glyph != null) {
            thisCell.append('path')
                .attr('class','gd3mutmtx-cellClyph')
                .attr('d', d3.svg.symbol().type(glyph).size(colWidth*colWidth))
                .attr('transform', 'translate('+(colWidth/2)+','+(y + style.rowHeight/2)+')')
                .style('fill', style.glyphColor)
                .style('stroke', style.glyphStrokeColor)
                .style('stroke-width', .5);
          }
        });

        ///////////////////////////////////////////////////////////////////////
        // Add dispatch to outline mutations in the same sample
        // onmouseover

        // Select the sample names and the mutations, and give each of the
        // mutations a hidden stroke
        var columnNames = columns.selectAll("text");
        var rects = columns.select('g.mutmtx-sampleMutationCells')
          .selectAll("g")
          .selectAll("rect")
          .attr({"stroke-width": 1, "stroke": "black", "stroke-opacity": 0})

        // Define the dispatch events
        columns.select('g.mutmtx-sampleMutationCells')
          .selectAll('g')
          .on("mouseover", function(d){
            gd3.dispatch.sample({ sample: data.maps.columnIdToLabel[d.colId], over: true});
          }).on("mouseout", function(d){
            gd3.dispatch.sample({ sample: data.maps.columnIdToLabel[d.colId], over: false});
          });

        gd3.dispatch.on("sample.mutmtx", function(d){
          var over = d.over, // flag if mouseover or mouseout
              sample = d.sample,
              affectedColumns = columnNames.filter(function(d){
                return data.maps.columnIdToLabel[d] == sample;
              });

          if (gd3_util.selectionSize(affectedColumns)){
            // Show the small stroke around each of the sample's mutations
            rects.attr("stroke-opacity", 0);
            rects.filter(function(d){ return data.maps.columnIdToLabel[d.colId] == sample; })
              .attr("stroke-opacity", over ? 1 : 0);

            // Highlight the sample name
            columnNames.style({ "opacity": over ? 0.25 : 1, "font-weight": "normal"});
            affectedColumns.style({"opacity": 1, "font-weight": over ? "bold" : "normal"});
          }
        })

        // columns.selectAll('rect').each(function() {
        //   d3.select(this).call(gd3.annotation())
        // });
      }
    });
  }

  chart.showHoverLegend = function(state) {
    drawHoverLegend = state;
    return chart;
  }

  chart.showLegend = function(state) {
    drawLegend = state;
    return chart;
  }

  chart.showSortingMenu = function(state) {
    drawSortingMenu = state;
    return chart;
  }

  return chart;
}

