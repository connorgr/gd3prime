import "tooltipElement";

gd3.tooltip.vote = gd3_tooltipVote;

function gd3_tooltipVote(downvoteFn, upvoteFn, voteCount) {
  if (!this instanceof gd3_tooltipVote) return new gd3_tooltipVote(downvoteFn, upvoteFn, voteCount);

  this.downvoteFn = downvoteFn;
  this.upvoteFn = upvoteFn;
  this.voteCount = voteCount;
  return this;
}

var gd3_tooltipVotePrototype = gd3_tooltipVote.prototype = new gd3_tooltipElement;

gd3_tooltipVotePrototype.toString = function() {
  return this.voteCount + ' votes';
};

gd3_tooltipVotePrototype.render = function(selection) {
  var votingArea = selection.append('span'),
      downVote = votingArea.append('span').text('▼'),
      voteCount = votingArea.append('span').text(this.voteCount),
      upVote = votingArea.append('span').text('▲');

  votingArea.selectAll('span').style({
    display: 'inline-block'
  });

  downVote.on('click', function(d) {
    downVote.classed('gd3-vote-active', true);
    upVote.classed('gd3-vote-active', false);
    this.downVoteFn(d);
  });
  upVote.on('click', function(d) {
    downVote.classed('gd3-vote-active', false);
    upVote.classed('gd3-vote-active', true);
    this.upvoteFn(d);
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
  if(this.summaryElement) votingArea.style('display', 'none').style('visibility', 'hidden');
  return votingArea;
}