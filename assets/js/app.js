let coordLocation = "Walnut Creek, California";
let timeValues = {}
let today = moment([]).format("YYYY-MM-DD");
let utc = -8;
let timeZones = {
	'HST': -10,
	'AKST':-9,
	'AST': -9,
	'PST': -8,
	'MST': -7,
	'CST': -6,
	'EST': -5,
	'GMT': 0,
	'MISSING': 0,
	'CET': 1,
	'+03': 3,
	'MSK': 3,
	'IST': 5.5,
	'JST': 9,
	'AEDT': 11,
};

$("#range").val(moment().diff(moment().startOf('year'), "days"));

const updateDateTimeLoc = (date = moment(today).format("MMMM D, YYYY")) => $("#range-label").html(`<form><div class="form-row row">${date} &nbsp <span id="clock-location"></span><span id="location-search">&nbsp(<a id="change-location" href="#">${coordLocation}</a>)</span></div></</form>`);
setInterval(function () {
	$("#clock-location").text(` ${moment().format("hh:mm:ss a")} `)
}, 1000);

updateDateTimeLoc();
$("#clock-location").text(`${moment().format(" hh:mm:ss a")}`);

const getCoords = function (city = coordLocation, date = today) {

	$.ajax({
		"async": true,
		"crossDomain": true,
		"url": `https://devru-latitude-longitude-find-v1.p.rapidapi.com/latlon.php?location=${city}`,
		"method": "GET",
		"headers": {
			"x-rapidapi-host": "devru-latitude-longitude-find-v1.p.rapidapi.com",
			"x-rapidapi-key": "6d3c1feb20msh822810202791af6p1ebb53jsn5d19af241004"
		}
	}).done(function (response) {
		console.log(response.Results)
		if (response.Results[0]) {
			let {lat,lon,tzs,name} = response.Results[0]
			utc = timeZones[tzs];
			coordLocation = name;
			init(lat, lon, date);
			$("#location-search").html(`(<a id="change-location" href="#">${coordLocation}</a>)`)
		} else {
			init(null, null, date);
		}
	});
};

getCoords();
const init = function (lat, lng, date) {
	let sunArr = Array(97).fill(0);
	let times = {};
	const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}0&date=${date}`
	$.get({url}).done(function (response) {
		let localResults = response.results
		Object.keys(localResults).forEach(a => {
			localResults[a] = moment(`${date} ${localResults[a]}`).add(utc, 'hours').format('hh:mm a')
		});

		localResults['midnight'] = '00:00:00';
		localResults['tomorrow'] = '24:00:00';

		const newMoment = (key, time, endingTime) => {
			let obj = {};
			obj['start'] = moment(`${date} ${localResults[time]}`);;
			obj['end'] = moment(`${date} ${localResults[endingTime]}`);
			obj['hours'] = obj.end.diff(obj.start, "hours");
			obj['minutes'] = obj.end.diff(obj.start, "minutes");
			obj.start = obj.start.format("hh:mm:ss a");
			obj.end = obj.end.format("hh:mm:ss a");
			timeValues[key] = obj;
		};

		newMoment('After Midnight', 'midnight', 'astronomical_twilight_begin')
		newMoment('Astronomical Dawn', 'astronomical_twilight_begin', 'nautical_twilight_begin');
		newMoment('Nautical Dawn', 'nautical_twilight_begin', 'civil_twilight_begin');
		newMoment('Civil Dawn', 'civil_twilight_begin', 'sunrise')
		newMoment('Day', 'sunrise', 'sunset')
		newMoment('Civil Dusk', 'sunset', 'civil_twilight_end')
		newMoment('Nautical Dusk', 'civil_twilight_end', 'nautical_twilight_end')
		newMoment('Astronomical Dusk', 'nautical_twilight_end', 'astronomical_twilight_end')
		newMoment('Before Midnight', 'astronomical_twilight_end', 'tomorrow')
		change(suntimeData());
	});
};

const svg = d3.select("body").append("svg").append("g")
svg.append("g").attr("class", "slices");
svg.append("g").attr("class", "labels");
svg.append("g").attr("class", "lines");

const width = 960,
	height = 450,
	radius = Math.min(width, height) / 2;

const pie = d3.layout.pie()
	.sort(null)
	.value(function (d) {
		return d.value;
	});

const sunArc = d3.svg.arc()
	.outerRadius(radius * 0.666)
	.innerRadius(radius * 0.333);

const outerArc = d3.svg.arc()
	.innerRadius(radius * 1)
	.outerRadius(radius * 0.8);

svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

const key = function (d) {
	return d.data.label;
};

const sunTime = d3.scale.ordinal()
	.domain(["After Midnight", "Astronomical Dawn", "Nautical Dawn", "Civil Dawn", "Day", "Civil Dusk", "Nautical Dusk", "Astronomical Dusk", "Before Midnight"])
	.range(['#6b486b', '#7b6888', '#8a89a6', '#98abc5', '#a3bfe7', '#ff8c00', '#d0743c', '#a05d56', '#7b6888', '#6b486b']);

const suntimeData = () => {
	const labels = sunTime.domain();
	return labels.map(function (label, idx) {
		return {
			label,
			value: timeValues[label].minutes
		}
	});
};

function change(data) {
	/* ------- PIE SLICES -------*/
	const slice = svg.select(".slices").selectAll("path.slice").data(pie(data), key);
	slice.enter().insert("path")
		.style("fill", function (d) {
			return sunTime(d.data.label);
		})
		.attr("class", "slice");

	slice.transition().duration(1000)
		.attrTween("d", function (d) {
			this._current = this._current || d;
			const interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				return sunArc(interpolate(t));
			};
		});

	slice.exit().remove();

	/* ------- TEXT LABELS -------*/
	const text = svg.select(".labels").selectAll("text").data(pie(data), key);

	text.enter().append("text").attr("dy", ".35em")
		.text(function (d) {
			return d.data.label;
		});

	function midAngle(d) {
		return d.startAngle + (d.endAngle - d.startAngle) / 20;
	};

	text.transition().duration(1000)
		.attrTween("transform", function (d) {
			this._current = this._current || d;
			const interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				const d2 = interpolate(t);
				const pos = outerArc.centroid(d2);
				pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate(" + pos + ")";
			};
		})
		.styleTween("text-anchor", function (d) {
			this._current = this._current || d;
			const interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				const d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start" : "end";
			};
		});

	text.exit().remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/
	const polyline = svg.select(".lines").selectAll("polyline").data(pie(data), key);
	polyline.enter().append("polyline");
	polyline.transition().duration(1000)
		.attrTween("points", function (d) {
			this._current = this._current || d;
			const interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				const d2 = interpolate(t);
				const pos = outerArc.centroid(d2);
				pos[0] = radius * .95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [sunArc.centroid(d2), outerArc.centroid(d2), pos];
			};
		});
	polyline.exit().remove();
};

$("#range").on("change", function () {
	let rangeNum = $("#range").val()
	let rangeDate = moment().startOf("year").add(rangeNum, "days");
	today = rangeDate.format("YYYY-MM-DD")
	updateDateTimeLoc(rangeDate.format("MMMM D, YYYY"))
	getCoords(undefined, rangeDate.format("YYYY-MM-DD"))
});

$(document).on("click", "#change-location", function () {
	let html =
		`(<input id="new-coord" class="form-control  type="text" value="${coordLocation}" style="display: inline">)<button id="submit-button" type="submit" class="btn btn-primary" style="display:none;"></button>
	`
	$("#location-search").html(html)
});

$(document).on("click", "#submit-button", function () {
	event.preventDefault();
	coordLocation = $("#new-coord").val()
	$("#location-search").html(`(<a id="change-location" href="#">${coordLocation}</a>)`)
	getCoords()
});