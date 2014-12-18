import "tooltipDatum";

gd3.tooltipTable = gd3_tooltipTable;

// Array should be a 2D array.
function gd3_tooltipTable(array) {
  // TODO add a generator s.t. it makes 0-D array -> 1-D -> 2-D -> call gd3_tooltipTable(array)
  if (!this instanceof gd3_tooltipTable) return new gd3_tooltipTable(array);

  this.table = array;
  return this;
}

var gd3_tooltipTablePrototype = gd3_tooltipTable.prototype = new gd3_tooltipDatum;

gd3_tooltipTablePrototype.toString = function() {
  return this.body.toString();
};

gd3_tooltipTablePrototype.render = function(selection) {
  var thisTooltip = this;
      table = selection.append('table'),
      rows = table.selectAll('tr').data(thisTooltip.table).enter().append('tr'),
      cells = rows.selectAll('td').data(function(d) { return d; }).enter().append('td');

  cells.each(function(d){
    if(d.render) d.render(d3.select(this));
    else d3.select(this).text(d.toString());
  });
}