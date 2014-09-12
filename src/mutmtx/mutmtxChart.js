import "mutmtxData";

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


      //data.reorderColumns();

      var wholeVisX = d3.scale.linear()
          .domain([0, data.get('labels').columns.length])
          .range([style.labelWidth, width]);

      var firstGroup = matrix.append('g')
                .attr('class', '.mutmtxFirstGroup');
      var firstGroupColumns = firstGroup.selectAll('g')
              .data(data.get('labels').columns)
              .enter()
              .append('g')
                .attr('class', 'mutmtxColumn')
                .attr('id', function(d) { return d.key; })
                .attr('transform', function(d, i) {
                  return 'translate('+wholeVisX(i)+',0)';
                });

      // var summaryGroups = matrix.selectAll('.mutmtxSummaryGroup')
      //         .data(data.getVizData().slice(1,data.getVizData().length))
      //         .enter()
      //         .append('g')
      //           .attr('class', 'mutmtxSummaryGroup');
      // var summaryGroupsColumns = summaryGroups.selectAll('g')
      //         .data(function(d){ return d; })
      //         .enter()
      //         .append('g')
      //           .attr('class', 'mutmtxColumn')
      //           .attr('id', function(d) { return d.key; });

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

      svg.attr('height', function(d) {
        return Math.ceil(rowLabelsG.node().getBBox().height + 10);
      })


      function rerenderMutationMatrix() {
        var t = zoom.translate(),
          tx = t[0],
          ty = t[1],
          scale = zoom.scale();

        tx = Math.min(tx, 0);

        zoom.translate([tx, ty]);

        var colWidth = wholeVisX(1)-wholeVisX(0);
        firstGroupColumns.attr('transform', function(d) {
              var colIndex = data.getColumnIds().indexOf(d.key);
              return 'translate('+wholeVisX(colIndex)+',0)';
            });
        // summaryGroupsColumns.attr('transform', function(d) {
        //       var colIndex = data.getColumnIds().indexOf(d.key);
        //       return 'translate('+wholeVisX(colIndex)+',0)';
        //     });
        firstGroupColumns.selectAll('rect').attr('width', colWidth);
        // summaryGroupsColumns.selectAll('rect').attr('width', colWidth);
      }


      function renderMutationMatrix() {
        var colWidth = wholeVisX(1)-wholeVisX(0);

        firstGroupColumns.selectAll('rect')
            .data(function(d){
              console.log(d);
              return d.value.activeRows.map(function(row){
                return {row:row, type:data.columnsToTypes[d.key]}
              });
            })
            .enter()
            .append('rect')
              .attr('x', 0)
              .attr('y', function(d) {
                return style.rowHeight*data.rowNames.indexOf(d.row);
              })
              .attr('height', style.rowHeight)
              .attr('width', colWidth)
              .style('fill', function(d) { return colTypeToColor[d.type]; })
              .call(gd3.annotation());

        // summaryGroupsColumns.selectAll('rect')
        //   .data(function(d){ return d.value.activeRows.map(function(row){return {row:row, type:data.columnsToTypes[d.key]}});})
        //   .enter()
        //   .append('rect')
        //     .attr('x', 0)
        //     .attr('y', function(d) {
        //       return style.rowHeight*data.rowNames.indexOf(d.row) + style.rowHeight;
        //     })
        //     .attr('height', style.rowHeight)
        //     .attr('width', colWidth)
        //     .style('fill', function(d) { return colTypeToColor[d.type]; });
      }

      if(options.showSummary == true) {
        var summaryArea = selection.append('div');
        summaryArea.append('span').text('Summary:');
        summaryArea.append('input')
            .attr('type', 'checkbox')
            .on('click', function() {
              // Reset camera
              matrix.attr('transform', 'translate(0,0)');

              // Summarize
              data.summarize(this.checked, 40);
              var updatedData = data.getVizData(),
                  firstGroupData = updatedData[0],
                  summaryGroupsData = updatedData.slice(1,updatedData.length);

              // Reconfigure xs so positioning is correct
              numVisibleCols = data.getVisibleColumns().length,
              columnWidth = (width-style.labelWidth)/numVisibleCols;

              // Readjust the first column, which displays either:
              //   1. all the data if summary is not active
              //   2. the first group of summarized data
              firstGroupColumns = firstGroup.selectAll('.mutmtxColumn').data(firstGroupData);

              firstGroupColumns.enter().append('g');
              firstGroupColumns.exit().remove();

              firstGroupColumns.attr('class', 'mutmtxColumn')
                  .attr('id', function(d) { return d.key; })
                  .attr('transform', function(d) {
                    var colIndex = data.getColumnIds().indexOf(d.key);

                    return 'translate('+wholeVisX(colIndex)+',0)';
                  });

              // Readjust summary groups, if active
              summaryGroups = matrix.selectAll('.mutmtxSummaryGroup').data(summaryGroupsData);
              summaryGroups.enter().append('g');
              summaryGroups.exit().remove();

              summaryGroups.attr('class', 'mutmtxSummaryGroup')
                  .attr('transform', function(d,i) {
                    return 'translate('+(i*30 + 30)+',0)';
                  });
              summaryGroupsColumns = summaryGroups.selectAll('g')
                  .data(function(d){ return d; })
                  .enter()
                  .append('g')
                    .attr('class', 'mutmtxColumn')
                    .attr('id', function(d) { return d.key; })
                    .attr('transform', function(d) {
                      var colIndex = data.getColumnIds().indexOf(d.key);
                      return 'translate('+wholeVisX(colIndex)+',0)';
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
  }

  return chart;
}

