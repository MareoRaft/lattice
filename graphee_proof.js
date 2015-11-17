/* The output's largest side is limited to this many pixels */
var size = 800

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

var unit_width = 15.0
// var unit_height = unit_width * Math.sqrt(3) / 2
var unit_height = unit_width / 2.0
var max_level = 8
var num_levels = 1 + max_level

var wd = unit_width / 2.0
var ht = unit_height
var nl = num_levels

var range = [
    [ - wd * nl, wd * nl],
    [ - ht * nl, ht *  1]
]

setup()

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function p(row, col) {
    var x =   col * wd
    var y = - row * ht
    return [x, y]
}

function generate() {
    for (var row = 0; row < nl; ++row) {
        for (var col = -row; col <= row; col += 2) {
            drawPoint({
                point: p(row, col),
                r: Math.pow(0.5, 2),
            })
        }
    }
}

function drawPolyLine(path) {
    var points = path.points
    for (var i = 1; i < points.length; ++i) {
        var segment = _.clone(path)
        segment.points = [points[i-1], points[i]]
        drawSegment(segment)
    }
}

function die(message) {
    alert(message)
    throw message
}

function drawPath(directions) {
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
    drawPolyLine({
        points: points,
    })
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

generate()

drawPath('+++-')
drawPath('+-+-')
drawPath('----+-')
drawPath('--+-+')

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

function setup() {
    var scales = _.map(range, function(extent) {
        return Perseus.Util.scaleFromExtent(extent, size)
    })
    init({range: range, scale: _.min(scales)})
}
