var mapWidth = 960,
mapHeight = 500,
focused = false,
ortho = true,
sens = 0.25;
 
var projectionGlobe = d3.geo.orthographic()
.scale(240)
.center([0, 0])
.translate([mapWidth / 2, mapHeight / 2])
.clipAngle(90);
 
var projectionMap = d3.geo.equirectangular()
.scale(145)
.center([0, 0])
.translate([mapWidth / 2, mapHeight / 2])
 
var projection = projectionGlobe;
 
var path = d3.geo.path()
.projection(projection);
 
var globe2map = interpolatedProjection(projectionGlobe, projectionMap),
map2globe = interpolatedProjection(projectionMap, projectionGlobe);
 
var svgMap = d3.select("div#map").append("svg")
.attr("overflow", "hidden")
.attr("width", mapWidth)
.attr("height", mapHeight);
 
var zoneTooltip = d3.select("div#map").append("div").attr("class", "zoneTooltip"),
pointLlabel = d3.select("div#map").append("div").attr("class", "pointLabel"),
infoLabel = d3.select("div#map").append("div").attr("class", "infoLabel");
 
var g = svgMap.append("g");
 
//Unreelling transformation
 
function animation(interProj) {
defaultRotate();
g.transition()
.duration(7500)
.tween("projection", function() {
return function(_) {
interProj.alpha(_);
g.selectAll("path").attr("d", path);
};
})
}
 
function interpolatedProjection(a, b) {
var projection = d3.geo.projection(raw).scale(1),
center = projection.center,
translate = projection.translate,
clip = projection.clipAngle,
α;
 
function raw(λ, φ) {
var pa = a([λ *= 180 / Math.PI, φ *= 180 / Math.PI]), pb = b([λ, φ]);
return [(1 - α) * pa[0] + α * pb[0], (α - 1) * pa[1] - α * pb[1]];
}
 
projection.alpha = function(_) {
if (!arguments.length) return α;
α = +_;
var ca = a.center(), cb = b.center(),
ta = a.translate(), tb = b.translate();
center([(1 - α) * ca[0] + α * cb[0], (1 - α) * ca[1] + α * cb[1]]);
translate([(1 - α) * ta[0] + α * tb[0], (1 - α) * ta[1] + α * tb[1]]);
if (ortho === true) {clip(180 - α * 90);}
return projection;
};
 
delete projection.scale;
delete projection.translate;
delete projection.center;
return projection.alpha(0);
}
 
//Rotate to default before animation
 
function defaultRotate() {
d3.transition()
.duration(1500)
.tween("rotate", function() {
var r = d3.interpolate(projection.rotate(), [0, 0]);
return function(t) {
projection.rotate(r(t));
g.selectAll("path").attr("d", path);
};
})
};
 
//Starter for function AFTER All transitions
 
function endall(transition, callback) {
var n = 0;
transition
.each(function() { ++n; })
.each("end", function() { if (!--n) callback.apply(this, arguments); });
}
 
//Loading data
 
queue()
.defer(d3.json, "data/world-110m.json")
.defer(d3.tsv, "data/world-110m-country-names.tsv")
.await(ready);
 
 
function ready(error, world, countryData) {
 
var countryById = {},
countries = topojson.feature(world, world.objects.countries).features;
 
//Adding countries by name
 
countryData.forEach(function(d) {
countryById[d.id] = d.name;
});
 
//Drawing countries on the globe
 
var world = g.selectAll("path").data(countries);
world.enter().append("path")
.attr("class", "mapData")
.attr("d", path)
.classed("ortho", ortho = true);
 
//Drag event
 
world.call(d3.behavior.drag()
.origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
.on("drag", function() {
var λ = d3.event.x * sens,
φ = -d3.event.y * sens,
rotate = projection.rotate();
//Restriction for rotating upside-down
φ = φ > 30 ? 30 :
φ < -30 ? -30 :
φ;
projection.rotate([λ, φ]);
g.selectAll("path.ortho").attr("d", path);
g.selectAll(".focused").classed("focused", focused = false);
}))
 
//Events processing
 
world.on("mouseover", function(d) {
if (ortho === true) {
infoLabel.text(countryById[d.id])
.style("display", "inline");
} else {
zoneTooltip.text(countryById[d.id])
.style("left", (d3.event.pageX + 7) + "px")
.style("top", (d3.event.pageY - 15) + "px")
.style("display", "block");
}
})
.on("mouseout", function(d) {
if (ortho === true) {
infoLabel.style("display", "none");
} else {
zoneTooltip.style("display", "none");
}
})
.on("mousemove", function() {
if (ortho === false) {
zoneTooltip.style("left", (d3.event.pageX + 7) + "px")
.style("top", (d3.event.pageY - 15) + "px");
}
})
.on("click", function(d) {
if (focused === d) return reset();
g.selectAll(".focused").classed("focused", false);
d3.select(this).classed("focused", focused = d);
infoLabel.text(countryById[d.id])
.style("display", "inline");
 
//Transforming Globe to Map
 
if (ortho === true) {
defaultRotate();
setTimeout(function() {
projection = globe2map;
path.projection(projection);
animation(projection);
g.selectAll(".ortho").classed("ortho", ortho = false);
}
, 1600);
}
});
 
//Adding extra data when focused
 
function focus(d) {
if (focused === d) return reset();
g.selectAll(".focused").classed("focused", false);
d3.select(this).classed("focused", focused = d);
}
 
//Reset projection
 
function reset() {
g.selectAll(".focused").classed("focused", focused = false);
infoLabel.style("display", "none");
zoneTooltip.style("display", "none");
 
//Transforming Map to Globe
 
projection = map2globe;
path.projection(projection);
animation(projection);
g.selectAll("path").classed("ortho", ortho = true);
}
};
