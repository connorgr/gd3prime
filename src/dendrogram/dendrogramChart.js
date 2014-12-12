function dendrogramChart(style) {
	// Globals controllable by the user
	var update;

	function chart(selection) {
		selection.each(function(data) {
			///////////////////////////////////////////////////////////////////
			// Perform simple validation
			if (!data.Z || !data.labels){
				throw "dendrogram: Z and labels *required*."
			}

			// Make sure that there is a unique index in the 4th column
			var indices = data.Z.map(function(r){ return r[3]; });
			if (indices.length != d3.set(indices).values().length){
				data.Z.forEach(function(r, i){
					r[3] = i + "-" + r[3];
				})
			}

			///////////////////////////////////////////////////////////////////
			// Give some of the style elements shorter variable handles
			var height = style.height,
				width = style.width,
				colorScheme = style.colorScheme, // name of color scheme
				colorSchemes = style.colorSchemes;

			// Set up the SVG
			var svg = d3.select(this).selectAll('svg')
					.data([data]).enter()
					.append('svg')
					.attr("xmlns", "http://www.w3.org/2000/svg"),
				fig = svg.append("g"),
				edges = fig.append("g").attr("id" ,"edges"), // add edges first so they are shown below nodes
				leafGroup = fig.append("g").attr("id", "leaves");

			svg.attr('id', 'figure')
				.attr('height', height)
				.attr('width', width)
				.style('font-family', style.fontFamily)
				.style('font-size', style.fontSize);

			// Set up the x-axis
			var xAxis = d3.svg.axis(),
				xAxisGroup = fig.append("g")
					.style({'stroke': style.fontColor, 'fill': 'none', 'stroke-width': style.strokeWidth})
					.attr("transform", "translate(" + style.margins.left + "," + height + ")")

			// Set up colors
			if (!(colorScheme in colorSchemes)){
				console.log("Color scheme " + colorScheme + " not found, using default.")
				colorScheme = "default";
			}
			var color = colorSchemes[colorScheme];

			///////////////////////////////////////////////////////////////////
			update = function (treeData){
				// Parse the data into shorter variable handles
				var Z = treeData.Z,           // SciPy linkage matrix: see http://goo.gl/nycOCS
					labels = treeData.labels, // list of labels for leaves
					labelToGroup = treeData.labelToGroup,
					n = labels.length;    // number of nodes

				if (!treeData.labelToGroup){
					labelToGroup = {};
					labels.forEach(function(d, i){ labelToGroup[d] = i; });
				}

				// Create a mapping of leaves (labels) to when they first are
				// added, and then sort the labels in this order
				function isLeaf(v){ return v < n; }
				var nodeToIndex = [];
				labels.forEach(function(n, i){ nodeToIndex[i] = i; });

				// Set up a linear y-axis scale
				var y = d3.scale.linear()
						.domain([0, labels.length-1])
						.range([style.nodeRadius, height-style.nodeRadius]),
					labelToY = d3.scale.ordinal() // convenience scale for labels directly
						.domain(labels)
						.rangePoints([style.nodeRadius, height-style.nodeRadius]);

				///////////////////////////////////////////////////////////////
				// LEAVES' GENERAL UPDATE

				// DATA JOIN: join data with old elements
				var leaves = leafGroup.selectAll("g")
					.data(labels, function(d){ return d; });

				// UPDATE: transition old elements
				leaves.transition()
					.duration(style.animationSpeed)
					.attr("transform", function(d){ return "translate(0," + labelToY(d) + ")"; })

				leaves.select("circle")
					.attr("fill", function(d){ return color(labelToGroup[d]); });

				// ENTER: create new elements
				var leafGs = leaves.enter()
					.append("g")
					.attr("transform", function(d){ return "translate(0," + labelToY(d) + ")"; });

				leafGs.append("circle")
					.attr("r", style.nodeRadius)
					.style("fill-opacity", 1e-6)
					.attr("fill", function(d){ return color(labelToGroup[d]); })
					.transition()
					.duration(style.animationSpeed)
					.style("fill-opacity", 1);

				leafGs.append("text")
					.attr("text-anchor", "start")
					.attr("x", style.nodeRadius + 5)
					.attr("y", style.nodeRadius/2)
					.text(function(d){ return d; });

				// EXIT: remove old elements
				leaves.exit().transition()
					.duration(style.animationSpeed)
					.style("fill-opacity", 1e-6)
					.remove();

				///////////////////////////////////////////////////////////////
				// Set up the linear x-axis scale by:

				// (1) Compute the size of the largest label, so we can 
				// set the tree width
				var labelWidth = leafGroup.node().getBBox().width,
					treeWidth = width - labelWidth - style.margins.left;
				leafGroup.attr("transform", "translate(" + (width-labelWidth) + ",0)");

				// (2) Using the updated treeWidth to set up the x-axis scale
				var maxDist = d3.max(Z.map(function(row){ return row[2]; })),
					x = d3.scale.linear()
					   .domain([0, maxDist])
					   .range([treeWidth, style.margins.left]); // go in reverse, since low distances are to the furthest right

				///////////////////////////////////////////////////////////////
				// Create objects to represent each edge
				var edgeData = [],
					distances = labels.map(function(_){ return 0; })
					groups = labels.map(function(d){ return [labelToGroup[d]]; });

				function connectNodes(u, v, w, index){
					// Find the y-index of each node
					var i  = nodeToIndex[u],
						j  = nodeToIndex[v],
						d1 = distances[u],
						d2 = distances[v],
						g1 = groups[u],
						g2 = groups[v],
						newG = g1.length == 1 && g2.length == 1 && g1[0] == g2[0] ? g1 : g1.concat(g2);
					console.log(index)
					// Draw the horizontal line from u
					edgeData.push({name: "u" + index, x1: x(d1), x2: x(w), y1: y(i), y2: y(i), groups: g1 });

					// Draw the horizontal line from v
					edgeData.push({name: "v" + index, x1: x(d2), x2: x(w), y1: y(j), y2: y(j), groups: g2 });

					// Connect the two horizontal lines with a vertical line
					edgeData.push({name: "uv" + index, x1: x(w), x2: x(w), y1: y(i), y2: y(j), groups: newG })

					// Add an index for the new internal nodes
					nodeToIndex.push( (i  + j) / 2. );
					distances.push(w);
					groups.push( newG );

				}

				Z.forEach(function(row){ connectNodes(row[0], row[1], row[2], row[3]); });

				///////////////////////////////////////////////////////////////
				// EDGES' GENERAL UPDATE
				// Data join
				var lines = edges.selectAll("line")
					.data(edgeData, function(d){ return d.name + " " + d.ty; })

				// Transition existing elements
				lines.transition()
					.duration(style.animationSpeed)
					.attr("x1", function(d){ return d.x1; })
					.attr("x2", function(d){ return d.x2; })
					.attr("y1", function(d){ return d.y1; })
					.attr("y2", function(d){ return d.y2; })
					.attr("stroke-dasharray", function(d){
						if (d.groups.length == 1){ return ""; }
						else { return ("3", "3"); }
					})

				// Add new elements
				lines.enter()
					.append("line")
					.attr("x1", function(d){ return d.x1; })
					.attr("x2", function(d){ return d.x1; })
					.attr("y1", function(d){ return d.y1; })
					.attr("y2", function(d){ return d.y1; })
					.attr("stroke", style.strokeColor)
					.attr("stroke-width", style.strokeWidth)
					.attr("stroke-dasharray", function(d){
						if (d.groups.length == 1){ return ""; }
						else { return ("3", "3"); }
					})
					.attr("fill-opacity", 1e-6)
					.transition()
						.duration(style.animationSpeed)
						.attr("x2", function(d){ return d.x2; })
						.attr("y2", function(d){ return d.y2; })
						.attr("fill-opacity", 1);

				// Fade and remove old elements
				lines.exit().transition()
					.duration(style.animationSpeed)
					.style("stroke-opacity", 1e-6)
					.remove();

				///////////////////////////////////////////////////////////////////
				// Update the x-axis
				xAxis.scale(x);
				xAxisGroup.call(xAxis);
				xAxisGroup.selectAll("text")
					.style({'stroke-width': '0px', 'fill': style.fontColor })

				///////////////////////////////////////////////////////////////////
				// Resize the SVG to make sure everything fits
				svg.attr('height', fig.node().getBBox().height);
			}
			// Draw the inital dendrogram
			update(data);

		});

	}

	chart.update = function(treeData){ update(treeData); }
	chart.animationSpeed = function(){ return style.animationSpeed; }

	return chart;
}