gd3.color = {};

gd3.color.categoryPalette;

gd3.color.palettes = {};

// colorbrewer paired qualitative paired scale with modified 2 and 1 element versions
gd3.color.palettes.categorical_cbSafe = {
  1: ["#1f78b4"],
  2: ["#1f78b4","#b2df8a"],
  3: ["#a6cee3","#1f78b4","#b2df8a"],
  4: ["#a6cee3","#1f78b4","#b2df8a","#33a02c"]
};

// colorbrewer paired qualitative paired scale, but above range of colorblind friendly
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


gd3.color.categories = function() {
  function isArrayTest() {
    for(var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if( Object.prototype.toString.call(a) !== '[object Array]' ) {
        throw 'categories() must be passed: (1) an array of categories, (2) an array of categories and an array of colors';
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
}