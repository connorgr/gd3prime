import "heatmapData";

function heatmapChart(style) {
  var renderAnnotations = true,
      renderLegend = true,
      renderXLabels = true,
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

      // define guide lines for mouse interaction to find cell location
      var guidelineData = [
        {x1: 0, y1: 0, x2: 0, y2: 0},
        {x1: 0, y1: 0, x2: 0, y2: 0},
        {x1: 0, y1: 0, x2: 0, y2: 0},
        {x1: 0, y1: 0, x2: 0, y2: 0}
      ];

      var guidelinesG = svg.append('g').attr('class', 'gd3heatmapGuidlines'),
          guidelines = guidelinesG.selectAll('line')
              .data(guidelineData)
              .enter()
              .append('line')
                  .style('stroke', '#000')
                  .style('stroke-width', 1);

      heatmapCells.on('mouseover', function() {
        var xOffset = +heatmap.attr('transform').replace(')','').replace('translate(','').split(',')[0];
        var thisEl = d3.select(this),
            h = +thisEl.attr('height'),
            w = +thisEl.attr('width'),
            x = (+thisEl.attr('x')) + xOffset,
            y = +thisEl.attr('y');

        var visibleHeight = +heatmap.node().getBBox().height,
            visibleWidth = +heatmap.node().getBBox().width + xOffset;

        guidelines.each(function(d,i) {
          var line = d3.select(this);
          if(i == 0) line.attr('x1',0).attr('x2',style.width).attr('y1',y).attr('y2',y);
          if(i == 1) line.attr('x1',0).attr('x2',style.width).attr('y1',y+h).attr('y2',y+h);
          if(i == 2) line.attr('x1',x).attr('x2',x).attr('y1',0).attr('y2',visibleHeight);
          if(i == 3) line.attr('x1',x+w).attr('x2',x+w).attr('y1',0).attr('y2',visibleHeight);
        });

        thisEl.style('stroke', '#000').style('stroke-width', 1);
      }).on('mouseout', function() {
        guidelines.attr('x1',0).attr('x2',0).attr('y1',0).attr('y2',0);
        d3.select(this).style('stroke', 'none');
      })

      var legendG = svg.append('g');

      yLabelsG = svg.append('g').attr('class', 'gd3heatmapYLabels');

      if (renderYLabels) renderYLabelsFn();
      if (renderAnnotations) renderAnnotations();
      if (renderXLabels) renderXLabelsFn();
      if (renderLegend) renderLegendFn();

      // Configure panning and zoom for the chart
      var heatmapStartX = parseFloat(heatmap.attr('transform').split('translate(')[1].split(',')[0]),
          heatmapW = heatmap.node().getBBox().width;

      var zoom = d3.behavior.zoom().on('zoom', function() {
          var t = zoom.translate(),
              tx = t[0];

          heatmap.attr('transform', 'translate('+(tx + heatmapStartX)+',0)');

          // Fade out/in heatmap and annotation cells that are out/in the viewport
          function inViewPort(x){ return (x) * style.cellWidth + tx > 0; }
          function cellVisibility(x){ return inViewPort(x) ? 1 : 0.1; }

          heatmapCells.style('opacity', function(d) {
            return cellVisibility(data.xs.indexOf(d.x));
          });
          if (renderXLabels){
            heatmap.selectAll('g.gd3annotationXLabels text')
                .style('opacity', function(name) {
                  return cellVisibility(data.xs.indexOf(name));
                });
          }
          if (renderAnnotations){
            heatmap.selectAll('g.gd3heatmapAnnotationCells rect')
                .style('opacity', function(x) {
                  return cellVisibility(data.xs.indexOf(x));
                });
          }
      });
      svg.call(zoom);

      function renderAnnotations() {
        if (!data.annotations) return;
        var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;

        var annotationCellsG = heatmap.append('g').attr('class', 'gd3heatmapAnnotationCells'),
            annotationYLabelsG = svg.append('g').attr('class', 'gd3annotationYLabels');

        annotationYLabelsG.attr('transform', 'translate(0,'+verticalOffset+')');

        // Draw annotation labels
        var annotationYLabels = annotationYLabelsG.selectAll('text')
            .data(data.annotations.categories)
            .enter()
            .append('text')
                .attr('text-anchor', 'end')
                .attr('y', function(d,i) {
                  return i*(style.annotationCellHeight+style.annotationCategorySpacing)
                      + style.annotationCellHeight;
                })
                .style('font-size', style.annotationLabelFontSize)
                .text(function(d) { return d; });

        // Modify label translations based on maximum of labelWidth AND annotationLabelWidth
        var yLabelsHOffset = yLabelsG.node().getBBox().width || 0,
            annotationYLabelsHOffset = annotationYLabelsG.node().getBBox().width || 0,
            maxLabelWidth = yLabelsHOffset > annotationYLabelsHOffset ? yLabelsHOffset : annotationYLabelsHOffset;

        annotationYLabels.attr('x', maxLabelWidth);
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

          // Render the cells for each category
          var annotationRects = thisEl.selectAll('rect')
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

          // Render title tooltips for the rectangles
          annotationRects.append('title').text(function(d) {
            var value = data.annotations.sampleToAnnotations[d][categoryIndex];
            return ['x: ' + d, 'y: ' + category, 'value: ' + (value == null ? 'No data' : value)]
                .join('\n');
          });
        });
      }

      function renderLegendFn() {
        var xOffset = +heatmap.attr('transform').replace(')','').replace('translate(','').split(',')[0],
            yOffset = heatmap.node().getBBox().height+style.annotationCategorySpacing;

        legendG.attr('transform', 'translate('+xOffset+','+yOffset+')');

        var colorScaleRect = legendG.append('rect')
            .attr('height', style.colorScaleHeight)
            .attr('width', style.colorScaleWidth);

        // Create a unique ID for the color map gradient in case multiple heatmaps are made
        var now = Date.now(),
            gradientId = 'gd3heatmapGradient'+now;

        // Configure the gradient to be mapped on to the legend
        var gradient = legendG.append('svg:defs')
              .append('svg:linearGradient')
                .attr('id', gradientId)
                .attr('x1', '0%')
                .attr('y1', '0%')
                .attr('x2', '100%')
                .attr('y2', '0%');

        style.colorScale.forEach(function(c, i){
          gradient.append('svg:stop')
              .attr('offset', i*1./style.colorScale.length)
              .attr('stop-color', c)
              .attr('stop-opacity', 1);
        });

        colorScaleRect.style('fill', 'url(#'+gradientId+')');

        // append the minimum value text
        legendG.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', 0)
            .attr('y', style.colorScaleHeight + style.fontSize + 3)
            .style('font-size', style.annotationLabelFontSize)
            .text(data.minCellValue);

        // append the maximum value text
        legendG.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', style.colorScaleWidth)
            .attr('y', style.colorScaleHeight + style.fontSize + 3)
            .style('font-size', style.annotationLabelFontSize)
            .text(data.maxCellValue);
      }

      function renderXLabelsFn() {
        var annotationXLabelsG = heatmap.append('g').attr('class', 'gd3annotationXLabels');
        // Position the x labels correctly
        var verticalOffset = heatmap.node().getBBox().height + style.labelMargins.bottom;
        annotationXLabelsG.attr('transform', 'translate(0,'+verticalOffset+')');

        // Draw the text labels for each x value
        annotationXLabelsG.selectAll('text')
            .data(data.xs)
            .enter()
            .append('text')
            .attr('y', function(d,i) { return -i*style.cellWidth; })
            .attr('transform', 'rotate(90)')
            .style('font-size', style.annotationLabelFontSize)
            .text(function(d) { return d; });
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