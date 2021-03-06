/* The output's largest side is limited to this many pixels */
var size = 800

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

var horizontal_spacing = 15.0
var vertical_spacing = horizontal_spacing  // * Math.sqrt(3)
// var vertical_spacing = horizontal_spacing
var max_level = 4

var dot_radius = 0.25
var wall_epsilon = dot_radius + horizontal_spacing / 25.0

var num_levels = 1 + max_level

var wd = horizontal_spacing / 2.0
var ht = vertical_spacing / 2.0
var nl = num_levels

var range = [
    [ - wd * nl - 8, wd * nl],
    [ - ht * nl, ht *  1]
]

setup()

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

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
    var delta_x = 1.0
    for( var m=-1; m<=1; ++m ){
        drawPoint({
            point: plus(point, [m*delta_x, m*delta_x * slope]),
            r: dot_radius / 7.0
        })
    }
}

function generate() {
    for (var row = 0; row < nl; ++row) {
        if (row == nl - 1) {
            label(
                plus(p(row, -row), [-6.85, 0]),
                "\\text{level } 2k \\longrightarrow")
        } else if (row <= 1) {
            label(
                plus(p(row, -row), [-5, 0]),
                "\\text{level }" + row + "\\longrightarrow")
        } else {
            iddots(plus(p(row, -row), [-5, 0]))
        }
        for (var col = -row; col <= row; col += 2) {
            drawPoint({
                point: p(row, col),
                r: dot_radius,
                })
        }
    }
}

function drawPolyLine(path) {
    var points = path.points
    var segment = _.extend({}, path)
    for (var i = 1; i < points.length; ++i) {
        segment.points = [points[i-1], points[i]]
        drawSegment(segment)
    }
}

function die(message) {
    alert(message)
    throw message
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
    drawPolyLine(_.extend({
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

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */


drawPath('++--', {stroke: RED, strokeWidth: 5})
drawPath('-+-+', {stroke: GREEN, strokeWidth: 5})
drawPath('+-+-', {stroke: GRAY, strokeWidth: 3})
drawPath('--++', {stroke: ORANGE, strokeWidth: 2})
drawPath('+--+', {stroke: PURPLE, strokeWidth: 1})
drawPath('-++-', {stroke: "yellow", strokeWidth: 1})




generate()

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function setup() {
    var scales = _.map(range, function(extent) {
        return Perseus.Util.scaleFromExtent(extent, size)
    })
    init({range: range, scale: _.min(scales)})
}
