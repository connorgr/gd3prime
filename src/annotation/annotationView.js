function annotationView(style, votingFns) {
  var svg = document.createElement('svg'),
      point = svg.createSVGPoint();
  // Private - gets the screen coordinates of a shape
  // Thanks to Caged @ Github via https://github.com/Caged/d3-tip/blob/master/index.js
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
    var targetel   = d3.event.target,//target || d3.event.target,
        bbox       = {},
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


  function view(selection) {

    // Append text to the annotation view
    function appendText(selection, data) {
      var title = data.title ? data.title+': ' : '',
          text = data.text ? data.text : '';
      selection.append('p')
        .style('color', '#fff')
        .style('font-family', style.fontFamily)
        .style('font-size', style.fontSize)
        .style('margin', '0px')
        .style('padding', '0px')
        .text(title+text);
    }

    // Append link to the annotation view
    function appendLink(selection, data) {
      selection.append('a')
        .attr('href', data.href)
        .style('color', '#fff')
        .style('font-family', style.fontFamily)
        .style('font-size', style.fontSize)
        .style('margin', '0px')
        .style('padding', '0px')
        .text(data.text);
    }

    // Append a table to the annotation view
    function appendTable(selection, data) {
      var table = selection.append('table'),
          header = table.append('thead').append('tr'),
          body = table.append('tbody');

      table.style({
        'border-collapse': 'collapse',
        'border-bottom': '2px solid #ccc',
        'border-top': '2px solid #ccc',
        'margin-top': '3px'
      });
      header.style('border-bottom', '1px solid #ccc');
      header.selectAll('td')
          .data(data.header)
          .enter()
          .append('td')
              .style('color', '#fff')
              .style('font-family', style.fontFamily)
              .style('font-size', style.fontSize)
              .style('margin', '0px')
              .style('padding', '0 5px 2px 0')
              .text(function(d) { return d; });

      var rows = body.selectAll('tr')
          .data(data.data)
          .enter()
          .append('tr');

      var cells = rows.selectAll('td')
          .data(function(d) { return d; })
          .enter()
          .append('td')
              .style('max-width', '115px')
              .style('padding', '0 3px 0 3px')
              .each(function(d) {
                console.log(d);
                if(typeof(d) === 'string') {
                  appendText(d3.select(this), {text:d});
                } else if (d.type === 'vote') {
                  appendVote(d3.select(this), d);
                }
          });
    }

    // Append a voting counter
    function appendVote(selection, data) {
      function downVote(d) {
        console.log('down');
        if (votingFns.upVote) votingFns.upVote(d);
      }
      function upVote(d) {
        console.log('up');
        if (votingFns.downVote) votingFns.downVote(d);
      }
      var textStyle = {
        color: '#fff',
        display: 'inline-block',
        'font-family': style.fontFamily,
        'font-size': style.fontSize,
        margin: '0px'
      }
      selection.append('p')
        .style(textStyle)
        .style('padding', '0')
        .text('-1')
        .on('click', downVote);
      selection.append('p')
        .style(textStyle)
        .style('background', '#aaa')
        .style('padding', '0 1px 0 1px')
        .text(data.score);
      selection.append('p')
        .style(textStyle)
        .style('padding', '0')
        .text('+1')
        .on('click', upVote);
    }


    selection.on('mouseover', function(d) {
      console.log(getScreenBBox());
      // Do nothing if no annotation data exists
      if (d.annotation == undefined) {
        return;
      }
      var aData = d.annotation;

      // Remove any lingering tooltips that might exist
      d3.selectAll('.gd3AnnotationViewDiv').remove();

      // Create the new tooltip
      var node = d3.select(document.createElement('div'));
      node.attr('class', 'gd3AnnotationViewDiv');
      node.style({
        background: 'rgba(0,0,0,.75)',
        left: this.getBoundingClientRect().left.toString() + 'px', // http://stackoverflow.com/questions/18554224
        padding: '5px',
        position: 'absolute',
        top: this.getBoundingClientRect().top.toString() + 'px'
      });

      for (var i in aData) {
        var aPart = aData[i],
            type = aPart.type;
        if (type == 'link') {
          appendLink(node, aPart);
        } else if (type == 'table') {
          appendTable(node, aPart);
        } else if (type == 'text') {
          appendText(node, aPart);
        }
      }

      document.body.appendChild(node.node());

      // node.on('mouseout', function() {
      //   d3.select(this).on('mouseout', null); // patch for mouseout behavior
      //   document.body.removeChild(this);
      // });
    });
  }

  return view;
}