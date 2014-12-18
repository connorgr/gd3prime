import "tooltipDatum";

gd3.tooltipLink = gd3_tooltipLink;

function gd3_tooltipLink(href, body) {
  if (!this instanceof gd3_tooltipLink) return new gd3_tooltipLink(href, body);

  this.body = body;
  this.href = href;
  this.type = "link";
  return this;
}

var gd3_tooltipLinkPrototype = gd3_tooltipLink.prototype = new gd3_tooltipDatum;

gd3_tooltipLinkPrototype.toString = function() {
  return this.body.toString();
};

gd3_tooltipLinkPrototype.render = function(selection) {
  var thisTooltip = this;
      a = selection.append('a')
      .attr('href', this.href);
  if(thisTooltip.body.render) thisTooltip.body.render(a);
  else a.text(thisTooltip.body.toString());
}