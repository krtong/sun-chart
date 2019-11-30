

const partition = data => d3.partition()
.size([2 * Math.PI, radius])
(d3.hierarchy(data)
.sum(d => d.value)
.sort((a, b) => b.value - a.value))

const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
const format = d3.format(",d")
const width = 975
const radius = width / 2


const autoBox = function () {
    const {
        x,
        y,
        width,
        height
    } = this.getBBox();
    return [x, y, width, height];
}


const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius / 2)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1 - 1)