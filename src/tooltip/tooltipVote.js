import "tooltipElement";

gd3.tooltip.vote = gd3_tooltipVote;
var gd3_tooltipVotePrototype = gd3_tooltipVote.prototype = new gd3_tooltipElement;

function gd3_tooltipVote(downvoteFn, upvoteFn, voteCount) {
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
    downVote.classed('gd3-vote-active', true);
    upVote.classed('gd3-vote-active', false);
    thisVote.downvoteFn(d);
  });
  upVote.on('click', function(d) {
    downVote.classed('gd3-vote-active', false);
    upVote.classed('gd3-vote-active', true);
    thisVote.upvoteFn(d);
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