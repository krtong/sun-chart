let today = {
	sun: [],
	temp: []
}

moment().format()

const init = function (lat = '37.8000', lng = '-122.0000', date = moment().add('days', 1).format('YYYY-MM-DD')) {
	let sunArr = Array(97).fill(0);
	let times = {};
	$.ajax({
		"async": true,
		"crossDomain": true,
		"url": `https://sun.p.rapidapi.com/api/sun/?latitude=${lat}&longitude=${lng}&date=${date}`,
		"method": "GET",
		"headers": {
			"x-rapidapi-host": "sun.p.rapidapi.com",
			"x-rapidapi-key": "6d3c1feb20msh822810202791af6p1ebb53jsn5d19af241004"
		}
	}).done(function (response) {
		let results = JSON.parse(response)
		// console.log(results)
		let keyArr = ['dawn', 'sunrise', 'noon', 'dusk', 'sunset'];
		let unixArr = []
		let obj = {};
		let html = ''
		let dayStart = moment(0, "HH").format("X");
		// console.log("dayEnd", dayEnd);
		let daySeconds = 86400;
		let dayMinutes = 1440;
		let dayQuarterHours = 96;
		sunArr[0] = 'data1'
		// console.log("day", day);
		let last = daySeconds;
		results.forEach(a => {
			let key = Object.keys(a)[0];
			let value = Object.values(a)[0];
			let unix = Math.floor((((moment(value).format("X") - dayStart) / 60) - 1440) / 15);
			console.log("key", key, "value", value, "unix", unix)
			unixArr[keyArr.indexOf(key)] = unix
		});
		let sunValues = {
			'dawn': 1,
			'sunrise': 50,
			'noon': 100,
			'dusk': 50,
			'sunset': 1,
		};

		console.log(unixArr)
		keyArr.forEach((a, i) => {
			for (let j = unixArr[i - 1] || 1; j < unixArr[i]; j++) { //391
				sunArr[j + 1] = Math.floor(sunValues[a] / unixArr[i] * j);
				console.log(j, sunArr[j + 1], sunValues[a], unixArr[i], j, i)
			}
		});
		console.log(sunArr);
		// today.sun = sunArr

		var chart = c3.generate({
			bindto: '#graph-here',
			data: {
				columns: [
					sunArr,
					// ['data2', 130, 100, 140, 200, 150, 50, "", "", 1, 1324, 12, 123, 321],
				],
				types: {
					data1: 'area-spline',
					// data2: 'area-spline'
					// 'line', 'spline', 'step', 'area', 'area-step' are also available to stack
				},
				groups: [
					['data1', 'data2']
				]
			}
		});

	});
}

let data = init();
console.log("data", data)

chart = {
	const root = partition(data);
  
	root.each(d => d.current = d);
  
	const svg = d3.create("svg")
		.attr("viewBox", [0, 0, width, width])
		.style("font", "10px sans-serif");
  
	const g = svg.append("g")
		.attr("transform", `translate(${width / 2},${width / 2})`);
  
	const path = g.append("g")
	  .selectAll("path")
	  .data(root.descendants().slice(1))
	  .join("path")
		.attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
		.attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
		.attr("d", d => arc(d.current));
  
	path.filter(d => d.children)
		.style("cursor", "pointer")
		.on("click", clicked);
  
	path.append("title")
		.text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);
  
	const label = g.append("g")
		.attr("pointer-events", "none")
		.attr("text-anchor", "middle")
		.style("user-select", "none")
	  .selectAll("text")
	  .data(root.descendants().slice(1))
	  .join("text")
		.attr("dy", "0.35em")
		.attr("fill-opacity", d => +labelVisible(d.current))
		.attr("transform", d => labelTransform(d.current))
		.text(d => d.data.name);
  
	const parent = g.append("circle")
		.datum(root)
		.attr("r", radius)
		.attr("fill", "none")
		.attr("pointer-events", "all")
		.on("click", clicked);
  
	function clicked(p) {
	  parent.datum(p.parent || root);
  
	  root.each(d => d.target = {
		x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
		x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
		y0: Math.max(0, d.y0 - p.depth),
		y1: Math.max(0, d.y1 - p.depth)
	  });
  
	  const t = g.transiti