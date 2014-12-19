function tooltipView(style) {
  var direction = d3_tip_direction,
      offset    = d3_tip_offset,
      html      = d3_tip_html,
      node      = null,
      sticky    = false,
      svg       = null,
      point     = null,
      target    = null;

  function view(selection) {
    svg = selection; // assumes selection is an SVG
    point = selection.node().createSVGPoint();

    // node = d3.select(document.createElement('div'));
    node = d3.select('body').append('div');
    node.style({
      background: style.background,
      border: style.border,
      'border-radius': style.borderRadius,
      color: style.fontColor,
      'font-family': style.fontFamily,
      'font-size': style.fontSize,
      'line-height': style.lineHeight,
      position: 'absolute',
      top: 0,
      opacity: 0,
      'pointer-events': 'none',
      'box-sizing': 'border-box',
      padding: style.padding
    });
    node = node.node();

    var tipObjects = selection.selectAll('.gd3-tipobj')
        .on('click', function() { sticky = sticky ? false : true; })
        .on('mouseover', view.render )
        .on('mouseout', view.hide );
  } // end view

  view.render = function() {
    if (sticky) return;
    var args = Array.prototype.slice.call(arguments);
    if(args[args.length - 1] instanceof SVGElement) target = args.pop();

    var content = html.apply(this, args),
        poffset = offset.apply(this, args),
        dir     = direction.apply(this, args),
        nodel   = d3.select(node),
        i       = directions.length,
        coords,
        scrollTop  = document.documentElement.scrollTop || document.body.scrollTop,
        scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

    nodel.html(content).style({ opacity: 1, 'pointer-events': 'all' });

    while(i--) nodel.classed(directions[i], false);
    coords = direction_callbacks.get(dir).apply(this);
    nodel.classed(dir, true).style({
      top: (coords.top +  poffset[0]) + scrollTop + 'px',
      left: (coords.left + poffset[1]) + scrollLeft + 'px'
    });

    return view;
  }

  view.hide = function() {
    if (sticky) return;
    var nodel = d3.select(node);
    nodel.style({ opacity: 0, 'pointer-events': 'none' });
    return view;
  }

  view.attr = function(n, v) {
    if (arguments.length < 2 && typeof n === 'string') {
      return d3.select(node).attr(n)
    } else {
      var args =  Array.prototype.slice.call(arguments)
      d3.selection.prototype.attr.apply(d3.select(node), args)
    }

    return view;
  }

  view.style = function(n, v) {
    if (arguments.length < 2 && typeof n === 'string') {
      return d3.select(node).style(n)
    } else {
      var args =  Array.prototype.slice.call(arguments)
      d3.selection.prototype.style.apply(d3.select(node), args)
    }

    return view;
  }

  view.direction = function(v) {
    if (!arguments.length) return direction
    direction = v == null ? v : d3.functor(v)

    return view;
  }

  view.offset = function(v) {
    if (!arguments.length) return offset
    offset = v == null ? v : d3.functor(v)

    return view;
  }

  view.html = function(v) {
    if (!arguments.length) return html
    html = v == null ? v : d3.functor(v)

    return view;
  }

  view.useData = function(data) {
    var nodel = d3.select(node);
    console.log(nodel);
    nodel.selectAll('*').remove();
    data.forEach(function(d) { d.render(nodel); });
    html = nodel.html();

    return view;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Private functions

  // Create functions for determining which direction the tip should render
  function d3_tip_direction() { return 'n' }
  function d3_tip_offset() { return [0, 0] }
  function d3_tip_html() { return ' ' }

  var direction_callbacks = d3.map({
    n:  direction_n,
    s:  direction_s,
    e:  direction_e,
    w:  direction_w,
    nw: direction_nw,
    ne: direction_ne,
    sw: direction_sw,
    se: direction_se
  }),

  directions = direction_callbacks.keys();

  function direction_n() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.n.y - node.offsetHeight,
      left: bbox.n.x - node.offsetWidth / 2
    }
  }

  function direction_s() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.s.y,
      left: bbox.s.x - node.offsetWidth / 2
    }
  }

  function direction_e() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.e.y - node.offsetHeight / 2,
      left: bbox.e.x
    }
  }

  function direction_w() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.w.y - node.offsetHeight / 2,
      left: bbox.w.x - node.offsetWidth
    }
  }

  function direction_nw() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.nw.y - node.offsetHeight,
      left: bbox.nw.x - node.offsetWidth
    }
  }

  function direction_ne() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.ne.y - node.offsetHeight,
      left: bbox.ne.x
    }
  }

  function direction_sw() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.sw.y,
      left: bbox.sw.x - node.offsetWidth
    }
  }

  function direction_se() {
    var bbox = getScreenBBox();
    return {
      top:  bbox.se.y,
      left: bbox.e.x
    }
  }

  // Private - gets the screen coordinates of a shape
  //
  // Given a shape on the screen, will return an SVGPoint for the directions
  // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
  // sw(southwest).
  //
  //    +-+-+
  //    |   |
  //    +   +
  //    |   |
  //    +-+-+
  //
  // Returns an Object {n, s, e, w, nw, sw, ne, se}
  function getScreenBBox() {
    var targetel   = target || d3.event.target;

    while ('undefined' === typeof targetel.getScreenCTM && 'undefined' === targetel.parentNode) {
        targetel = targetel.parentNode;
    }

    var bbox       = {},
        matrix     = targetel.getScreenCTM(),
        tbbox      = targetel.getBBox(),
        width      = tbbox.width,
        height     = tbbox.height,
        x          = tbbox.x,
        y          = tbbox.y

    point.x = x
    point.y = y
    bbox.nw = point.matrixTransform(matrix)
    point.x += width
    bbox.ne = point.matrixTransform(matrix)
    point.y += height
    bbox.se = point.matrixTransform(matrix)
    point.x -= width
    bbox.sw = point.matrixTransform(matrix)
    point.y -= height / 2
    bbox.w  = point.matrixTransform(matrix)
    point.x += width
    bbox.e = point.matrixTransform(matrix)
    point.x -= width / 2
    point.y -= height / 2
    bbox.n = point.matrixTransform(matrix)
    point.y += height
    bbox.s = point.matrixTransform(matrix)

    return bbox
  }

  // end private functions
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return view;
}