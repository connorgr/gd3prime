import "scatterplotData.js";

function scatterplotChart(style) {
  function chart(selection) {
    selection.each(function(data) {
      data = scatterplotData(data);

      var height = style.height - style.margins.top - style.margins.bottom,
          width = style.width - style.margins.left - style.margins.right;

      var pointColor = d3.scale.ordinal().domain(data.categories).range(style.categoryColors);

      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
                .attr('height', style.height)
                .attr('width', style.width)
                .attr('xmlns', 'http://www.w3.org/2000/svg')
                .style('font-family', style.fontFamily)
                .style('font-size', style.fontSize);

      var scatterplot = svg.append('g').attr('transform', 'translate('+style.margins.left+','+style.margins.top+')');

      // Construct x and y scales
      var x = d3.scale.linear().domain([data.xScale.min, data.xScale.max]).range([0, width]),
          y = d3.scale.linear().domain([data.yScale.min, data.yScale.max]).range([height, 0]);

      // Construct x and y axis
      var xAxis = d3.svg.axis().scale(x).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).orient('left');

      // Render both axis
      var axisStyle = { stroke: 'black', fill: 'none','shape-rendering': 'crispEdges', 'stroke-width': '1px'},
          axisG = scatterplot.append('g'),
          xAxisRender = axisG.append('g').attr('class', 'x axis')
              .attr('transform', 'translate(0,' + height + ')')
              .call(xAxis),
          yAxisRender = axisG.append('g').attr('class', 'y axis')
              .call(yAxis);

      axisG.selectAll('.tick text').style('fill', 'black').style('font-size', '10px');
      axisG.selectAll('path').style(axisStyle);

      scatterplot.selectAll('.point')
          .data(data.pts)
          .enter()
          .append('path')
              .attr('class', 'point')
              .attr('d', d3.svg.symbol().type('circle')) // TODO change this based on category
              .attr('transform', function(d) { return 'translate(' + x(d.x) + ',' + y(d.y) + ')'; })
              .style('fill', function(d) { return pointColor(d.category); });

    });
  }


  return chart;
}