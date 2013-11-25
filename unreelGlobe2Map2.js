var mapWidth = 960,
mapHeight = 500,
ortho = true,
clipMode = false,
speed = -7e-3,
start = Date.now(),
corr = 0;
 
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
 
var canvas = d3.select("div#map").append("canvas")
.attr("overflow", "hidden")
.attr("width", mapWidth)
.attr("height", mapHeight);
 
var context = canvas.node().getContext("2d");
 
var path = d3.geo.path()
.projection(projection)
.context(context);
 
//Loading data
 
queue()
.defer(d3.json, "/d/5685937/world-110m.json")
.defer(d3.tsv, "/d/5685937/world-110m-country-names.tsv")
.await(ready);
 
 
function ready(error, world, countryData) {
 
var countryById = {},
 
land = topojson.feature(world, world.objects.land),
borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });
 
var globe2map = interpolatedProjection(projectionGlobe, projectionMap),
map2globe = interpolatedProjection(projectionMap, projectionGlobe);
 
canvas.on("click", function(d) {
 
//Transforming Globe to Map
 
if (ortho === true) {
ortho = false;
defaultRotate();
 
setTimeout(function() {
projection = globe2map;
path.projection(projection);
clipMode = false;
animation(projection);
}
, 1600);
} else {
reset();
}
});
 
//Globe rotating via timer
 
d3.timer(function() {
 
if (ortho === true) {
var λ = speed * (Date.now() - start);
 
projection.rotate([λ + corr, 0]);
context.clearRect(0, 0, mapWidth, mapHeight);
context.beginPath();
context.fillStyle = "#E6E6E6";
path(land);
context.fill();
}
});
 
 
function reset() {
 
//Transforming Map to Globe
 
projection = map2globe;
path.projection(projection);
clipMode = true;
animation(projection);
setTimeout(function() {
start = Date.now();
ortho = true;
}
, 7600);
 
}
 
//Unreelling transformation
 
function animation(interProj) {
d3.transition()
.duration(7500)
.tween("projection", function() {
return function(_) {
interProj.alpha(_);
context.clearRect(0, 0, mapWidth, mapHeight);
context.beginPath();
path(land);
context.fillStyle = "#E6E6E6";
context.fill();
 
context.beginPath();
path(borders);
context.strokeStyle = "#ffffff";
context.lineWidth = .5
context.stroke();
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
if (clipMode === true) {clip(180 - α * 90);}
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
context.clearRect(0, 0, mapWidth, mapHeight);
context.beginPath();
path(land);
context.fillStyle = "#E6E6E6";
context.fill();
};
})
};
};
