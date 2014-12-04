function graphData(inputData) {
  var data = {
    edges : [],
    nodes : []
  }


  function defaultParse () {
    data.edges = inputData.edges;
    data.nodes = inputData.nodes;
    data.links = loadLinks(data.edges,data.nodes);

    data.maxNodeValue = d3.max(data.nodes.map(function(d) { return d.value; }));
    data.minNodeValue = d3.min(data.nodes.map(function(d) { return d.value; }));

    data.edgeCategories = [];

    // add edge categories only if they exist
    var categories = {};
    if(data.edges[0].categories) {
      data.edges.forEach(function(e) {
        e.categories.forEach(function(c) {
          categories[c] = null;
        });
      });
      data.edgeCategories = Object.keys(categories);
    }

    // creates a force-directed layout friendly link list
    function loadLinks(edges, nodes) {
      var links = [];

      for (var i = 0; i < nodes.length; i++) {
        var u = nodes[i].name;
        for(var j = 0; j < nodes.length; j++) {
          var v = nodes[j].name;
          for (var k = 0; k < edges.length; k++) {
            var src = edges[k].source,
                tgt = edges[k].target;
            if ( (u == src && v == tgt) || (u == tgt && v == src) ) {
              links.push({
                source: nodes[i],
                target: nodes[j],
                weight: edges[k].weight,
                categories: edges[k].categories,
                references: edges[k].references
              })
            }
          }
        }
      }

      return links;
    } // end loadLinks()
  }

  defaultParse();

  console.log(data);

  return data;
}