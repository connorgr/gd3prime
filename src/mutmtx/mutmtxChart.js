import "mutmtxData";

function mutmtxChart(style) {

  function chart(selection) {
    selection.each(function(data) {
      data = mutmtxData(data);

      var height = style.fullHeight,
          width = style.fullWidth;

      // Determine coloration
      var d3color = d3.scale.category20(),
          colTypeToColor = {},
          datasets = data.get('datasets');

      for (var i = 0; i < datasets.length; i++) {
        colTypeToColor[datasets[i]] = d3color(i);
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
          rowLabelsBG = rowLabelsG.append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .style('fill', '#fff'),
          rowLabels = rowLabelsG.selectAll('text')
              .data(data.get('labels').rows)
              .enter()
                .append('text')
                    .attr('text-anchor', 'end')
                    .attr('x', 0)
                    .attr('y', function(d,i) { return style.rowHeight*data.labels.rows.indexOf(d) + style.rowHeight - 3})
                    .style('font-family', style.fontFamily)
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

      rowLabelsBG.attr('width', style.labelWidth).attr('height', rowLabelsG.node().getBBox().height);

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

      var firstGroup = matrix.append('g')
                .attr('class', '.mutmtxFirstGroup');
      var firstGroupColumns = firstGroup.selectAll('g')
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
                .attr('transform', 'translate(0,'+rowLabelsG.node().getBBox().height+')'),
            annRowLabelsBG = annRowLabelsG.append('rect').style('fill', '#fff');

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

        annRowLabelsBG.attr('height', annRowLabelsG.node().getBBox().height + style.annotationRowSpacing)
            .attr('width', annRowLabelsG.node().getBBox().width);

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
        firstGroupColumns.each(function(annKey) {
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

      function rerenderMutationMatrix() {
        var t = zoom.translate(),
          tx = t[0],
          ty = t[1],
          scale = zoom.scale();

        tx = Math.min(tx, 0);

        zoom.translate([tx, ty]);

        var colWidth = wholeVisX(1)-wholeVisX(0);
        firstGroupColumns.attr('transform', function(d) {
              var colIndex = data.ids.columns.indexOf(d);
              return 'translate('+wholeVisX(colIndex)+',0)';
            });

        firstGroupColumns.selectAll('rect').attr('width', colWidth);
      }


      function renderMutationMatrix() {
        var colWidth = wholeVisX(1)-wholeVisX(0);

        var rects = firstGroupColumns.append('g')
            .attr('class', 'mutmtx-sampleMutationRects')
            .selectAll('rect')
            .data(function(colId){
              var activeRows = data.matrix.columnIdToActiveRows[colId];
              return activeRows.map(function(rowId){
                return {row:rowId, cell:data.matrix.cells[[rowId, colId].join()]}
              });
            })
            .enter()
            .append('rect')
              .attr('x', 0)
              .attr('y', function(d) {
                return style.rowHeight*data.ids.rows.indexOf(d.row);
              })
              .attr('height', style.rowHeight)
              .attr('width', colWidth)
              .style('fill', function(d) { return colTypeToColor[d.cell.dataset]; });

        console.log(firstGroupColumns.selectAll('rect'));

        firstGroupColumns.selectAll('rect').each(function() {
          d3.select(this).call(gd3.annotation())
        });

      }
    });
  }

  return chart;
}

