function annotationView(style, votingFns) {
  // Global variables for the annotation
  var point = null,
      svg = null,
      target = null;

  var votingFns = votingFns || {};

  // var svg = document.getElementById('#gd3AnnotationSvgPtHelper');
  // if(svg === null) {
  //   svg = document.createElement('svg');
  //   svg.setAttribute('id', 'gd3AnnotationSvgPtHelper');
  //   d3.select(svg).append('SVGPoint');
  //   console.log(svg);
  // }
  // var point = svg.createSVGPoint();//svg.children[0];

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
                if(typeof(d) === 'string') {
                  appendText(d3.select(this), {text:d});
                } else if (d.type === 'vote') {
                  appendVote(d3.select(this), d);
                } else if (d.type === 'link') {
                  appendLink(d3.select(this), d);
                }
          });
    }

    // Append a voting counter
    function appendVote(selection, data) {
      var down = null,
          score = null,
          up = null;

      var defaultColor = 'rgb(255, 255, 255)',
          activeColor = 'rgb(255, 165, 0)';

      function abstractVote(clickedArrow, otherArrow) {
        var upvote = clickedArrow == up,
            adjust = upvote ? 1 : -1;

        var scoreDatum = score.datum();

        if (clickedArrow.style('color') == defaultColor) {
          // fix vote if the other vote direction active
          if (otherArrow.style('color') == activeColor) {
            score.text( parseInt(score.text()) + adjust );
          }
          clickedArrow.style('color', activeColor);
          otherArrow.style('color', defaultColor);
          score.text(parseInt(score.text()) + adjust);
          scoreDatum.voted = upvote ? 'upVote' : 'downVote';
        } else {
          clickedArrow.style('color', defaultColor);
          score.text(parseInt(score.text()) - adjust);
          scoreDatum.voted = 'none';
        }

        scoreDatum.score = parseInt(score.text());
        score.datum(scoreDatum);
      } // end abstractVote()


      function downVote(d) {
        abstractVote(down, up);

        if (votingFns.downVote != undefined) votingFns.downVote(d);
      }
      function upVote(d) {
        abstractVote(up, down);

        if (votingFns.upVote) votingFns.upVote(d);
      }


      var textStyle = {
        color: '#fff',
        display: 'inline-block',
        'font-family': style.fontFamily,
        'font-size': style.fontSize,
        margin: '0px',

        // prevent selection
        '-webkit-touch-callout': 'none',
        '-webkit-user-select': 'none',
        '-khtml-user-select': 'none',
        '-moz-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
      }
      down = selection.append('p')
        .style(textStyle)
        .style('padding', '0')
        .style('cursor', 'pointer')
        .text('▼')
        .on('click', downVote);
      score = selection.append('p')
        .style(textStyle)
        .style('padding', '0 1px 0 1px')
        .text(data.score);
      up = selection.append('p')
        .style(textStyle)
        .style('padding', '0')
        .style('cursor', 'pointer')
        .text('▲')
        .on('click', upVote);

      if (score.datum().voted != undefined) {
        if (score.datum().voted == 'upVote') up.style('color', activeColor);
        if (score.datum().voted == 'downVote') down.style('color', activeColor);
      }
    }


  // This function gets called whenever an element gets mouseovered
  function activate (d) {

    // Do nothing if no annotation data exists
    if (d.annotation == undefined) {
      return;
    }

    // Update annotation globals
    target = target || d3.event.target;
    svg = target.tagName.toLowerCase() == 'svg' ? target : target.ownerSVGElement;
    if (d3.select(svg).select('SVGPoint').empty() == true) {
      point = svg.createSVGPoint();
    } else {
      point = d3.select(svg).select('SVGPoint').node();
    }


    var aData = d.annotation,
        bbox = getScreenBBox();

    // Remove any lingering tooltips that might exist
    d3.selectAll('.gd3AnnotationViewDiv').remove();

    // Create the new tooltip
    var container = d3.select(document.createElement('div'));
    container.attr('class', 'gd3AnnotationViewDiv');
    container.style({
      background: 'rgba(0,0,0,.75)',
      'border-radius': '3px',
      padding: '5px',
      position: 'absolute'
    });

    for (var i in aData) {
      var aPart = aData[i],
          type = aPart.type;
      if (type == 'link') {
        appendLink(container, aPart);
      } else if (type == 'table') {
        appendTable(container, aPart);
      } else if (type == 'text') {
        appendText(container, aPart);
      }
    }

    document.body.appendChild(container.node());

    // Determine positioning of the annotation
    var node = container.node(),
        scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft,
        scrollTop = document.documentElement.scrollTop || document.body.scrollTop,
        nodeL =  bbox.s.x - node.offsetWidth / 2,
        nodeT = bbox.s.y;

    var offsetTop = nodeT + scrollTop,
        offsetLeft = nodeL + scrollLeft;

    container.style('left', offsetLeft.toString() + 'px')
        .style('top', offsetTop.toString() + 'px');

    // Add an "x-out" button for the annotation
    var xoutLeft = (node.offsetWidth - 10).toString() + 'px';
    container.append('span')
        .text('☓')
        .on('click', function() {
          d3.selectAll('.gd3AnnotationViewDiv').remove();
        })
        .style({
          color: '#000',
          cursor: 'pointer',
          display: 'inline',
          'font-size': '10px',
          'font-weight': 'bold',
          left: xoutLeft,
          'line-height': 1,
          position: 'absolute',
          'text-align': 'right',
          top: '-10px',
          width: '10px'


          //           display: inline;
          // font-size: 10px;
          // width: 100%;
          // line-height: 1;
          // color: rgba(0, 0, 0, 0.8);
          // position: absolute;
          // pointer-events: none;


          // content: "\25B2";
          // margin: 0 0 1px 0;
          // top: -8px;
          // left: 0;
          // text-align: center;
        });

    console.log(container.node().offsetWidth);

    // node.on('mouseout', function() {
    //   d3.select(this).on('mouseout', null); // patch for mouseout behavior
    //   document.body.removeChild(this);
    // });
  }

    selection.on('mouseover', activate);
  }

  return view;
}