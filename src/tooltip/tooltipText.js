import "tooltipDatum";

gd3.tooltipText = gd3_tooltipText;

function gd3_tooltipText(text) {
  if (!this instanceof gd3_tooltipText) return new gd3_tooltipText(text);

  this.text = text;
  this.type = "text";
  return this;
}

var gd3_tooltipTextPrototype = gd3_tooltipText.prototype = new gd3_tooltipDatum;

gd3_tooltipTextPrototype.toString = function() {
  return this.text;
};

gd3_tooltipTextPrototype.render = function(selection) {
  selection.append('span').text(this.text);
}