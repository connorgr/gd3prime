import "heatmapData";

function heatmapChart(style) {
  var renderAnnotations = true,
      renderYLabels = true;

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

      var heatmap = svg.append('g').attr('class', 'gd3heatmapCellsContainer');

      var heatmapCells = heatmap.append('g').attr('class', 'gd3heatmapCells').selectAll('.rect')
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

      yLabelsG = svg.append('g').attr('class', 'gd3heatmapYLabels');

      if (renderYLabels) {
        renderYLabelsFn();
      }

      if (renderAnnotations) {
        renderAnnotations();
      }

      function renderAnnotations() {
        if (!data.annotations) return;
        var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;

        var annotationCellsG = heatmap.append('g').attr('class', 'gd3heatmapAnnotationCells'),
            annotationLabelsG = svg.append('g').attr('class', 'gd3annotationYLabels');

        annotationLabelsG.attr('transform', 'translate(0,'+verticalOffset+')');

        // Draw annotation labels
        var annotationLabels = annotationLabelsG.selectAll('text')
            .data(data.annotations.categories)
            .enter()
            .append('text')
                .attr('text-anchor', 'end')
                .attr('y', function(d,i) {
                  return i*(style.annotationCellHeight+style.annotationCategorySpacing)
                      + style.annotationCellHeight;
                })
                .style('font-size', style.fontSize)
                .text(function(d) { return d; });

        // Modify label translations based on maximum of labelWidth AND annotationLabelWidth
        var yLabelsHOffset = yLabelsG.node().getBBox().width || 0,
            annotationLabelsHOffset = annotationLabelsG.node().getBBox().width || 0,
            maxLabelWidth = yLabelsHOffset > annotationLabelsHOffset ? yLabelsHOffset : annotationLabelsHOffset;

        annotationLabels.attr('x', maxLabelWidth);
        yLabelsG.selectAll('text').attr('x', maxLabelWidth);

        // move the heatmap and annotation cells over
        heatmap.attr('transform', 'translate(' + (maxLabelWidth+style.labelMargins.right) +',0)');
        annotationCellsG.attr('transform', 'translate(0,' + verticalOffset + ')');

        // Draw annotation cells
        var annotationCategoryCellsG = annotationCellsG.selectAll('g')
            .data(data.annotations.categories)
            .enter()
            .append('g')
                .attr('transform', function(d,i) {
                  var y = i*(style.annotationCellHeight+style.annotationCategorySpacing);
                  return 'translate(0,'+ y + ')';
                });

        // draw the cells for each category
        annotationCategoryCellsG.each(function(category, categoryIndex) {
          var thisEl = d3.select(this);

          var sampleNames = Object.keys(data.annotations.sampleToAnnotations),
              sampleIndex = sampleNames.map(function(d) { return [d,data.xs.indexOf(d)]; });

          sampleIndex = sampleIndex.filter(function(d) { return d[1] >= 0; });
          sampleIndex = sampleIndex.sort(function(a,b) { return a[1] - b[1]; })
              .map(function(d) { return d[0]; });

          // Decide on a color scale based on whether or not the color information lists a
          // continuous range, or if it instead lists categorical data
          var colorInfo = data.annotations.annotationToColor[category],
              annColor;
          if( Object.prototype.toString.call(colorInfo) === '[object Array]' ) {
            annColor = d3.scale.linear()
                .domain([colorInfo[0], colorInfo[1]])
                .range(style.annotationContinuousColorScale)
                .interpolate(d3.interpolateLab);
          } else {
            var domain = Object.keys(colorInfo),
                range = domain.map(function(d) { return colorInfo[d]; });
            annColor = d3.scale.ordinal().domain(domain).range(range);
          }

          thisEl.selectAll('rect')
              .data(sampleIndex)
              .enter()
              .append('rect')
                  .attr('height', style.annotationCellHeight)
                  .attr('width', style.cellWidth)
                  .attr('x', function(d) { return xs.indexOf(d)*style.cellWidth; })
                  .style('fill', function(d) {
                      var value = data.annotations.sampleToAnnotations[d][categoryIndex];
                      return annColor(value);
                  });
        });

        console.log(data.annotations)

      }

      function renderYLabelsFn() {
        var yLabels = yLabelsG.selectAll('text')
                .data(ys)
                .enter()
                .append('text')
                    .attr('text-anchor', 'end')
                    .attr('y', function(d,i) { return i * style.cellHeight + style.cellHeight; })
                    .style('font-size', style.fontSize)
                    .text(function(d) { return d; });

        // Determine the x positioning of the y labels
        var maxLabelWidth = 0;
        yLabels.each(function() {
          var tmpWidth = d3.select(this).node().getBBox().width;
          maxLabelWidth = maxLabelWidth > tmpWidth ? maxLabelWidth : tmpWidth;
        });
        yLabels.attr('x', maxLabelWidth);

        // move the heatmap over
        heatmap.attr('transform', 'translate(' + (maxLabelWidth+style.labelMargins.right) +',0)');
      }
    });
  }

  return chart;
}