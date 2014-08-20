import "cnaData";

function cnaChart(style) {
  function chart(selection) {
    selection.each(function(data) {
      data = cnaData(data);

      // Determine the height
      //var height = (intervalH * data.segments.length) + initIntervalH + rangeLegendOffset - 10;
      var height = style.height,
          width = style.width;

      // Determine coloration
      var d3color = d3.scale.category20(),
          segmentTypeToColor = {};
      for (var i = 0; i < data.get('sampleTypes').length; i++) {
        segmentTypeToColor[data.get('sampleTypes')[i]] = d3color(i);
      }

      // Initialize the CNA browser to include all sample types
      var sampleTypesToInclude = {},
          samplesToTypes = data.get('samplesToTypes');
      data.sampleTypes.sort().forEach(function(d){ sampleTypesToInclude[d] = true; });

      // Select the svg element, if it exists.
      var svgActual = d3.select(this)
          .selectAll('svg')
          .data([data])
            .enter()
            .append('svg')
              .attr('height', height)
              .attr('width', width);
      var svg = svgActual.append('g');

      // Set up scales
      var start = d3.min(data.segmentDomain),
          stop = d3.max(data.segmentDomain);

      var x = d3.scale.linear()
          .domain([start, stop])
          .range([0, width]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient('bottom')
          .ticks(5)
          .tickSize(0)
          .tickPadding(1.25);

      var normalize = d3.scale.linear()
        .domain([start, stop])
        .range([0, width]);

      // Set up the zoom
      var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 100])
        .on('zoom', function(){ updateAllComponents(); });
      svg.call(zoom).on('dblclick.zoom', null)


      //////////////////////////////////////////////////////////////////////////
      // BEGIN RENDERING CODE

      //////////////////////////////////////////////////////////////////////////
      // Draw the genome

      // Add a vertical bar that spans the target gene
      var verticalBar = svg.selectAll('.vert-bar')
          .data(data.get('genes').filter(function(d){ return d.selected; })).enter()
          .append("rect")
          .attr("y", 0)
          .attr("width", function(d){ return normalize(d.end) - normalize(d.start); })
          .style("fill", style.geneSelectedColor)
          .style("fill-opacity", 0.5);

      var genomeG = svg.append('g'),
          genomeBar = svg.append("rect")
              .attr("class", "genome")
              .attr("y", style.genomeAreaHeight/2 - style.genomeBarHeight)
              .attr("x", 0)
              .attr("width", width)
              .attr("height", style.genomeBarHeight)
              .style("fill", '#ccc');

      var geneGroups = svg.selectAll(".genes")
              .data(data.get('genes')).enter()
              .append("g")
              .attr("class", "genes"),
          genes = geneGroups.append('rect')
              .attr('width', function(d){ return normalize(d.end) - normalize(d.start); })
              .attr('height', style.geneHeight)
              .style('fill-opacity', function(d) {return d.selected ? 1 : 0.2;})
              .style('fill', function (d) {return d.selected ? style.geneSelectedColor : style.geneColor;})
              .attr('id', function (d, i) { return "gene-" + i; }),
          geneLabels = geneGroups.append('text')
              .attr('y', style.genomeAreaHeight/2 - 2)
              .attr('text-anchor', 'middle')
              .style('fill-opacity', function (d) {return d.selected ? 1 : 0})
              .style('fill', '#000')
              .style('font-family', style.fontFamily)
              .style('font-size', style.fontSize)
              .text(function(d){  return d.label; });


        geneGroups.on('mouseover', function(d){
          if (!d.fixed){
            d3.select(this).select('rect').style('fill', style.geneHighlightColor);
            d3.select(this).select("text").style("fill-opacity", 1)
          }
        });
        geneGroups.on('mouseout', function(d, i){
          if (!d.fixed){
            // Reset the gene block color
            d3.select(this).select("rect").style("fill", function (d) {
              return d.selected ? style.geneSelectedColor : style.geneColor;
            });

            d3.select(this).select("text").style("fill-opacity", 0);
          }
        });
        geneGroups.on('dblclick', function(d, i){
          d.fixed = d.fixed ? false : true;
          if (d.fixed){
            d3.select(this).select("rect").style("fill", function (d) {
              return d.selected ? style.geneSelectedColor : style.geneHighlightColor;
            });

            d3.select(this).select("text").style("fill-opacity", 1)
          }
        });


      //////////////////////////////////////////////////////////////////////////
      // Draw the segments
      var segmentsG = svg.append('g').attr('class', 'cnaSegmentsGroup')
              .attr('transform', 'translate(0,'+style.genomeAreaHeight+')'),
          segments = segmentsG.selectAll('.segments')
              .data(data.get('segments'))
              .enter().append('g')
              .attr("class", "intervals");

      var minSegmentX = d3.min(data.get('segmentDomain')),
          maxSegmentX = d3.max(data.get('segmentDomain'));

      segs = segments.append('rect')
          .attr('fill', function(d){ return segmentTypeToColor[samplesToTypes[d.sample]] })
          .attr('width', function(d) {
            return normalize(d.end, minSegmentX, maxSegmentX) - normalize(d.start, minSegmentX, maxSegmentX);
          })
          .attr('height', style.horizontalBarHeight)
          .attr('id', function (d, i) { return "interval-" + i; });

      updateGeneBar();
      updateSegments();

      function updateAllComponents() {
        var t = zoom.translate(),
          tx = t[0],
          ty = t[1],
          scale = zoom.scale();

        tx = Math.min(tx, 0);

        zoom.translate([tx, ty]);

        // Find the start/stop points after the zoom
        var curMin = d3.min( x.domain() ),
          curMax = d3.max( x.domain() );

        normalize.domain([curMin, curMax]);
        console.log('zozoooom');

        updateGeneBar();
        updateSegments();
      }

      // Updates the genome bar showing domains and also the target gene line
      function updateGeneBar() {
        // Move the vertical bar around the target genes
        verticalBar.attr("x", function(d){ return normalize(d.start); })
           .attr("width", function(d){ return normalize(d.end) - normalize(d.start); });

        // Move the genes into place
        genes.attr('transform', function(d, i){
          return 'translate(' + normalize(d.start) + ',0)';
        });

        // Scale the gene's blocks' width
        genes.attr('width', function(d, i){ return normalize(d.end) - normalize(d.start); });

        // Move the geneLabels
        geneLabels.attr('transform', function(d, i){
          var x1 = d3.max( [d.start, d3.max(normalize.domain())] ),
              x2 = d3.min( [d.end, d3.min(normalize.domain())] );
          return 'translate(' + normalize(d.start + (d.end-d.start)/2) + ',0)';
        });
      }

      // Updates the position of horizontal bars in the visualization
      function updateSegments() {
        // Move the intervals into place
        segs.attr("transform", function(d, i){
          return "translate(" + normalize(d.start) + "," + style.horizontalBarSpacing*i + ")"
        })
        .attr("width", function(d, i){ return normalize(d.end) - normalize(d.start); })

        // Fade in/out intervals that are from datasets not currently active
        var activeIntervals = segments.filter(function(d){ return sampleTypesToInclude[samplesToTypes[d.sample]]; })
          .style("opacity", 1);
        segments.filter(function(d){ return !sampleTypesToInclude[samplesToTypes[d.sample]]; })
          .style("opacity", 0);

      }

    svgActual.attr('height', function() {
      height = svg.node().getBBox().height + style.horizontalBarHeight;
      verticalBar.attr('height', height);
      return height;
    });

    });//end selection.each()
  }
  return chart;
}