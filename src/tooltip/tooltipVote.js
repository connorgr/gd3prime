import "tooltipElement";

gd3.tooltip.vote = gd3_tooltipVote;
var gd3_tooltipVotePrototype = gd3_tooltipVote.prototype = new gd3_tooltipElement;

function gd3_tooltipVote(downvoteFn, upvoteFn, voteCount, activeColor) {
  if (!this instanceof gd3_tooltipVote) return new gd3_tooltipVote(downvoteFn, upvoteFn, voteCount);

  this.downvoteFn = downvoteFn;
  this.upvoteFn = upvoteFn;
  this.voteCount = voteCount;

  return this;
}

gd3_tooltipVotePrototype.toString = function() {
  return this.voteCount + ' votes';
};

gd3_tooltipVotePrototype.render = function(selection) {
  var votingArea = selection.append('span').attr('class', 'gd3-tooltip-vote'),
      downVote = votingArea.append('span').text('▼').attr('class', 'gd3-tooltip-dvote'),
      voteCount = votingArea.append('span').text(this.voteCount).attr('class', 'gd3-tooltip-votecount'),
      upVote = votingArea.append('span').text('▲').attr('class', 'gd3-tooltip-uvote');

  votingArea.style('display', 'block');
  votingArea.selectAll('span').style({
    display: 'inline-block'
  });

  var downVoteFn = this.downVoteFn,
      thisVote = this;

  downVote.on('click', function(d) {
    // vote elements need to be redefined because of the way element rendering currently works
    var downVote = d3.select(this),
        upVote = d3.select(this.parentNode).select('.gd3-tooltip-uvote'),
        voteCount = d3.select(this.parentNode).select('.gd3-tooltip-votecount');


    var voteMod = 1;

    upVote.style('color', null);

    // Do nothing if the vote is already active
    if (downVote.classed('gd3-vote-active') == true) {
      downVote.classed('gd3-vote-active', false);
      voteMod = -1;
      downVote.style('color', null);
    } else {
      // Change the vote count back to neutral
      if (upVote.classed('gd3-vote-active') == true) voteMod = voteMod + 1;
      // Alter classes
      downVote.classed('gd3-vote-active', true);
      upVote.classed('gd3-vote-active', false);

      // Style downvote
      downVote.style('color', 'goldenrod');
    }

    voteCount.text( parseInt(voteCount.text()) - voteMod );

    // Vote function always functions on click and passes current state
    thisVote.downvoteFn(d, downVote.classed('gd3-vote-active'));
  });


  upVote.on('click', function(d) {
    // vote elements need to be redefined because of the way element rendering currently works
    var downVote = d3.select(this.parentNode).select('.gd3-tooltip-dvote'),
        upVote = d3.select(this),
        voteCount = d3.select(this.parentNode).select('.gd3-tooltip-votecount');

    var voteMod = 1;

    downVote.style('color', null);

    if (upVote.classed('gd3-vote-active') == true) {
      upVote.classed('gd3-vote-active', false);
      voteMod = -1;
      upVote.style('color', null);
    } else {
      // Change the vote count back to neutral
      if (downVote.classed('gd3-vote-active') == true) voteMod = voteMod + 1;
      // Alter classes
      downVote.classed('gd3-vote-active', false);
      upVote.classed('gd3-vote-active', true);

      // Style upvote
      upVote.style('color', 'goldenrod');
    }

    voteCount.text( parseInt(voteCount.text()) + voteMod );

    // Vote function always functions on click and passes current state
    thisVote.upvoteFn(d, upVote.classed('gd3-vote-active'));
  });


  var voteGlyphStyle = {
    cursor: 'pointer',
    '-moz-user-select': 'none',
    '-ms-user-select': 'none',
    '-o-user-select': 'none',
    '-webkit-user-select': 'none'
  }

  downVote.style(voteGlyphStyle);
  upVote.style(voteGlyphStyle);

  votingArea.attr('data-summaryElement', this.summaryElement);
  if(this.summaryElement) votingArea.style('display', 'none');
  return votingArea;
}