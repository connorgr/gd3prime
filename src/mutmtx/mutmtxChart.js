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
              .data(data.rowNames)
              .enter()
                .append('text')
                    .attr('text-anchor', 'end')
                    .attr('x', 0)
                    .attr('y', function(d,i) { return style.rowHeight*data.rowNames.indexOf(d) + style.rowHeight - 3})
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
      var rowRules = svg.append('g')
              .attr('class', 'mutmtxRowRules')
              .selectAll('line')
              .data(data.rowNames)
              .enter()
                .append('line')
                    .attr('x1', style.labelWidth)
                    .attr('x2', style.labelWidth + style.matrixWidth)
                    .attr('y1', function(d,i) { return style.rowHeight*data.rowNames.indexOf(d) + style.rowHeight})
                    .attr('y2', function(d,i) { return style.rowHeight*data.rowNames.indexOf(d) + style.rowHeight})
                    .style('stroke-width', '.5px')
                    .style('stroke', '#ddd');


      data.reorderColumns();


      // Scales for the height/width of rows/columns
      var columnX = d3.scale.linear()
          .domain([0, data.getVizData().length])
          .range([style.labelWidth, width]);

      // Define the matrix and columns to be included
      var columns = matrix.selectAll('g')
              .data(data.getVizData())
              .enter()
              .append('g')
                .attr('class', 'mutmtxColumn')
                .attr('id', function(d) { return d.key; })
                .attr('transform', function(d) {
                  var colIndex = data.columnNames.indexOf(d.key);
                  return 'translate('+columnX(colIndex)+',0)';
                });


      // Zoom behavior
      var zoom = d3.behavior.zoom()
          .x(columnX)
          .scaleExtent([1, Math.round( style.minBoxWidth * data.getVizData().length / style.width)])
          .on('zoom', function() {
              var translateCheck = d3.event.translate;
              translateCheck[1] = 0;
              console.log(translateCheck, d3.event.scale);
              matrix.attr('transform', "translate(" + translateCheck + ")scale(" + d3.event.scale + ")");
              renderMutationMatrix();
          });
      svg.call(zoom);

      renderMutationMatrix();

      svg.attr('height', function(d) {
        console.log(rowLabelsG.node().getBBox().height);
        return Math.ceil(rowLabelsG.node().getBBox().height + 10);
      })


      function renderMutationMatrix() {
        var columns = matrix.selectAll('.mutmtxColumn'),
            colWidth = style.matrixWidth/data.getVizData().length;

        columns.selectAll('rect')
          .data(function(d){ return d.value.activeRows.map(function(row){return {row:row, type:data.columnsToTypes[d.key]}});})
          .enter()
          .append('rect')
            .attr('x', 0)
            .attr('y', function(d) {
              return style.rowHeight*data.rowNames.indexOf(d.row) + style.rowHeight;
            })
            .attr('height', style.rowHeight)
            .attr('width', colWidth)
            .style('fill', function(d) { return colTypeToColor[d.type]; });
      }

      if(options.showSummary == true) {
        var summaryArea = selection.append('div');
        summaryArea.append('span').text('Summary:');
        summaryArea.append('input')
            .attr('type', 'checkbox')
            .on('click', function() {
              data.summarize(this.checked, 60);

              // Reconfigure x function so positioning is correct
              columnX = d3.scale.linear()
                .domain([0, data.getColumnNames().length])
                .range([style.labelWidth, width]);

              var columns = matrix.selectAll('.mutmtxColumn').data(data.getVizData());

              columns.enter().append('g');
              columns.exit().remove();

              columns.attr('class', 'mutmtxColumn')
                  .attr('id', function(d) { return d.key; })
                  .attr('transform', function(d) {
                    var colIndex = data.getColumnNames().indexOf(d.key);
                    return 'translate('+columnX(colIndex)+',0)';
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

