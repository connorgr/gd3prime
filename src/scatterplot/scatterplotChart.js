import "scatterplotData.js";

function scatterplotChart(style) {
  function chart(selection) {
    selection.each(function(data) {
      data = scatterplotData(data);

      var height = style.height,
          width = style.width;

      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
                .attr('height', height)
                .attr('width', width)
                .attr('xmlns', 'http://www.w3.org/2000/svg')
                .style('font-family', style.fontFamily)
                .style('font-size', style.fontSize);

      var scatterplot = svg.append('g');

      // Construct x and y scales
      var x = d3.scale.linear().domain([xScale.min, xScale.max]).range([0, width]),
          y = d3.scale.linear().domain([yScale.min, yScale.max]).range([height, 0]);

      // Construct x and y axis
      var xAxis = d3.svg.axis().scale(xScale).orient('bottom'),
          yAxis = d3.svg.axis().scale(yScale).orient('left');

      scatterplot.selectAll('.point')
          .data(data.pts)
          .enter()
          .append('path')
              .attr('class', 'point')
              .attr('d', d3.svg.symbol().type('circle')) // TODO change this based on category
              .attr('transform', function(d) { return 'translate(' + x(d.x) + ',' + y(d.y) + ')'; });

    });
  }


  return chart;
}