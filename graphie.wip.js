/* The output's largest side is limited to this many pixels */
var size = 800.0

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

var horizontal_spacing = 15.0
var vertical_spacing = horizontal_spacing  // * Math.sqrt(3)
// var vertical_spacing = horizontal_spacing
var max_level = 6
var max_size_of_level_label = (''+max_level).length * 8.0 + 125.0
var dot_radius = 0.25

var wall_epsilon = dot_radius + horizontal_spacing / 25.0

var wd = horizontal_spacing / 2.0
var ht = vertical_spacing / 2.0
var mx = max_level

var top_padding   = wd
var bot_padding   = wd
var left_padding  = ht
var right_padding = ht

var min_grid_x = -wd * mx
var max_grid_x =  wd * mx
var min_grid_y = -ht * mx
var max_grid_y =  ht *  0

var min_x = (min_grid_x * size - max_grid_x * max_size_of_level_label) / (size - max_size_of_level_label)

var range = [
    [min_x      - left_padding, max_grid_x + right_padding],
    [min_grid_y - top_padding,  max_grid_y + bot_padding]
]

setup()

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function plus(p1, p2){
    var p3 = _.extend([], p1)
    for(var i in p3) p3[i] += p2[i]
    return p3
}

function p(row, col) {
    var x =   col * wd
    var y = - row * ht
    return [x, y]
}

function generateLabels() {
    for (var row = 0; row <= mx; ++row) {
        var row_label
        if (row < mx) {
            row_label = "\\text{level }" + row + "\\longrightarrow \\quad"
        } else {
            row_label = "\\text{level } 2k=" + row + "\\longrightarrow \\quad"
        }
        label(p(row, -row),
              row_label + "\\hphantom{" + row_label + "}")
    }
}

function generateGrid() {
    for (var row = 0; row <= mx; ++row) {
        for (var col = -row; col <= row; col += 2) {
            drawPoint({
                point: p(row, col),
                r: dot_radius,
                })
        }
    }
}

function drawPolyline(path) {
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
    drawPolyline({
        points: points,
        stroke: RED,
        })
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

generateLabels()

drawPath('+++-', {stroke: RED})
drawPath('-+-+', {stroke: ORANGE})

drawWall({points: [p(2, -2), p(4, -2)]})

generateGrid()

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function setup() {
    var scales = _.map(range, function(extent) {
        return Perseus.Util.scaleFromExtent(extent, size)
    })
    init({range: range, scale: _.min(scales)})
}
