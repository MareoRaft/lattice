
Object.prototype.toString = function(){
    var string = '';
    for( var key in this )if( this.hasOwnProperty(key) ){
        var value = (typeof this[key] === 'number' || typeof this[key] === 'string'
                || typeof this[key] === 'boolean' || Array.isArray(this[key]))?
            this[key].toString():
                (typeof this[key] === 'undefined')?
            'undefined':
            'object';
        string += key + ': ' + value + '\n';
    }
    return string;
};
/////////////////////////////////////////////////////////////
var itemType, scales, xCenter, yCenter, xRange, yRange;
function setup() {
    scales = _.map(range, function(extent) {
        return Perseus.Util.scaleFromExtent(extent, size);
    });
    // scales should make things nice.  Before it was using _.min(scales) for scale. alert(scales)
    if (def(stretch) && stretch !== 'square') {
        stretch *= (range[0][1] - range[0][0]) / (range[1][1] - range[1][0]);
        if (stretch > 1) scales[1] /= stretch;
        if (stretch < 1) scales[0] *= stretch;
    }
    init({range: range, scale: scales});
    xCenter = (range[0][0] + range[0][1]) / 2;
    yCenter = (range[1][0] + range[1][1]) / 2;
    xRange = range[0][1] - range[0][0];
    yRange = range[1][1] - range[1][0];
    // styleNormal['clipRect'] = [[range[0][0], range[1][0]], [xRange, yRange]]; // this doesn't work because i don't truly understand how clipRect works
}
/////////////////////////////////////////////////////////////
Math.PHI = 1.61803398874989484820458683;
Math.TAU = 2 * Math.PI;

var styleNormal = { // this code comes straight out of graphie-drawing.js  If we can access that variable, it would be better than creating a duplicate here
    stroke: KhanUtil.BLACK,
    strokeWidth: 2,
    strokeOpacity: 1,
    strokeDasharray: '',
    fill: KhanUtil.BLACK,
    fillOpacity: 0,
    color: KhanUtil.BLACK,
    //strokeLinecap: 'butt', // agg that causes an error on labels!
    // and disabling everything else...
    dashed: undefined,
    dotted: undefined,
    rotation: null, // 0 makes all arrowheads point to the right :(
};
function styleReset() { style(styleNormal) }
function drawSegment2(obj){ //drawSegment is a bad function!
    style(obj);
        path(obj.points);
    styleReset();
}
function def(scalar) {
    if (typeof(scalar) === 'undefined' || scalar === null) return 0;
    else return 1;
}
function numberUndef(array) {
    var undefcount = 0;
    for (var i = 0; i < array.length; ++i) if (!def(array[i])) ++undefcount;
    return undefcount;
}
function mod(m, n) {
    return (m % n + n) % n;
}
function die(message) {
    alert(message);
    throw message;
}
var copy = _.clone;
function minus(p1, p2) {
    var p3 = copy(p1);
    for (var i in p3) p3[i] -= p2[i];
    return p3;
}
function add(p1, p2) {
    var p3 = copy(p1);
    for (var i in p3) p3[i] += p2[i];
    return p3;
}
function times(c, p) {
    return _.map(p, function(e) {return c * e}); // _.map DOES clone
}
function average(p, q) {
    return times(0.5, add(p, q));
}
function weightedAverage(w, p, q) {
    return add(times(w, p), times(1 - w, q));
}
function neg(p) {
    return times(-1, p);
}
function makePolar(p) {
    var r = Math.sqrt(p[0] * p[0] + p[1] * p[1]);//; alert(r)
    var t = Math.atan2(p[1], p[0]);//; alert(t)
    return [r, t * 360 / Math.TAU];
}
function rotate_p_theta(p, t) {
    var pol = makePolar(p);
    return polar(pol[0], pol[1] + t);
}
function perp(p, q) {
    var slope = minus(q, p);
    return rotate_p_theta(slope, 90);
}
function p_rotated_about_q_theta(p, q, t) {
    var adjusted_p = minus(p, q);
    var rotated_adjusted_p = rotate_p_theta(adjusted_p, t);
    var rotated_p = add(q, rotated_adjusted_p);
    return rotated_p;
}
var rotate_p_about_q_theta = p_rotated_about_q_theta;
function drawPolygon2(poly) {
    for (var i = 0; i < poly.points.length; ++i) {
        var l = poly.points.length;
        var label = ''; if (def(poly.angleLabels) && def(poly.angleLabels[i])) label = poly.angleLabels[i];
        var arcs = 0; if (def(poly.arcs) && def(poly.arcs[i])) arcs = poly.arcs[i];
        var distance = 0; if (def(poly.distance) && def(poly.distance[i])) distance = poly.distance[i];
        drawAngleLabel({
            points: [poly.points[mod(i + 1, l)], poly.points[i], poly.points[mod(i - 1, l)]],
            label: label,
            arcs: arcs,
            distance: distance,
        });
    }
    delete poly.angleLabels;
    delete poly.arcs; // but right angles refuse to go away
    drawPolygon(poly);
}
function solveSquare(sq) {
    var center = sq.center;
    var r = sq.radius;
    var t = def(sq.theta)? sq.theta: 0;
    var corner = add(center, add(polar(r, t), polar(r, t + 90)));
    var b = p_rotated_about_q_theta(corner, center, 90);
    var c = p_rotated_about_q_theta(corner, center, 90 * 2);
    var d = p_rotated_about_q_theta(corner, center, 90 * 3);
    sq.points = [corner, b, c, d];
    return sq;
}
function drawSquare(sq) {
    solveSquare(sq);
    drawPolygon2(sq);
}
function point_at_x_equals(a, b, x) {
    return [x, a[1] + (x - a[0]) / (b[0] - a[0]) * (b[1] - a[1])];
}
function point_at_y_equals(a, b, y) {
    return [a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), y];
}
function intersection(a, b, c, d) { // line ab intersect line cd
    if (a[0] === b[0]) return point_at_x_equals(c, d, a[0]);
    if (c[0] === d[0]) return point_at_x_equals(a, b, c[0]);
    if (a[1] === b[1]) return point_at_y_equals(c, d, a[1]);
    if (c[1] === d[1]) return point_at_y_equals(a, b, c[1]);

    var num = (c[1] - a[1]) / (b[1] - a[1]) - (c[0] - a[0]) / (b[0] - a[0]);
    var denom = (d[0] - c[0]) / (b[0] - a[0]) - (d[1] - c[1]) / (b[1] - a[1]);
    var l = num / denom;
    return [c[0] + l * (d[0] - c[0]), c[1] + l * (d[1] - c[1])];
}
function leftify(text) {
    return text + '\\hphantom{' + text + '}';
}
function rightify(text) {
    return '\\hphantom{' + text + '}' + text;
}
function latexifyPoint(point){
    return '(' + point[0] + ',' + point[1] + ')';
}
function textify(string){
    if(typeof string !== 'string') die('You must input a string.');
    if( string.match(/\\text/) ){ return string; }
    return '\\text{'+string+'}';
}
function textifySmart(string){
    if(typeof string !== 'string'){
        alert(string)
        die('You must input a string.');
    }
    if( string.match(/^[(.]|[\\=<>]/) ){ return string; } // if we detect LaTeX at beginning, we don't wrap
    return '\\text{'+string+'}';
}
function ofStringsAndNumbers(array){
    var bool = true;
    _.each(array, function(el){ if(typeof el !== 'string' && typeof el !== 'number') bool = false; });
    return bool;
}
function unpack(l){
    if( typeof l === 'string' || typeof l === 'number' ){
        return {text: l};
    }
    if( !Array.isArray(l) ){
        return l;
    }
    // now l must be an array
    if( ofStringsAndNumbers(l) ){
        return {text: l};
    }
    // now l must have something to inherit
    // alert('hi')
    if( l.length !== 2 ) die("l doesn't have length 2, yet it's an array with objects in it.");
    // alert('bye')
    // now inherit l[1] on the unpacked l[0]
    l = $.extend({}, l[1], unpack(l[0]));
    return l;
}
function drawLabel(l, inheritObj){
    if(def(inheritObj)) l = [l, inheritObj];
    l = unpack(l);
    // alert('label object before defaults: '+l)
    _.defaults(l, {
        label: '',
        point: [0,0],
        showPoint: undefined, // we will deal with this below...
        pointShift: [0,0],
        orientation: 'center',
        isTeX: true,
        spacing: 1.5,
        textify: undefined, // forces wrapping or no-wrapping with \text{ ... }
        size: '',
        prefix: '',
        suffix: '',
        rotation: 0,
    });
    if(!def(l.content)) l.content = l.label;    if(!def(l.text)) l.text = l.content;
    if(def(l.point)){
        if(l.text === ''){
            l.text = latexifyPoint(l.point);
            if(l.showPoint !== false) l.showPoint = true;
        }
        if(l.showPoint === true) drawPoint(l);
    }
    if(!def(l.showPoint)) l.showPoint = false;
    l.point = add(l.point, l.pointShift);
    if(!def(l.color)) l.color = l.stroke;
    // alert('label object after defaults: '+l)
    if(typeof l.text === 'string') l.text = [l.text];
    var HT = l.spacing * l.text.length - 1;
    if(l.orientation === 'center') l.point = add(l.point, [0, HT/2]);
    else if(l.orientation === 'below') l.point = add(l.point, [0, -HT]);
    else if(l.orientation === 'above') l.point = add(l.point, [0, HT]);
    style(l);
        _.each(l.text, function(text, i) {
            // alert('text is: '+text)
            if(!def(l.textify) && l.isTeX) text = textifySmart(text);
            else if(l.textify) text = textify(text);
            text = l.size + ' ' + l.prefix + text + l.suffix; // space after size so that letters don't collide with other letters
            var x = l.point[0] + l.spacing * Math.sin(l.rotation / 360 * Math.TAU) * i
            var y = l.point[1] - l.spacing * Math.cos(l.rotation / 360 * Math.TAU) * i
            label([x, y], text, l.orientation, l.isTeX).css('transform', 'rotate(-'+l.rotation+'deg)');
        });
    styleReset();
}
function labelMultiline(point, textarray, spacing) {
    drawLabel({point: point, text: textarray, spacing: spacing});
}
function drawPieGraph(pie) {
    //defaults
    _.defaults(pie, {
        center: [0, 0], radius: 1, radiusScale: 1, start: 0, strokeWidth: 2, fills: [], fillOpacity: 1,
    });

    var total = 0;
        for (var i = 0; i < pie.increments.length; ++i) total += pie.increments[i];
    for (i = 0; i < pie.increments.length; ++i) pie.increments[i] *= 360 / total;

    var deg = pie.start;
    for (i = 0; i < pie.increments.length; ++i) {
        //alert([pie.center,pie.radius,pie.])
        drawSector({
            center: pie.center,
            radius: pie.radius,
            start: deg,
            end: deg + pie.increments[i],
            strokeWidth: pie.strokeWidth,
            fill: pie.fills[i],
            fillOpacity: pie.fillOpacity,
        });
        var labelstring = pie.labels[i];
        if (def(labelstring)) {
            labelstring = '\\text{'+ labelstring + '}';
            var percent = pie.increments[i] * 100 / 360;
            labelstring += '\\ (' + roundScalar(percent) + '\\%)';

            var theta = deg + pie.increments[i] / 2;
            if (theta < 60 || theta > 360 - 60) labelstring = rightify(labelstring);
            if (theta > 180 - 60 && theta < 180 + 60) labelstring = leftify(labelstring);

            var r = pie.radius * 1.19 * pie.radiusScale;
            drawLabel({
                point: add(pie.center, polar(r, theta)),
                label: labelstring,
            })
        }
        deg += pie.increments[i];
    }
}
function degreesToRadians(array) {
    for (var i = 0; i < array.length; ++i) if (def(array[i])) array[i] *= Math.TAU / 360;
    return array;
}
function radiansToDegrees(array) {
    for (var i = 0; i < array.length; ++i) if (def(array[i])) array[i] *= 360 / Math.TAU;
    return array;
}
function rotateArray(array, reverse) {
    if (reverse) array.push(array.shift());
    else array.unshift(array.pop());
    return array;
}
function rotateTriangle(tri) {
    // sides, angles, keep track of # rotations
    rotateArray(tri.sides);
    rotateArray(tri.angles);
    if (!def(tri.rotateNum)) tri.rotateNum = 0;
    ++tri.rotateNum;
    tri.rotateNum %= 3;
    return tri;
}
function unrotateTriangle(tri) {
    if (!def(tri.rotateNum)) tri.rotateNum = 0;
    for (tri.rotateNum; 0 < tri.rotateNum; --tri.rotateNum) {
        rotateArray(tri.sides, 'reverse');
        rotateArray(tri.angles, 'reverse');
    }
    return tri;
}
function roundScalar(scalar) {
    return knumber.round(scalar, 5);
}
function roundArray(array) {
    return _.map(array, roundScalar);
}
function roundTriangle(tri) {
    tri.sides = roundArray(tri.sides);
    tri.angles = roundArray(tri.angles);
    return tri;
}
function solveTriangle(tri) { // takes in a polygon (must be a triangle)
    var angles = tri.angles; degreesToRadians(angles); //alert("rads are "+angles)
    var sides = tri.sides;

    for (var it = 0; it < 3; ++it) {
        //// angles stuff ////
        if (numberUndef(angles) === 1) {
            while (def(angles[0])) rotateTriangle(tri);
            angles[0] = Math.PI - angles[1] - angles[2];
        }
        else if (numberUndef(angles) === 2) {
            while (!def(angles[0])) rotateTriangle(tri);
            //now the defined angle is 0
            if (def(sides[1])) {
                if (def(sides[0])) angles[2] = Math.asin(Math.sin(angles[0]) * sides[0] / sides[1]);
                else if (def(sides[2])) angles[1] = Math.asin(Math.sin(angles[0]) * sides[2] / sides[1]);
            }
        }
        else if (numberUndef(angles) === 3) {
            if (numberUndef(sides) === 0) {
                angles[0] = Math.acos((pow(sides[0], 2) + pow(sides[2], 2) - pow(sides[1], 2)) / 2.0 / sides[0] / sides[2]);
            }
        }
        //// side stuff ////
        if (numberUndef(sides) === 1) {
            while (def(sides[0])) rotateTriangle(tri);
            if (def(angles[2])) {
                sides[0] = Math.sqrt(pow(sides[1], 2) + pow(sides[2], 2) - 2 * sides[1] * sides[2] * Math.cos(angles[2]));
            }
        }
        else if (numberUndef(sides) === 2) {
            while (!def(sides[0])) rotateTriangle(tri);
            if (def(angles[2])) {
                if (def(angles[0])) sides[1] = Math.sin(angles[0]) * sides[0] / Math.sin(angles[2]);
                else if (def(angles[1])) sides[2] = Math.sin(angles[1]) * sides[0] / Math.sin(angles[2]);
            }
        }
        else if (numberUndef(sides) === 3) die('At least 1 side length must be defined.');
    }
    if (numberUndef(sides) > 0 || numberUndef(angles) > 0) die('Not enough information to solve triangle.');

    radiansToDegrees(angles);
    unrotateTriangle(tri);

    tri.points = [[0, 0], [sides[0], 0], polar(sides[2], angles[0])];

    roundTriangle(tri);

    return tri;
}
function drawTriangle(tri) {
    return drawPolygon2(solveTriangle(tri));
}
function solveRectangle(poly) {
    if (def(poly.center)) poly.bottomLeft = [poly.center[0] - poly.WD / 2, poly.center[1] - poly.HT / 2];
    else if (def(poly.topLeft)) poly.bottomLeft = [poly.topLeft[0], poly.topLeft[1] - poly.HT];
    // alert(poly.bottomLeft)
    poly.points = [
        add(poly.bottomLeft, [0, 0]),
        add(poly.bottomLeft, [poly.WD, 0]),
        add(poly.bottomLeft, [poly.WD, poly.HT]),
        add(poly.bottomLeft, [0, poly.HT]),
        add(poly.bottomLeft, [0, 0]),
    ];
    return poly;
}
function drawRectangle(poly) {
    solveRectangle(poly);
    style(poly);
        path(poly.points); // previously drawPolygon(poly) // NOT drawPolygon2, because then the right angles appear.
    styleReset();
    if(def(poly.label)){
        drawRectangleHelper(poly);
        drawLabel([poly.label, {point: poly.center}]);
    }
}
function drawRectangleHelper(poly){
    poly.center = [ poly.bottomLeft[0] + poly.WD / 2, poly.bottomLeft[1] + poly.HT / 2 ];
    poly.topLeft = [ poly.bottomLeft[0], poly.bottomLeft[1] + poly.HT ];
    return poly;
}
function drawPoints(obj) {
    _.each(obj.points, function(point) {
        obj.point = point;
        drawPoint(obj);
    });
}
function point(point, label, color) {
    if (!def(color)) color = BLACK;
    drawPoint({
        point: point,
        label: label,
        stroke: color, color: color,
    });
}
function points(array) {
    _.each(array, function(e){ point(e) }); // we can't use _.each(array, point), because i would get passed as second argument
}
function drawPolyline(pathy) {
    _.defaults(pathy, { stroke: KhanUtil.BLACK, strokeOpacity: 1, strokeWidth: 2 });
    if (def(pathy.showPoints) && pathy.showPoints === true) {
        pathy.showPoints = false;
        drawPoints({
            points: pathy.points,
            stroke: null, // there is a stroke outlining the point, so we will DISABLE THIS
            fill: pathy.stroke, // the center of the point is this color!
            fillOpacity: pathy.fillOpacity
        });
    }
    style(pathy); // this is so that path(pathy.points) below will use the appropriate style
        pathy.datapoints = pathy.points;
        for (var i = 0; i < pathy.datapoints.length - 1; ++i) {
            pathy.points = [pathy.datapoints[i], pathy.datapoints[i + 1]];
            if (def(pathy.sideLabels) && def(pathy.sideLabels[i])) {
                pathy.sideLabel = pathy.sideLabels[i];
                drawPolygon(_.extend({}, pathy, {sideLabels: [pathy.sideLabel]}));
            }
            else if (def(pathy.dashed) || def(pathy.dotted)) {
                pathy.sideLabel = null;
                drawSegment(pathy);
            }
            else {
                path(pathy.points); // we avoid draw segment as much as possible because it is a time killer
            }
        }
    styleReset();
}
kvector.magnitude = kvector.length;
function normalize(vector) {
    return times(1.0 / kvector.magnitude(vector), vector);
}
function arrowHead(point, head, object ) { // the arrow is draw at point, pointing towards head
    var directionvector = normalize(minus(head, point));
        var scale = 0.4;
    directionvector = times(scale, directionvector);
    head = add(point, directionvector);

    object.arrows = true;
    line(point, head, object);
}
function drawArrow(arrow) {
    //defaults / error checking
    if (def(arrow.points) && !def(arrow.start)) arrow.start = arrow.points[0];
    if (def(arrow.points) && !def(arrow.end)) arrow.end = arrow.points[1];

    _.defaults(arrow, { head: arrow.end, tail: arrow.start, direction: '->', strokeWidth: 2, arrows: true });

    if (!def(arrow.head)) die('You must define a head point for your arrow.  For example... head: [2,9]');
    if (!def(arrow.tail)) die('You must define a tail point for your arrow.  For example... tail: [2,4]');

    //investigate arrow direction
    var matches = arrow.direction.match(/^(<|>|-|)-(<|>|-|)$/);
    if (!def(matches)) die("You can define an arrow direction. For example... direction: '<-'.  The direction must be one of ->, >-, >->, <-, -<, <-<, >-<, <->, or -. Not defining direction will default to ->.");

    //draw arrows
    if (matches[1] === '<') line(arrow.head, arrow.tail, arrow);
    if (matches[1] === '>') arrowHead(arrow.tail, arrow.head, arrow);
    if (matches[2] === '<') arrowHead(arrow.head, arrow.tail, arrow);
    if (matches[2] === '>') line(arrow.tail, arrow.head, arrow);

    //draw line (if not already there)
    arrow.arrows = false; line(arrow.tail, arrow.head, arrow);
}
function arrow(tail, head, direction) {
    drawArrow({ tail: tail, head: head, direction: direction });
}
function ray(points, stroke) {
    if (!def(stroke)) stroke = KhanUtil.BLACK;
    drawRay({ points: points, stroke: stroke });
}
function segment(point1, point2, strokeWidth) {
    if (!def(strokeWidth)) strokeWidth = 2;
    drawSegment({ points: [point1, point2], strokeWidth: strokeWidth });
}
function polygon(points, stroke, opacity) {
    if (!def(stroke)) stroke = KhanUtil.BLACK;
    if (!def(opacity)) opacity = 0;
    drawPolygon({ points: points, stroke: stroke, fillOpacity: opacity });
}
function circle(center_xy, radius, stroke, opacity) {
    if (!def(stroke)) stroke = KhanUtil.BLACK;
    if (!def(opacity)) opacity = 0;
    drawCircle({
        center: [center_xy[0], center_xy[1]],
        radius: radius,
        stroke: stroke,
        fillOpacity: opacity,
    });
}
function ellipse(center_xy, radius_x, radius_y, stroke, opacity) {
    if (!def(stroke)) stroke = KhanUtil.BLACK;
    if (!def(opacity)) opacity = 0;
    drawEllipse({
        center: [center_xy[0], center_xy[1]],
        radii: [radius_x, radius_y],
        stroke: stroke,
        fillOpacity: opacity,
    });
}
function arc(center_xy, radius, degree_start, degree_end, stroke, opacity) {
    if (!def(stroke)) stroke = KhanUtil.BLACK;
    if (!def(opacity)) opacity = 0;
    drawArc({
        center: center_xy,
        radius: radius,
        start: degree_start,
        end: degree_end,
        stroke: stroke,
        fillOpacity: opacity,
    });
}
function polyline(points, color) {
    drawPolyline({ points: points, stroke: color });
}
function tick( pointa, pointb ){
    style({stroke: KhanUtil.BLACK, strokeWidth: 1, strokeOpacity: 1});
        path([ pointa, pointb ]);
    styleReset();
}
function gridLine( pointa, pointb ){
    style({stroke: GRAY, strokeWidth: 1, strokeOpacity: 0.4});
        path([ pointa, pointb ]);
    styleReset();
}
function insertCommas(num, isTeX) {
    var separator = (def(isTeX) && isTeX === false)? ",": "{,}";
    var parts = num.toString().split(".");
    if (itemType === 'SPR' && 0 <= num && num < 10000);
    else parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join(".");
}
function initGridAttributes(g) {
    _.defaults(g, {
        //defaults for x
        xMin: 0, xMax: +10, xStep: 1,
        xPositionOfyAxis: (g.xMin > 0) ? g.xMin : (g.xMax < 0) ? g.xMax : 0,
        //...
        xArrows: '->', xTicks: true, xLines: true, xLineStep: undefined, xLabelsExcludeEnds: false,
        //x labels
        xLabel: ' ', xLabelBufferScale: 1, xArrowLabel: '', xArrowLabelPosition: 'right',
        xLabels: true, xLabelsSize: '\\small', xLabelsAlternate: false, xLabelsRotation: 0,
        xLabelsPrefix: '', xLabelsSuffix: '',
        //defaults for y
        yMin: 0, yMax: +10, yStep: 1,
        yPositionOfxAxis: (g.yMin > 0) ? g.yMin : (g.yMax < 0) ? g.yMax : 0,
        //...
        yArrows: '->', yTicks: true, yLines: true, yLineStep: undefined,
        //y labels
        yLabel: ' ', yLabelBufferScale: 1, yArrowLabel: '', yArrowLabelPosition: 'above',
        yLabels: true, yLabelsSize: '\\small', yLabelsAlternate: false, yLabelsRotation: 0,
        yLabelsPrefix: '', yLabelsSuffix: '',
        //shared defaults
        tickScale: 1,
    });
    //x finishing stuff...
    if(g.xLabelsPrefix!==''){ g.xLabelsPrefix = textify(g.xLabelsPrefix); }
    if(g.xLabelsSuffix!==''){ g.xLabelsSuffix = textify(g.xLabelsSuffix); }
    g.xPos = (g.xPositionOfyAxis === 'min' || g.yAxisPosition === 'left') ? g.xMin :
        (g.xPositionOfyAxis === 'max' || g.yAxisPosition === 'right') ? g.xMax : g.xPositionOfyAxis;
    g.xRange = g.xMax - g.xMin;
    g.xBuffer = 0.07 * g.xRange;
    g.xCenter = (g.xMin + g.xMax) / 2;
    //y finishing stuff...
    if(g.yLabelsPrefix!==''){ g.yLabelsPrefix = textify(g.yLabelsPrefix); }
    if(g.yLabelsSuffix!==''){ g.yLabelsSuffix = textify(g.yLabelsSuffix); }
    g.yPos = (g.yPositionOfxAxis === 'min' || g.xAxisPosition === 'below') ? g.yMin :
        (g.yPositionOfxAxis === 'max' || g.xAxisPosition === 'above') ? g.yMax : g.yPositionOfxAxis;
    g.yRange = g.yMax - g.yMin;
    g.yBuffer = 0.07 * g.yRange;
    g.yCenter = (g.yMin + g.yMax) / 2;
    //xy finishing stuff...
    g.xLabelPos = (def(g.xLabelPosition)) ? g.xLabelPosition : ((g.yPos - g.yMin) / (g.yRange) > 0.65) ? 'above' : 'below';
    g.yLabelPos = (def(g.yLabelPosition)) ? g.yLabelPosition : ((g.xPos - g.xMin) / (g.xRange) > 0.65) ? 'right' : 'left';
    g.xLabelsDrawAll = (def(g.xLabelsDrawAll)) ? g.xLabelsDrawAll : (g.yPos === g.yMin || g.yPos === g.yMax) ? true : false;
    g.yLabelsDrawAll = (def(g.yLabelsDrawAll)) ? g.yLabelsDrawAll : (g.xPos === g.xMin || g.xPos === g.xMax) ? true : false;
}
function drawySide(g) {
    initGridAttributes(g);

    //draw the big yLabel
    var xBuffer = g.xBuffer * 2.15 * g.yLabelBufferScale;
    var xCoord = (g.yLabelPos === 'left') ? g.xMin - xBuffer : g.xMax + xBuffer;
    drawLabel(g.yLabel, {
        point: [xCoord, g.yCenter],
        rotation: 90,
    });

    //draw y-axis
    // styleReset(); should not be needed if other style-setting things reset the style after
    arrow([g.xPos, g.yMin], [g.xPos, g.yMax], g.yArrows);

    //draw yArrowLabel
    yBuffer = g.yBuffer * 1.0; yCoord = (g.yArrowLabelPosition === 'above') ? g.yMax + yBuffer : g.yMin - yBuffer;
    label([g.xPos, yCoord], g.yArrowLabel);

    //y stuff
    for (var y = g.yMin; y <= g.yMax; y += g.yStep) {
        var labelstring = g.yLabelsSize + g.yLabelsPrefix + insertCommas(roundScalar(y)) + g.yLabelsSuffix;
        if (g.yLabels && (g.yLabelsDrawAll || Math.abs(y - g.yPos) > g.yBuffer / 2)) {
            if (g.yLabelsRotation) {
                var yLabelsRotation = -g.yLabelsRotation;
                xBuffer = -g.xBuffer * 0.28, labelOrienter = leftify;
                if (g.yLabelPos === 'right') { xBuffer *= -1; labelOrienter = rightify }
                label([g.xPos + xBuffer, y], labelOrienter(labelstring), 'center')
                .css('transform', 'rotate('+ yLabelsRotation + 'deg)');
            }
            else {
                label([g.xPos, y], labelstring, g.yLabelPos)
            }
        }
        if (g.yTicks) tick( [g.xPos - g.xBuffer/5 * g.tickScale, y], [g.xPos + g.xBuffer/5 * g.tickScale, y] );
        if (g.yLines && !def(g.yLineStep)) gridLine([g.xMin, y], [g.xMax, y]);
    }
    if (g.yLines && def(g.yLineStep)) for (y = g.yMin; y <= g.yMax; y += g.yLineStep) {
        gridLine([g.xMin, y], [g.xMax, y]);
    }
}
function plotxFunction(g, func){
    // style({clipRect: [[g.xMin, g.yMin], [g.xRange, g.yRange]]}); // disabled temporarily because i don't know how to reset the clipRect back to normal afterwards!
        plot(func, [g.xMin, g.xMax], { 'plot-points': 8000 });
    // styleReset();
}
function drawxSide(g) {
    initGridAttributes(g);

    //draw x-axis
    arrow([g.xMin, g.yPos], [g.xMax, g.yPos], g.xArrows);

    //plot function
    if (def(g.plot)){
        if( !Array.isArray(g.plot) ) g.plot = [g.plot];
        for(var i=0; i<g.plot.length; i++) plotxFunction(g, g.plot[i]);
    }

    //draw the big xLabel
    var yBuffer = g.yBuffer * 1.8 * g.xLabelBufferScale * (g.xLabelsAlternate + 1);
    var yCoord = (g.xLabelPos === 'below') ? g.yMin - yBuffer : g.yMax + yBuffer;
    drawLabel(g.xLabel, {
        point: [g.xCenter, yCoord],
    });

    //draw xArrowLabel
    xBuffer = g.xBuffer * 0.9; xCoord = (g.xArrowLabelPosition === 'right') ? g.xMax + xBuffer : g.xMin - xBuffer;
    label([xCoord, g.yPos], g.xArrowLabel);

    //x stuff
    for (var x = g.xMin; x <= g.xMax; x += g.xStep) {
        var labelstring = g.xLabelsSize + g.xLabelsPrefix + insertCommas(roundScalar(x)) + g.xLabelsSuffix;
        if (x < 0) labelstring += '\\hphantom{-}';
        if (g.xLabels
                && (g.xLabelsDrawAll || Math.abs(x - g.xPos) > g.xBuffer / 2)
                && (!g.xLabelsExcludeEnds || Math.min(Math.abs(x-g.xMin),Math.abs(x-g.xMax)) > g.xBuffer / 8)) {
            var y = g.yPos;
            if (g.xLabelsAlternate && (x - g.xMin) / g.xStep % 2 === 0) y -= g.yBuffer * 0.6;
            if (g.xLabelsRotation) {
                var xLabelsRotation = -g.xLabelsRotation;
                yBuffer = g.yBuffer * 0.3, labelOrienter = leftify;
                if (g.xLabelPos === 'above') { yBuffer *= -1; labelOrienter = rightify }
                label([x, y + yBuffer], labelOrienter(labelstring), g.xLabelPos)
                .css('transform', 'rotate('+ xLabelsRotation + 'deg)');
            }
            else { label([x, y], labelstring, g.xLabelPos) }
        }
        if( g.xTicks ) tick( [x, g.yPos - g.yBuffer/5 * g.tickScale], [x, g.yPos + g.yBuffer/5 * g.tickScale] );
        if (g.xLines && !def(g.xLineStep)) gridLine([x, g.yMin], [x, g.yMax]);
    }
    if (g.xLines && def(g.xLineStep)) for (x = g.xMin; x <= g.xMax; x += g.xLineStep) {
        gridLine([x, g.yMin], [x, g.yMax]);
    }
}
function drawGrid(g) {
    //x stuff
    drawxSide(g);
    //y stuff
    drawySide(g);
}
function drawFraction(obj) {
    _.defaults(obj, {
        numerator: 1, denominator: 3,
        image: 'cookie', imageScale: 0.45,
        center: [0, 0], size: 10, start: 0,
        fill: '#47d0de', ringFill: '#00aac1', stroke: 'white', dashed: true, strokeWidth: 3,
    });
    var plate = _.extend({},obj, {
        radius: obj.size, fillOpacity: 1, stroke: null,
    });
    drawCircle(plate);
    var ring = _.extend({},obj, {
        radius: obj.size * 0.65,
        stroke: obj.ringFill, strokeWidth: obj.size * 0.8, dotted: false, dashed: false,
    });
    drawCircle(ring);
    image(obj.image, obj.center, obj.size * 2 * obj.imageScale);
    drawSector(_.extend(plate, {
        start: obj.numerator / obj.denominator * 360 + obj.start,
        end: 0 + obj.start,
    }));
    drawArc(_.extend(ring, {
        start: obj.start + obj.numerator / obj.denominator * 360,
        end: obj.start,
    }));
    for (var i = 0; i < obj.denominator; ++i) drawSegment2(_.extend({},obj, {
        size: null,
        points: [obj.center, add(obj.center, polar(obj.size, i / obj.denominator * 360))],
    }));
}
function drawDotPlot(d) {
    _.defaults(d, { xStep: 1, xLabelBufferScale: 2, colorMedian: false, });

    d.data = d.data.sort(function(a, b) {return a - b});
    d.data = _.map(d.data, function(datum) { return knumber.roundTo(datum, d.xStep)});

    _.defaults(d, {
        xMin: d.data[0] - d.xStep,
        xMax: d.data[d.data.length - 1] + d.xStep,
        xLabels: true, xLabelsDrawAll: true, yLabelsDrawAll: true, xArrows: '<->', xLines: false, yLines: false,
        xLabelsRotation: 0,
        xLabelsPrefix: '',
        xLabelsTex: true,
        stroke: null, strokeOpacity: 1, fill: KhanUtil.BLACK, fillOpacity: 0.6,
    });

    // draw the x and y side
    drawxSide(d);
    if (d.drawySide === true) drawySide(d);

    //plot dots
    var height = 1;
    _.each(d.data, function(datum, i) {
        if (i > 0 && datum === d.data[i - 1]) { ++height }else { height = 1 }
        if (d.colorMedian) {
            var fill = (i < (d.data.length-1)/2)? PINK: (i > (d.data.length-1)/2)? BLUE: BLACK;
            drawPoint({
                point: [datum, height],
                fill: fill, color: fill,
            });
        } else {
            point([datum, height]);
        }
    });
}
function drawHorizontalLegend(l){
    drawRectangle(l);
    l.centerLeft = add(l.bottomLeft, [0, l.HT/2]);
    _.defaults(l, {
        horizontalIncrement: 2,
        horizontalBufferScale: 1,
        linePercentage: 0.3,
        paddingScale: 1,
    });
    var padding = 0.05 * l.paddingScale * Math.min( l.WD, l.HT );
    l.centerLeftPadded = add(l.centerLeft, [padding, 0]);
    _.each(l.labels, function(mylabel, i){
        stroke = def(l.strokes)? (def(l.strokes[i])? l.strokes[i]: BLACK): BLACK;
        strokeDasharray = def(l.strokeDasharrays)? (def(l.strokeDasharrays[i])? l.strokeDasharrays[i]: ""): "";
        drawSegment2({
            points: [
                add(l.centerLeftPadded, [i * l.horizontalIncrement * l.horizontalBufferScale, 0]),
                add(l.centerLeftPadded, [(i+l.linePercentage)*l.horizontalIncrement*l.horizontalBufferScale,0]),
            ],
            stroke: stroke,
            strokeDasharray: strokeDasharray,
        });
        drawLabel({
            point: add(l.centerLeftPadded, [(i+l.linePercentage) * l.horizontalIncrement * l.horizontalBufferScale, 0]),
            label: l.labels[i],
            orientation: 'right',
        });
    });
}
function curlyBraceSuper(start, end, shiftCurly, myLabel, shiftLabel){
    start = add(start, shiftCurly);
    end = add(end, shiftCurly);
    curlyBrace(start, end);
    drawLabel(myLabel, {
        point: add(average(start, end), shiftLabel),
    });
}
function drawBracket(b){
    _.defaults(b, {tickScale: 1});
    drawSegment2(b);
    var vec = times(0.07 * b.tickScale * scales[1]/scales[0], minus(b.points[1], b.points[0]));
    vec = rotate_p_theta(vec, 90);
    for (var i=0; i<2; ++i){
        drawSegment2($.extend( false, b, {points: [minus(b.points[i], vec), add(b.points[i], vec)]} ));
    }
    if( def(b.label) ){
        drawLabel(
            b.label,
            {
                point: average(b.points[0], b.points[1]),
            }
        );
    }
}
function switchRowsAndCols(el){
    var new_el = _.clone(el)
    if( typeof el === 'object'  &&  el !== null  &&  typeof el !== 'string'){
        new_el.rows = el.cols
        new_el.cols = el.rows
    }
    return new_el
}
function array2DFlipped(array2D){
    var row_length = array2D[0].length
    var col_length = array2D.length
    var new_array_2d = new Array(row_length)
    for( var j=0; j < row_length; j++ ){
        new_array_2d[j] = new Array(col_length)
        for( var i=0; i < col_length; i++ ){
            new_array_2d[j][i] = switchRowsAndCols(array2D[i][j])
        }
    }
    return new_array_2d
}
function sum_up_to(index, array){
    return _.reduce(array.slice(0, index), function(a,b){ return a+b }, 0)
}
function drawTable(table){
    // topLeft, WD, HT, rows, cols, data
    _.defaults( table, {flipped: false} )
    if(!def(table.data)) die('you must put a data: array in your table.');
    if(!def(table.cols)) die('you must put specify the number of cols: in your table.');
    if( table.flipped ) table.data = array2DFlipped(table.data)
    var rows = table.data.length;
    _.defaults(table, {topLeft: [0,0], WD: 10, HT: 10});
    var rowHT = table.HT / rows;
    var colWD = table.WD / table.cols;
    for(var r=0; r < rows; r++){
        divTop = def(table.rowHeights)?
            sum_up_to(r, table.rowHeights) / sum_up_to(rows, table.rowHeights) * table.HT:
            table.topLeft[1] + r * rowHT;
        for(var c=0; c < table.data[r].length; c++) if(def(table.data[r][c])){ // draws no box for undefined
            divLeft = def(table.colWidths)?
                sum_up_to(c, table.colWidths) / sum_up_to(table.cols, table.colWidths) * table.WD:
                table.topLeft[0] + c * colWD;
            var divHT = def(table.rowHeights)? table.rowHeights[r] / sum_up_to(rows, table.rowHeights) * table.HT: rowHT;
            var divWD = def(table.colWidths)? table.colWidths[c] : colWD;
            var content = table.data[r][c];
            if(typeof table.data[r][c] === 'object'){
                content = table.data[r][c].content;
                if(def(table.data[r][c].rows)) divHT *= table.data[r][c].rows;
                if(def(table.data[r][c].cols)) divWD *= table.data[r][c].cols;
            }
            // alert('content is :'+content)
            // alert('table is :'+table)
            drawRectangle({
                topLeft: [divLeft, -divTop],
                WD: divWD,
                HT: divHT,
                label: [content, table],
            });
        }
    }
}
function drawHistogram(h) {
    if (typeof h.data[0] === 'number') {
        h.data = _.map( h.data, function(d){ return [d, 1] });
    }
    h.numbars = h.data[0].length-1;
    _.defaults(h, {
        type: 'Histogram',
        xStep: 1, yStep: 1, barWidthScale: (h.numbars > 1)? 0.8: 1, xLines: false,
        barPosition: 'left', // can be 'center' to center bar over label, or 'right'
    });
    var xStep = (def(h.xLineStep))? h.xLineStep: h.xStep;

    h.data.sort(function(a, b) {return a[0] - b[0]}); // sort by x!
    // round x's to step
    _.each( h.data, function(datum,i){ h.data[i][0] = knumber.roundTo(h.data[i][0], xStep) });
    // combine x's of same value
    for (var i=0; i<h.data.length-1;) {
        if (h.data[i][0] === h.data[i+1][0]) {
            h.data[i][1] += h.data[i+1][1];
            h.data.splice(i+1, 1); // splice ( startIndex, length )
        } else {
            i++;
        }
    }
    _.defaults(h, {
        xMin: knumber.roundTo(h.data[0][0], xStep) - xStep,
        xMax: knumber.roundTo(h.data[h.data.length - 1][0], xStep) + xStep,
    });

    h.data.sort(function(a, b) {return a[1] - b[1]}); // sort by y!
    _.defaults(h, {
        yMin: 0,
        yMax: knumber.roundTo(h.data[h.data.length - 1][1], h.yStep) + h.yStep,
    });
    _.defaults(h, {
        stroke: null, strokeOpacity: 1, fillOpacity: 0.7, fills: [GRAY90,GRAY40],
    });
    drawGrid(h);

    h.data.sort(function(a, b) {return a[0] - b[0]}); // sort by x! // necessary to draw in x order for colorMedian
    if( def(h.xLineStep) ) h.xStep = h.xLineStep;
    _drawBars(h);
}
function drawBarGraph(bar) { // 'bar' is a bar graph object
    // use data to figure out x parameters
    // some drawGrid defaults are overridden by drawBar defaults here
    _.defaults(bar, {
        type: 'BarGraph', leftShift: 0,
        // grid stuff
        xMin: 0, xMax: bar.data.length, xStep: 1, xLines: false, xLabels: false, xArrows: '-',
        xPositionOfyAxis: 0, yPositionOfxAxis: 0, xLabelsRotation: 0, yLabelsDrawAll: true,
        xLabelsBufferScale: 1,
        //bar stuff
        xLabelsPrefix: '',
        barWidthScale: 1, barLabelsTex: true, barLabelsRotation: bar.xLabelsRotation,
        stroke: null, strokeOpacity: 1, fill: KhanUtil.BLACK, fillOpacity: 0.6,
        colorMedian: false,
    });
    // draw the grid
    drawGrid(bar);
    // draw the bars
    bar.barLabelsRotation *= -1;
    bar.yBuffer = 0.07 * (bar.yMax - bar.yMin);
    _.each(bar.data, function(datum, x) {
        //label
        if (bar.barLabelsTex) datum[0] = '\\text{' + datum[0] + '}';
        datum[0] = bar.xLabelsSize + bar.xLabelsPrefix + datum[0];
        if (bar.barLabelsRotation) {
            var yBuffer = bar.yBuffer * 0.5 * bar.xLabelsBufferScale;
            label([x + 0.57, bar.yPositionOfxAxis - yBuffer], leftify(datum[0]), 'center', bar.barLabelsTex)
            .css('transform', 'rotate('+ bar.barLabelsRotation + 'deg)');
        }
        else label([x + 0.5, bar.yPositionOfxAxis], datum[0], 'below', bar.barLabelsTex);
    });
    _drawBars(bar);
}
function _drawBars(obj){
    if(obj.colorMedian){
        // setup
        obj.fills = undefined;
        var sumArray = _.pluck( obj.data, 1 );
        var sumBars = _.reduce(  sumArray,  function(a, b){ return a + b; },  0  );
        var sumUpToBar = 0;
        var sumIncludingBar = 0;
    }
    _.each(obj.data, function(datum, x) { // for bars, the index is also the x coordinate
        if(!def(obj.numbars)) obj.numbars = datum.length - 1; // for bar graphs. it seems histograms already defined h.numbars
        var barWidth = obj.xStep * obj.barWidthScale / obj.numbars;
        if(obj.colorMedian) obj.numbars = 1; // for colormedian, only draw first bar (can be changed later)
        for (var i = 1; i <= obj.numbars; ++i) {
            if (def(obj.fills) && $.isArray(obj.fills)) obj.fill = obj.fills[i - 1];
            if( obj.type==='Histogram' ) obj.leftShift = (obj.barPosition==='left')? -obj.xStep/2: (obj.barPosition==='right')? obj.xStep/2: 0;
            if( obj.type==='BarGraph' ) datum[0] = x + 1/2; // for bars, the index is also the x coordinate
            var left = obj.leftShift + datum[0] - barWidth*obj.numbars/2 + (i-1) * barWidth;
            if( obj.colorMedian ){
                // loop part
                sumUpToBar = sumIncludingBar;
                sumIncludingBar += sumArray[x];
                if( sumUpToBar <= sumBars/2 && sumIncludingBar <= sumBars/2 ){
                    drawRectangle(_.extend(obj, {
                        bottomLeft: [left, obj.yPositionOfxAxis],
                        WD: barWidth,
                        HT: abs(datum[i] - obj.yPositionOfxAxis),
                    }, {fill: BLUE} ));
                }
                else if( sumUpToBar >= sumBars/2 && sumIncludingBar >= sumBars/2 ){
                    drawRectangle(_.extend(obj, {
                        bottomLeft: [left, obj.yPositionOfxAxis],
                        WD: barWidth,
                        HT: abs(datum[i] - obj.yPositionOfxAxis),
                    }, {fill: PINK} ));
                }
                else{
                    var percentBlue = (sumBars/2 - sumUpToBar) / sumArray[x];
                    var percentPink = (sumIncludingBar - sumBars/2) / sumArray[x];
                    var heightBlue = abs(datum[i] - obj.yPositionOfxAxis) * percentBlue;
                    var heightPink = abs(datum[i] - obj.yPositionOfxAxis) * percentPink;
                    drawRectangle(_.extend(obj, {
                        bottomLeft: [left, obj.yPositionOfxAxis],
                        WD: barWidth,
                        HT: heightBlue,
                    }, {fill: BLUE} ));
                    drawRectangle(_.extend(obj, {
                        bottomLeft: [left, obj.yPositionOfxAxis + heightBlue],
                        WD: barWidth,
                        HT: heightPink,
                    }, {fill: PINK} ));
                }
            }
            else{
                drawRectangle(_.extend(obj, {
                    bottomLeft: [left, obj.yPositionOfxAxis],
                    WD: barWidth,
                    HT: abs(datum[i] - obj.yPositionOfxAxis),
                }));
            }
        }
    });
}
function drawLegend(h,l){
    if( !def(l) ) die("drawLegend takes in the grid/histogram as the first parameter, then the legend object.");
    if( !def(l.topLeft) ) die("You must provide a topLeft: attribute to legend obj.  Do not use center.")
    _.defaults( l, {
        WD: 10, HT: 10, paddingScale: 1, boxScale: 1, labels: [],
    });
    drawRectangle(_.defaults({},l,{
        stroke: KhanUtil.BLACK, strokeWidth: 2, fill: null, fillOpacity: 1,
    }));
    var side = 2.6 * Math.min( range[0][1]-range[0][0], range[1][1]-range[1][0] );
    var sides = [ side/scales[0]*l.boxScale, side/scales[1]*l.boxScale ];
    var padding = 0.05 * l.paddingScale * Math.min( l.WD, l.HT );
    _.each( l.labels, function(mylabel,i){
        if( def(h.fills) ){
            var r = {
                topLeft: add(l.topLeft,[padding * 5 * sides[0], -padding * 5 * sides[1] - i * 1.5* sides[1]]),
                WD: sides[0], HT: sides[1],
                fill: h.fills[i], fillOpacity: h.fillOpacity, stroke: null,
            };
            if(def(h.fills)) drawRectangle(r);

            solveRectangle(r);
            drawLabel({
                point: add(r.center,[0.5*sides[0],0]),
                text: mylabel,
                orientation: 'right',
            }, l)
        }
        else if( def(l.strokeDasharrays) ){
            var topLeft = add(l.topLeft,[padding * 5 * sides[0], -padding * 5 * sides[1] - i * 1.5* sides[1]]);
            drawSegment2({
                points: [topLeft, add(topLeft, [3*sides[0],0])],
                strokeDasharray: l.strokeDasharrays[i],
            });
            drawLabel({
                point: add(topLeft,[3.5*sides[0],0]),
                text: mylabel,
                orientation: 'right',
            }, l)
        }
    });

}
///////////////////////////////////////////////////////////
function plus(p1, p2){
    var p3 = _.extend([], p1)
    for(var i in p3) p3[i] += p2[i]
    // alert(p1 + "\n" + p2 + "\n" + p3)
    return p3
}
function p(row, col) {
    var x =   col * wd
    var y = - row * ht
    return [x, y]
}

function iddots(point) {
    var slope = ht / wd
    var dx = 1.0
    for( var mult=-1; mult<=1; ++mult ){
        drawPoint({
            point: plus(point, [mult * dx, mult * dx * slope]),
            r: dot_radius / 7.0
        })
    }
}

function generate() {
    for (var row = 0; row < nl; ++row) {
        if (row == nl - 1) {
            label(
                plus(p(row, -row), [-6.85-0.5, 0]),
                "\\text{level } 2k \\longrightarrow")
        } else if (row <= 1) {
            label(
                plus(p(row, -row), [-6.5, 0]),
                "\\text{level }" + row + "\\longrightarrow")
        } else {
            iddots(plus(p(row, -row), [-6.5, 0]))
        }
        for (var col = -row; col <= row; col += 2) {
            drawPoint({
                point: p(row, col),
                r: dot_radius,
                })
        }
    }
}

function drawPath(directions, properties) {
    if (properties === undefined) {
        properties = {}
    }
    points = [p(0, 0)]
    var col = 0
    for (var row = 1; row <= directions.length; ++row) {
        var dir = directions.charAt(row-1)
        switch (dir) {
          case '+':
          case 'r':
          case 'R':
            ++col
            break
          case '-':
          case 'l':
          case 'L':
            --col
            break
          default:
            die("Illegal direction: " + dir)
        }
        points[points.length] = p(row, col)
    }
    drawPolyline(_.extend({
        points: points,
    }, properties))
}

function drawWall(wall) {
    points = wall.points
    wall_copy = _.extend({
        angleLabels: []
        }, wall)
    tl_delta = [-wall_epsilon,  wall_epsilon]
    tr_delta = [ wall_epsilon,  wall_epsilon]
    bl_delta = [-wall_epsilon, -wall_epsilon]
    br_delta = [ wall_epsilon, -wall_epsilon]
    wall_copy.points = [
        plus(points[0], tl_delta),
        plus(points[0], tr_delta),
        plus(points[1], br_delta),
        plus(points[1], bl_delta),
        ]
    drawPolygon(wall_copy)
}

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
/* The X and Y ranges of this canvas */
var range = [[-20.0, 20.0], [-9.5, 10.5]];
/* This variable stretches the x-axis by the factor you put */
var stretch = 1;
/* The output's largest side is limited to this many pixels */
var size = 860;

itemType = 'MC';

var horizontal_spacing = 15.0
var vertical_spacing = horizontal_spacing  // * Math.sqrt(3)
var max_level = 6

var dot_radius = 0.25
var wall_epsilon = dot_radius + horizontal_spacing / 25.0

var num_levels = 1 + max_level

var wd = horizontal_spacing / 2.0
var ht = vertical_spacing / 2.0
var nl = num_levels

var range = [
    [ - wd * (nl + 1), wd * nl],
    [ - ht * nl, ht *  1]
]

setup()
///////////////////////////////////////////////////////////
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */


drawPath('---+--', {stroke: GREEN, strokeWidth: 3})
drawWall({
    points: [p(1, -3), p(nl-2, -3)],
    stroke: PINK, strokeOpacity: 0.3,
})
drawSegment({
    points: [ p(nl-2,-3), p(nl-1,-3) ],
    stroke: PINK, strokeDasharray: "-",
})
drawPoint({
    point: p(nl-2,-3), r: dot_radius,
})
drawCircle({
     center: p(nl-2,-3), radius: 1.5, strokeWidth: 4,
     stroke: BLACK,
})

label( p(nl-0.5,-3),"\\text{reflection line}")




drawWall({
    points: [p(1, -1), p(nl-2, -1)],
    stroke: RED,
})






generate()
