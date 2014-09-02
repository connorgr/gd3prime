function annotationView(style) {
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
      var textStyle = {
        color: '#fff',
        display: 'inline-block',
        'font-family': style.fontFamily,
        'font-size': style.fontSize,
        margin: '0px',
        padding: '0px'

      }
      selection.append('p')
        .style(textStyle)
        .text(data.score);
    }


    selection.on('mouseover', function(d) {
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