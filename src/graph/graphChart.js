import "graphData.js";

function graphChart(style) {
  var anchorNodesOnClick = true;

  function chart(selection) {
    selection.each(function(data) {
      data = graphData(data);

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

      var graph = svg.append('g');

      // Set up edge coloring
      var edgeColor = d3.scale.ordinal()
          .domain(data.edgeCategories)
          .range(style.edgeColors);

      // Set up node coloring
      var nodeColor = d3.scale.linear()
          .domain([data.minNodeValue, data.maxNodeValue])
          .range(style.nodeColor)
          .interpolate(d3.interpolateLab);

      // Set up force directed graph
      var forceHeight = height,
          forceWidth = width;
      var force = d3.layout.force()
          .charge(-400)
          .linkDistance(40)
          .size([forceWidth,forceHeight]);

      var x = d3.scale.linear().range([0,forceWidth]),
          y = d3.scale.linear().range([0,forceHeight]);

      // Start the force directed layout
      force.nodes(data.nodes).links(data.links).start();

      // Draw the edges
      var link = graph.append('g').selectAll('.link')
          .data(data.links)
          .enter()
          .append('g');

      // Draw categories for each edge
      if(data.edgeCategories) {
        link.each(function(d) {
          var thisEdge = d3.select(this);
          d.categories.forEach(function(c) {
            thisEdge.append('line')
                .style('stroke-width', style.edgeWidth)
                .style('stroke', edgeColor(c));
          });
        });
      } else {
        link.append('line').style('stroke-width', style.edgeWidth).style('stroke', edgeColor(null));
      }


      // Draw the nodes
      var node = graph.append('g').selectAll('.node')
          .data(data.nodes)
          .enter()
          .append('g')
              .style('cursor', 'move')
              .call(force.drag);

      node.append('circle')
          .attr('r', style.nodeRadius)
          .attr('fill', function(d) { return nodeColor(d.value); })
          .style('stroke-width', style.nodeStrokeWidth)
          .style('stroke', style.nodeStrokeColor);

      node.append('text')
          .attr('x', style.nodeRadius+style.nodeLabelPadding)
          .attr('y', style.nodeRadius+style.nodeLabelPadding)
          .style('font-size', style.fontSize)
          .text(function(d) { return d.name; });

      force.on('tick', function() {
        node.attr('transform', function(d) {
          d.x = Math.max(style.nodeRadius, Math.min(forceWidth - style.nodeRadius, d.x));
          d.y = Math.max(style.nodeRadius, Math.min(forceHeight - style.nodeRadius, d.y));
          return 'translate('+ d.x + ',' + d.y + ')';
        });

        // position the edges
        link.selectAll('line').each(function(d,i) {
          var thisEdge = d3.select(this);
          thisEdge.attr('x1', d.source.x)
              .attr('x2', d.target.x)
              .attr('y1', d.source.y)
              .attr('y2', d.target.y);
        });
      });


      if(anchorNodesOnClick) {
        force.drag().on('dragstart', function(d) {
          d.fixed = true;
          d3.select(this).select('circle').style('stroke-opacity', 0);
        });
        node.on('dblclick', function(d) {
          d.fixed = d.fixed ? false : true;
          d3.select(this).select('circle').style('stroke-opacity', 1);
        });
      } // end anchorNodesOnClick block
    });
  }

  chart.clickAnchorsNodes = function(state) {
    anchorNodesOnClick = state;
    return chart;
  }

  return chart;
}