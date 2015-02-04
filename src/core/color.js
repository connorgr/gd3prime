gd3.color = {};

gd3.color.categoryPalette;
gd3.color.annotationPalettes = {};

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
  if(Object.prototype.toString.call(arguments[1]) !== '[object Array]' )) {
    throw 'annotations() must be passed: (1) the annotation name, (2) an array of annotation values'
        + ' OR the range of values, (3) [optionally] a string declaring if the data is "discrete"'
        + ' or "continuous"';
  }
  if(arguments.length > 2 && Object.prototype.toString.call(arguments[2] !== '[object String]')) {
    throw 'annotations() third argument must be a string';
  }
  if(arguments.length > 2 && (arguments[2] != 'discrete' || arguments[2] != 'continuous')) {
    throw 'annotations() third argument must either be "discrete" or "continuous"';
  }


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