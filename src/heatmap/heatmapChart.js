import "heatmapData";

function heatmapChart(style) {
  function chart(selection) {
    selection.each(function(data) {
      data = heatmapData(data);

      var height = style.height,
          width = style.width;

      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
                .attr('height', height)
                .attr('width', width)
                .style('font-family', style.fontFamily)
                .style('font-size', style.fontFamily);

      var cells = data.cells,
          xs = data.xs,
          ys = data.ys;

      // colorDomain is necessary to have multihue ranges for the scale
      var colorDomain = d3.range(data.minCellValue, data.maxCellValue,
                  (data.maxCellValue-data.minCellValue)/style.colorScale.length)
              .concat([data.maxCellValue]),
          colorScale = d3.scale.linear()
              .domain(colorDomain)
              .range(style.colorScale)
              .interpolate(d3.interpolateLab);

      var heatmap = svg.append('g').attr('class', 'heatmapGroup');

      var heatmapCells = heatmap.selectAll('.rect')
          .data(cells)
          .enter()
          .append('rect')
              .attr('height', style.cellHeight)
              .attr('width', style.cellWidth)
              .attr('x', function(d, i) { return data.xs.indexOf(d.x) * style.cellWidth; })
              .attr('y', function(d, i) { return data.ys.indexOf(d.y) * style.cellHeight; })
              .style('fill', function(d) {
                return d.value == null ? style.noCellValueColor : colorScale(d.value);
              });

      heatmapCells.append('title').text(function(d) {
        return ['x: ' + d.x, 'y: ' + d.y, 'value: ' + (d.value == null ? 'No data' : d.value)]
            .join('\n');
      });

      var legendG = svg.append('g'),
          legendScale = legendG.append('g');

    });
  }

  return chart;
}