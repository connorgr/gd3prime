import "transcriptData";

function transcriptChart(style) {
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
            .append('svg');

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

      // Append the axis to the canvas
      var transcriptAxis = svg.append('g')
              .attr('class', 'xaxis')
              .attr('transform', 'translate(5,' + ( style.height/2 +  style.transcriptBarHeight+2) +')')
              .style('font-size', '12px')
              .style('fill', '#000')
              .call(xAxis);

      var transcriptBar = svg.append('rect')
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
      var mutationsG = svg.append('g').attr('class','transcriptMutations');
      var mutations = mutationsG.selectAll('.symbols')
          .data(data.get('mutations'))
          .enter()
          .append('path')
            .attr('class', 'symbols')
            .attr('d', d3.svg.symbol()
              .type(function(d, i) {
                return d3.svg.symbolTypes[data.get('mutationTypesToSymbols')[d.ty]];
              })
              .size(5))
            .style('fill', function(d, i) { return sampleTypeToColor[d.dataset]; })
            .style('stroke', function(d, i) { return sampleTypeToColor[d.dataset]; })
            .style('stroke-width', 2);


      console.log(data.get('proteinDomains'));
      //console.log(data.get('proteinDomains').slice());
      var test = data.get('proteinDomains');
      console.log(test.slice());
      console.log('---')
      // Draw domain data with labels with mouse over
      var domainGroups = svg.selectAll('.domains')
          .data(data.get('proteinDomains').slice())
          .enter()
          .append('g')
            .attr('class', 'domains');

      var domains = domainGroups.append('rect')
          .attr('id', function(d, i) { return 'domain-' + i; })
          .attr('width', function(d, i) { return x(d.end) - x(d.start); })
          .attr('height', style.transcriptBarHeight + 5)
          .style('fill', '#aaa')
          .style('fill-opacity', .5);

      var domainLabels = domainGroups.append('text')
          .attr('id', function(d, i) { return 'domain-label-' + i; })
          .attr('text-anchor', 'middle')
          .attr('y', style.transcriptBarHeight)
          .style('fill', '#000')
          .style('fill-opacity', 0)
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
                var curRes = 1;
                var indexDict = data.isMutationInactivating(d.ty) ? bottomIndex : topIndex,
                    curIndex = Math.round(d.locus/curRes),
                    px = x(curIndex*curRes),
                    py;

                // catch mutations that fall out of scope
                if (indexDict[curIndex] == undefined) indexDict[curIndex] = 0;


                if ( data.isMutationInactivating(d.ty) ) {
                  py = height/2 + (style.transcriptBarHeight + indexDict[curIndex] * style.symbolWidth + 3 + 10);
                } else {
                  py = height/2 - (indexDict[curIndex] * style.symbolWidth + 3 + 5);
                }

                indexDict[curIndex]++;

                // Store the x and y values
                pX[i] = px;
                pY[i] = py;

                //console.log(indexDict);

                return 'translate(' + px + ', ' + py + ')';
            })// end symbols.attr('transform')
            .style('fill', function(d) { return sampleTypeToColor[d.dataset]; })
            .style('fill-opacity', 1)
            .style('stroke', function(d) { return sampleTypeToColor[d.dataset]; })
            .style('stroke-opacity', 1);

        // update the axis
        transcriptAxis.call(xAxis);

        // update the transcript
        transcriptBar.attr('x', x(start)).attr('width', x(stop) - x(start));

        // Update protein domains
        // Update the domains
        domainGroups.attr('transform', function(d, i) {
          return 'translate(' + x(d.start) + ',' + (height/2) + ')';
        });

        domains.attr('width', function(d, i) { return x(d.end) - x(d.start); });

        domainLabels.attr('x', function(d, i) {
          var w = d3.select(this.parentNode).select('rect').attr('width');
          return w/2;
        });
      } // end updateTranscript()
    });
  }

  return chart;
}