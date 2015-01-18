function scatterplotData(inputData) {
  var data = {
    categories: [],
    pts: [],
    title: '',
    xScale: { max: Number.NEGATIVE_INFINITY, min: Number.POSITIVE_INFINITY },
    yScale: { max: Number.NEGATIVE_INFINITY, min: Number.POSITIVE_INFINITY }
  }

  // categories = Array of Strings
  // pts = Array of Objects s.t. each Object is {x: Number, y: Number},
  //          optionally {x: Number, y: Number, category: String}
  // title = String
  function parseJSON() {
    data.categories = data.categories;
    data.pts = inputData.pts.map(function(d) {
      d.x = +(d.x); // safety sanitation
      d.y = +(d.y);

      // include range tests to save a loop
      if (!inputData.xScale) {
        xScale.max = d3.max([d.x, xScale.max]);
        xScale.min = d3.min([d.x, xScale.min]);
      }
      if (!inputData.yScale) {
        yScale.max = d3.max([d.y, yScale.max]);
        yScale.min = d3.min([d.y, yScale.min]);
      }

      return d;
    });

    data.title = inputData.title;

    if (inputData.xScale) data.xScale = inputData.xScale;
    if (inputData.yScale) data.yScale = inputData.yScale;
  }

  parseJSON();

  return data;
}