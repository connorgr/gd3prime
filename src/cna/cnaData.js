function cnaData(data) {
  function braph(cdata) {
    var gene = cdata.gene || "",
        geneinfo = cdata.neighbors || [],
        region = cdata.region || {}
        samplesToTypes = cdata.sampleToTypes || {},
        seg = cdata.segments;

    var chrm = region.chr,
        allmin = 0,
        allmax = 0,
        minSegXLoc = region.minSegX,
        maxSegXLoc = region.maxSegX;

    // Initialize data structures
    var geneJSON = geneinfo.map(function(d) {
      var selected = d.name == gene;
      return { fixed: selected ? true: false , start: d.start, end: d.end, label: d.name, selected: selected };
    });

    var sampleTypes = [],
        samplelst = [],
        segJSON   = [];

    // Flatten the segments data
    seg.forEach(function(d){
      samplelst.push( d.sample );

      var dSegments = d.segments;
      dSegments.forEach(function(s){
        // create simulated annotation data if it does not exist.
        // var vote = {
        //   type: 'vote',
        //   score: 100
        // }
        // var link = {
        //   type: 'link',
        //   href: 'http://www.cs.brown.edu',
        //   text: 'BrownCS'
        // }
        // var testAnnotation = [
        //   {
        //     type: 'text',
        //     title: 'Sample',
        //     text: d.sample
        //   },
        //   {
        //     type: 'table',
        //     header: ['Cancer', 'PMIDs', 'Votes'],
        //     data: [
        //       ['1', link, vote],
        //       ['4', link, vote]
        //     ]
        //   }
        // ];

        segJSON.push({
          // annotation: testAnnotation,
          gene: gene,
          start: s.start,
          end: s.end,
          label: s.sample,
          sample: d.sample,
          dataset: samplesToTypes[d.sample],
          ty: s.ty
        })

        if (sampleTypes.indexOf(samplesToTypes[d.sample])){
          sampleTypes.push( samplesToTypes[s.sample] );
        }
      });
    });


    // Sort the segments by cancer type and then by length
    segJSON.sort(function(a, b){
      if (a.dataset != b.dataset) return d3.ascending(a.dataset, b.dataset);
      else return d3.ascending(a.end-a.start, b.end-b.start);
    });

    var ampIndex = 0,
        delIndex = 0;
    segJSON.forEach(function(d){
      if (d.ty == "amp") d.index = ampIndex++;
      if (d.ty == "del") d.index = delIndex++;
    });

    var d = {
      numAmps: ampIndex,
      numDels: delIndex,
      genes: geneJSON,
      sampleTypes: sampleTypes,
      samplesToTypes: samplesToTypes,
      segments: segJSON,
      segmentDomain: [minSegXLoc, maxSegXLoc]
    };

    d.get = function(arg) {
      if (arg == 'genes') return d.genes;
      else if (arg == 'sampleTypes') return d.sampleTypes;
      else if (arg == 'samplesToTypes') return d.samplesToTypes;
      else if (arg == 'segments') return d.segments;
      else if (arg == 'amps') return d.amps;
      else if (arg == 'dels') return d.dels;
      else if (arg == 'segmentDomain') return d.segmentDomain;
      else return undefined;
    }

    return d;
  }
  var cnaData = braph(data);

  return cnaData;
}