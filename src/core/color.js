gd3.color = {};

gd3.color.categoryPalette;
gd3.color.annotationPalettes = {};
gd3.color.annotationToType = {};

gd3.color.palettes = {};

// colorbrewer paired qualitative paired scale with modified 2 and 1 element versions
// Color blind safe!
gd3.color.palettes.categorical_cbSafe = {
  1: ["#1f78b4"],
  2: ["#1f78b4","#b2df8a"],
  3: ["#a6cee3","#1f78b4","#b2df8a"],
  4: ["#a6cee3","#1f78b4","#b2df8a","#33a02c"]
};

// colorbrewer paired qualitative paired scale, but above range of colorblind friendly
// Even though the two use the same scale, they are separated for clarity
gd3.color.palettes.categorical = {
  5: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99"],
  6: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c"],
  7: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f"],
  8: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00"],
  9: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6"],
  10: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a"],
  11: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99"],
  12: ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"]
};

gd3.color.palettes.annotation_discrete = [
  d3.scale.category20b().range(),
  d3.scale.category20c().range()
];

// These default to the colorbrewer sequential, single-hue palettes
// The blue scale has been discluded because of its use for the heatmap chart
// Additionally, the ordering of scales is made to be as colorblind-friendly as possible
gd3.color.palettes.annotation_continuous = [
  ['rgb(247,252,245)','rgb(229,245,224)','rgb(199,233,192)','rgb(161,217,155)','rgb(116,196,118)','rgb(65,171,93)','rgb(35,139,69)','rgb(0,109,44)','rgb(0,68,27)'],
  ['rgb(252,251,253)','rgb(239,237,245)','rgb(218,218,235)','rgb(188,189,220)','rgb(158,154,200)','rgb(128,125,186)','rgb(106,81,163)','rgb(84,39,143)','rgb(63,0,125)'],
  ['rgb(240,240,240)','rgb(217,217,217)','rgb(189,189,189)','rgb(150,150,150)','rgb(115,115,115)','rgb(82,82,82)','rgb(37,37,37)','rgb(0,0,0)'],
  ['rgb(255,245,235)','rgb(254,230,206)','rgb(253,208,162)','rgb(253,174,107)','rgb(253,141,60)','rgb(241,105,19)','rgb(217,72,1)','rgb(166,54,3)','rgb(127,39,4)'],
  ['rgb(255,245,240)','rgb(254,224,210)','rgb(252,187,161)','rgb(252,146,114)','rgb(251,106,74)','rgb(239,59,44)','rgb(203,24,29)','rgb(165,15,21)','rgb(103,0,13)']
];

// The behavior for annotations is as follows:
// annotations() : return the annotation palette object
// annotations(key) : return the annotation palette object key's value
// annotation(key, data) : set the annotation key's palette to have a domain of data
//   --> The scale will default to discrete, unless data.length == 2 && typeof(each datum) == Number
// annotation(key, data, type) : as before, except hardcode scale as "discrete" or "continuous"
// annotation(key, data, type, colors) : as before, except hardcode in palette colors
gd3.color.annotations = function() {
  if(arguments.length == 0) return gd3.color.annotationPalettes;
  if(arguments.length == 1) return gd3.color.annotationPalettes[arguments[0]];
  // Else, expect two arguments where the first is the name and the second is the type
  if(Object.prototype.toString.call(arguments[1]) !== '[object Array]' ) {
    throw 'annotations() must be passed: (1) the annotation name, (2) an array of annotation values'
        + ' OR the range of values, (3) [optionally] a string declaring if the data is "discrete"'
        + ' or "continuous"';
  }
  if(arguments.length > 2 && arguments[2] != "discrete" && arguments[2] != "continuous") {
    throw 'annotations() third argument must either be "discrete" or "continuous"';
  }

  var scale;

  var annotation = arguments[0],
      data = arguments[1];

  // Assign scale type
  var type;
  if(arguments.length > 2) type = arguments[2];
  else if(data.length == 2 && typeof(data[0]) === 'number' && typeof(data[1]) === 'number') type = 'continuous';
  else type = 'discrete';

  gd3.color.annotationToType[annotation] = type;

  // Define the type of scale and the domain
  if(type == 'continuous') {
    scale = d3.scale.linear().domain([d3.min(data),d3.max(data)]);
  } else {
    scale = d3.scale.ordinal().domain(data);
  }


  // Define the color scale range of the annotation
  var colors;
  if(arguments.length > 3) {
    if(Object.prototype.toString.call(arguments[3]) !== '[object Array]' ) {
      throw 'annotations()\'s third argument must be an array of colors you wish to use in your annotation scale';
    }
    colors = arguments[3];
  } else {
    var numOfType = Object.keys(gd3.color.annotationPalettes).filter(function(d) {
          return gd3.color.annotationToType[d] == type;
        }).length,
        palettes = gd3.color.palettes,
        paletteIndex = (type == 'discrete' ? palettes.annotation_discrete : palettes.annotation_continuous) % numOfType,
        palette = (type == 'discrete' ? palettes.annotation_discrete : palettes.annotation_continuous)[paletteIndex];

    colors = palette;
  }
  scale.range(colors);

  // Define the annotation scale in the annotationPalettes object
  gd3.color.annotationPalettes[annotation] = scale;

  return scale;
}

// Create a palette for category data (e.g., cancer type) given the categories
//  or given categories and colors
// If no arguments are given, the function returns the current palette
gd3.color.categories = function() {
  function isArrayTest() {
    for(var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if( Object.prototype.toString.call(a) !== '[object Array]' ) {
        throw 'categories() must be passed: (1) an array of categories, (2) an array of categories'
            + ' and an array of colors';
      }
      if(a.length == 0) throw 'categories() must be passed non-empty arrays for arguments';
    }
  }

  if(arguments.length == 0) return gd3.color.categoryPalette;
  else if(arguments.length == 1) {
    var categories = arguments[0];
    isArrayTest(categories);

    var colors;
    if(categories.length < 5) {
      colors = gd3.color.palettes.categorical_cbSafe[categories.length];
    } else if (categories.length < 13) {
      colors = gd3.color.palettes.categorical[categories.length];
    } else {
      colors = d3.scale.category20().range();
    }

    gd3.color.categoryPalette = d3.scale.ordinal().domain(categories).range(colors);
  } else if(arguments.length > 1) {
    var categories = arguments[0],
        colors = arguments[1];

    isArrayTest(categories, colors);
    gd3.color.categoryPalette = d3.scale.ordinal().domain(categories).range(colors);
  }

  return gd3.color.categoryPalette;
}