import "transcriptData";

function transcriptChart(style) {
  var showScrollers = true;

  function chart(selection) {
    selection.each(function(data) {
      data = transcriptData(data);

      // Determine coloration
      var d3color = d3.scale.category20(),
          sampleTypeToColor = {};
      for (var i = 0; i < data.get('mutationCategories').length; i++) {
        sampleTypeToColor[data.get('mutationCategories')[i]] = d3color(i);
      }

      var height = style.height,
          width = style.width;

      // max number of mutations that can fit along the axis
      var mutationResolution = Math.floor(width / style.symbolWidth);

      var svg = d3.select(this)
          .selectAll('svg')
          .data([data])
          .enter()
            .append('svg')
                .attr('height', height)
                .attr('width', width);

      // x scale for the entire visualization based on transcript length
      var start = 0,
          stop = data.get('length');
      var x = d3.scale.linear()
              .domain([start, stop])
              .range([0, width]);

      var xAxis = d3.svg.axis()
              .scale(x)
              .orient('bottom')
              .ticks(style.numXTicks)
              .tickSize(0)
              .tickPadding(style.xTickPadding);

      // Group for all transcript visualization components other than sliders to live in
      var tG = svg.append('g');

      if (showScrollers) {
        // Make room for the sliders
        tG.attr('transform', 'translate(20,0)');

        // Add a group for sliders
        var sG = svg.append('g');

        // create drag slider gradient
        // Define the gradient
        var gradient = svg.append("svg:defs")
          .append("svg:linearGradient")
          .attr("id", "gradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%")
          .attr("spreadMethod", "pad");

        // Define the gradient colors
        gradient.append("svg:stop")
          .attr("offset", "0%")
          .attr("stop-color", "#eeeeee")
          .attr("stop-opacity", 1);

        gradient.append("svg:stop")
          .attr("offset", "100%")
          .attr("stop-color", "#333333")
          .attr("stop-opacity", 1);

        // Create drag event handlers for sliders
        var dragSlider = d3.behavior.drag()
                    .on('dragstart', dragStart)
                    .on('drag', dragMove)
                    .on('dragend', dragEnd);
        function dragStart(d) {
          d3.event.sourceEvent.stopPropagation();
          var thisEl = d3.select(this);
          thisEl.style('fill', '#333333');
        }
        function dragMove(d) {
          var thisEl = d3.select(this),
              higher = d.max < d.min ? d.max : d.min, // lesser/upper canvas y bound value
              lower = higher == d.max ? d.min : d.max;

          if(d3.event.y > lower) {
            thisEl.attr('cy', lower);
          } else if (d3.event.y < higher) {
            thisEl.attr('cy', higher);
          } else {
            thisEl.attr('cy', d3.event.y);
          }
        }
        function dragEnd(d) {
          var thisEl = d3.select(this);
        }

        // Add a background for the slider area
        sG.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 15)
            .attr('height', style.height)
            .style('fill', '#fff');

        // Add slider tracks
        sG.append('line')
            .attr('x1', 6)
            .attr('y1', 10)
            .attr('x2', 6)
            .attr('y2', style.height/2 - style.transcriptBarHeight/2 + 10)
            .style('stroke', '#ccc')
            .style('stroke-width', 1);
        sG.append('line')
            .attr('x1', 6)
            .attr('y1', style.height/2 + style.transcriptBarHeight/2 + 10)
            .attr('x2', 6)
            .attr('y2', style.height - 10)
            .style('stroke', '#ccc')
            .style('stroke-width', 1);

        // Set up drag circles
        var sliderBounds = [
          {min: style.height/2 - style.transcriptBarHeight/2 + 4,
            max: 6},
          {min: style.height/2 + style.transcriptBarHeight/2 + 4,
            max: style.height - 6}
        ];
        sG.selectAll('circle')
            .data(sliderBounds)
            .enter()
            .append('circle')
            .attr('r', 6)
            .attr('cx', 6)
            .attr('cy', function(d) { return d.min; })
            .style( {
              fill: 'url(#gradient)',
              stroke: '#666',
              'stroke-width': 1
            })
            .call(dragSlider);
      } // end slider behavior code

      // Append the axis to the canvas
      var transcriptAxis = tG.append('g')
              .attr('class', 'xaxis')
              .attr('transform', 'translate(0,' + ( style.height/2 +  style.transcriptBarHeight+6) +')')
              .style('font-family', style.fontFamily)
              .style('font-size', '12px')
              .style('fill', '#000')
              .call(xAxis);

      var transcriptBar = tG.append('rect')
              .attr('height', style.transcriptBarHeight)
              .attr('width', x(stop) - x(start))
              .attr('x', x(start))
              .attr('y', height/2)
              .style('fill', '#ccc');


      // Define zoom behavior
      var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 100])
        .on('zoom', function() { updateTranscript() });
      svg.call(zoom);

      // Add mutations to the transcript
      var mutationsG = tG.append('g').attr('class','transcriptMutations');
      var mutations = mutationsG.selectAll('.symbols')
          .data(data.get('mutations'))
          .enter()
          .append('path')
            .attr('class', 'symbols')
            .attr('d', d3.svg.symbol()
              .type(function(d, i) {
                return d3.svg.symbolTypes[data.get('mutationTypesToSymbols')[d.ty]];
              })
              .size(style.symbolWidth))
            .style('fill', function(d, i) { return sampleTypeToColor[d.dataset]; })
            .style('stroke', function(d, i) { return sampleTypeToColor[d.dataset]; })
            .style('stroke-width', 2);

      // Draw domain data with labels with mouse over
      var domainGroupsData = data.get('proteinDomains');
      var domainGroups = tG.selectAll('.domains')
          .data(domainGroupsData ? data.get('proteinDomains').slice() : [])
          .enter()
          .append('g')
            .attr('class', 'domains');

      var domains = domainGroups.append('rect')
          .attr('id', function(d, i) { return 'domain-' + i; })
          .attr('width', function(d, i) { return x(d.end) - x(d.start); })
          .attr('height', style.transcriptBarHeight + 10)
          .style('fill', '#aaa')
          .style('fill-opacity', .5);

      var domainLabels = domainGroups.append('text')
          .attr('id', function(d, i) { return 'domain-label-' + i; })
          .attr('text-anchor', 'middle')
          .attr('y', style.transcriptBarHeight)
          .style('fill', '#000')
          .style('fill-opacity', 0)
          .style('font-size', 12)
          .style('font-family', style.fontFamily)
          .text(function(d, i) { return d.name; });

      domainGroups.on('mouseover', function(d, i) {
        d3.select(this).selectAll('rect').style('fill', '#f00');
        domainGroups.select('#domain-label-' + i).style('fill-opacity', 1);
      })
      .on('mouseout', function(d, i) {
        d3.select(this).selectAll('rect').style('fill', '#aaa');
        domainGroups.select('#domain-label-' + i).style('fill-opacity', 0);
      });


      updateTranscript();

      function updateTranscript() {
        var t = zoom.translate(),
          tx = t[0],
          ty = t[1],
          scale = zoom.scale();

        tx = Math.min(tx, 0);

        zoom.translate([tx, ty]);

         // Current scope of zoom
        var curMin = d3.min(x.domain()),
            curMax = d3.max(x.domain()),
            curRes = Math.round( (curMax - curMin)/mutationResolution );

        curRes = curRes ? curRes : 1;

        // Stack mutations if there exist more than one per location
        var bottomIndex = {},
            topIndex = {},
            pX = {},
            pY = {};

        var endIter = Math.ceil(curMax/curRes) + 5;
            startIter = Math.floor(curMin/curRes) - 5;
        for (var i = startIter; i < endIter; i++) {
          bottomIndex[i] = 0;
          topIndex[i] = 0;
        }

        // render mutation glpyhs and move/color them
        mutations.attr('transform', function(d, i) {
                var indexDict = data.isMutationInactivating(d.ty) ? bottomIndex : topIndex,
                    curIndex = Math.round(d.locus/curRes),
                    px = x(curIndex*curRes),
                    py;

                // catch mutations that fall out of scope
                if (indexDict[curIndex] == undefined) indexDict[curIndex] = 0;


                if ( data.isMutationInactivating(d.ty) ) {
                  py = height/2 + (style.transcriptBarHeight + indexDict[curIndex] * (style.symbolWidth/2) + 21);
                } else {
                  py = height/2 - (indexDict[curIndex] * (style.symbolWidth/2) + 11);
                }

                indexDict[curIndex]++;

                // Store the x and y values
                pX[i] = px;
                pY[i] = py;

                return 'translate(' + px + ', ' + py + ')';
            })// end symbols.attr('transform')
            .style('fill', function(d) { return sampleTypeToColor[d.dataset]; })
            .style('fill-opacity', 1)
            .style('stroke', function(d) { return sampleTypeToColor[d.dataset]; })
            .style('stroke-opacity', 1)
            .call(gd3.annotation());

        // update the axis
        transcriptAxis.call(xAxis);

        // update the transcript
        transcriptBar.attr('x', x(start)).attr('width', x(stop) - x(start));

        // Update protein domains
        // Update the domains
        domainGroups.attr('transform', function(d, i) {
          return 'translate(' + x(d.start) + ',' + (height/2 - 5) + ')';
        });

        domains.attr('width', function(d, i) { return x(d.end) - x(d.start); });

        domainLabels.attr('x', function(d, i) {
          var w = d3.select(this.parentNode).select('rect').attr('width');
          return w/2;
        });
      } // end updateTranscript()
    });
  }

  function showScrollers(val) {
    showScrollers = val;
  }

  return chart;
}