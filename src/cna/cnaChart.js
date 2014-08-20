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
      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
            .enter()
            .append('svg');

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


      //////////////////////////////////////////////////////////////////////////
      // BEGIN RENDERING CODE

      //////////////////////////////////////////////////////////////////////////
      // Draw the genome
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
              .attr("width", function(d){ return normalize(d.end) - normalize(d.start); })
              .attr('height', style.geneHeight)
              .style("fill-opacity", function(d) {return d.selected ? 1 : 0.2;})
              .style('fill', function (d) {return d.selected ? '#f00' : '#aaa';})
              .attr('id', function (d, i) { return "gene-" + i; });

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

      // Add a vertical bar that spans the target gene
      verticalBars = svg.selectAll('.vert-bar')
          .data(data.get('genes').filter(function(d){ return d.selected; })).enter()
          .append("rect")
          .attr("y", 0)
          .attr("width", function(d){ return normalize(d.end) - normalize(d.start); })
          .attr("height", height)
          .style("fill", '#f00')
          .style("fill-opacity", 0.5);

      updateGeneBar();
      updateSegments();

      // Updates the genome bar showing domains and also the target gene line
      function updateGeneBar() {
        // Move the vertical bar around the target genes
        verticalBars.attr("x", function(d){ return normalize(d.start); })
           .attr("width", function(d){ return normalize(d.end) - normalize(d.start); });

        // Move the genes into place
        genes.attr('transform', function(d, i){
          return 'translate(' + normalize(d.start) + ',0)';
        });

        // Scale the gene's blocks' width
        genes.attr('width', function(d, i){ return normalize(d.end) - normalize(d.start); });
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


    });//end selection.each()
  }
  return chart;
}