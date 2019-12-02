let coordLocation = "Walnut Creek, California",
  today = moment().format("YYYY-MM-DD"),
  timeValues = {},
  timeZone = "America/Los_Angeles",
  tempresults;

$("#range").val(moment().diff(moment().startOf('year'), "days"));
  
const updateDateTimeLoc = (date = moment(today).format("MMMM D, YYYY")) => $("#range-label").html(
   `<form>
      <div class="form-row row">
        ${date} &nbsp
        <span id="clock-location"></span>
        <span id="location-search">&nbsp
          (<a id="change-location" href="#">${coordLocation}</a>)
        </span>
      </div>
    </form>`);

setInterval(function () {$("#clock-location").text(` ${moment().format("hh:mm:ss a")} `)}, 1000);

//get longitude and latitude based on city name (if anyone realizes you can search diff cities)
const getCoords = function (city = coordLocation, date = today) {
  coordLocation = city;
  $.ajax({
        url: 'https://api.opencagedata.com/geocode/v1/json',
        method: 'GET',
        data: {
          'key': '2f65325b283549d890ef472f0848a337',
          'q': city,
          'no_annotations': 0
          // see other optional params:
          // https://opencagedata.com/api#forward-opt
        },
        dataType: 'json',
        statusCode: {
          200: function(response){  // success
            console.log(response);
            let {lat, lng} = response.results[0].geometry;
            getSunChartData(lat, lng, date)
            coordLocation = response.results[0].formatted;
            // coordLocation = coordLocation.slice(0, coordLocation.lastIndexOf(','));
            $("#location-search").html(`(<a id="change-location" href="#">${coordLocation}</a>)`);

          },
          402: function(){
            console.log('hit free-trial daily limit');
            console.log('become a customer: https://opencagedata.com/pricing');
          }
          // other possible response codes:
          // https://opencagedata.com/api#codes
        }
      });
    }

//get sun times based on lat long and date. 
const getSunChartData = function (lat, lng, date) {
  /*Pretty much from 55-103 needs to be rewritten.
  Sometimes there is no sunset, ciivl dusk or night time 
  eg: Anchorage, AK during summer
  so you cant hardcode midnight as the start/end of nighttime*/
let url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}0&date=${date}`
    $.get({url}).done(function (response) {    
    const str = (t, d = date) => `${d} ${t}`;
    let localResults = response.results;

    // response.Results are UTC+0. Convert times to UTC+-Whateveritssupposedtobe.
    Object.keys(localResults).forEach(a => localResults[a] = moment.tz(str(localResults[a]), timeZone).format('hh:mm a'));

    //Finish off the set, unless you want to flip the chart and use solar array, but i like midnight at the top like a 24h clock.
    localResults['midnight'] = moment(str('00:00')).format('hh:mm a');
    localResults['tomorrow'] = moment(str('23:59')).format('hh:mm a');
    let minuteCount = {
      totalMinutes : 0,
      sliceMinutes: {}
    }
    let newDay = moment()
    //sort of overkill. I just need minutes between start/end so I can make the 1440 minute pie chart, but maybe I'll display times in an overlay.
    const newMoment = (key, start, stop) => {
      [start, stop] = [moment(str(start)), moment(str(stop))]
      let minutes = stop.diff(start, "minutes");
      if (key === 'Before Midnight') minutes = stop.add(1, 'minute').diff(start, "minutes")
      minuteCount.totalMinutes += minutes;
      minuteCount.sliceMinutes[key] = minutes;
      const tempObj = {minutes, start, stop };
      timeValues[key] = tempObj;
    };

    //Get start/stop/minutes for each slice.
    ["After Midnight", "Astronomical Dawn", "Nautical Dawn", "Civil Dawn", "Day", "Civil Dusk", "Nautical Dusk", "Astronomical Dusk", "Before Midnight"]
    .forEach((a, i) => {
      let arr = ['midnight', 'astronomical_twilight_begin', 'nautical_twilight_begin', 'civil_twilight_begin', 'sunrise', 'sunset', 'civil_twilight_end', 'nautical_twilight_end', 'astronomical_twilight_end', 'tomorrow'];
      newMoment(a, localResults[arr[i]], localResults[arr[i + 1]])
    });
    change(suntimeData());
  });

//labels and slice colors for sun chart
const sunTime = d3.scale.ordinal()
  .domain(["After Midnight", "Astronomical Dawn", "Nautical Dawn", "Civil Dawn", "Day", "Civil Dusk", "Nautical Dusk", "Astronomical Dusk", "Before Midnight"])
  .range(['#6b486b', '#7b6888', '#8a89a6', '#98abc5', '#a3bfe7', '#ff8c00', '#d0743c', '#a05d56', '#7b6888', '#6b486b']);

//create d3 svg
const svg = d3.select("body").append("svg").append("g");
const svgAppend = (a) => svg.append("g").attr("class", a);
['slices', 'labels', 'lines'].forEach(a => svgAppend(a));

// svg size
const [width, height] = [950, 450],
  radius = Math.min(width, height) / 2;

svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  
  
const pie = d3.layout.pie()
  .sort(null)
  .value(function (d) {
    return d.value;
  });
  
const key = (d) => d.data.label;

//sun chart size
const chartRadius = (a, b) => d3.svg.arc().outerRadius(radius * a).innerRadius(radius * b);
const sunArc = chartRadius(0.666, 0.333);
const labelArc = chartRadius(0.8, 1);



//populate chart data
const suntimeData = () => sunTime.domain().map(label => {
  return {label, value: timeValues[label].minutes}
});

//transition animation for pie chart changes
const change = function(data) {
  //pie slices
  const slice = svg.select(".slices").selectAll("path.slice").data(pie(data), key);
  slice.enter().insert("path")
    .style("fill", function (d) {
      return sunTime(d.data.label);
    }).attr("class", "slice");

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

 //text labels
  const text = svg.select(".labels").selectAll("text").data(pie(data), key);

  text.enter().append("text").attr("dy", ".35em")
    .text(function (d) {
      return d.data.label;
    });

  const midAngle = (d) => d.startAngle + (d.endAngle - d.startAngle) / 20;

  text.transition().duration(1000)
    .attrTween("transform", function (d) {
      this._current = this._current || d;
      const interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function (t) {
        const d2 = interpolate(t);
        const pos = labelArc.centroid(d2);
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

  //polylines between slices and text
  const polyline = svg.select(".lines").selectAll("polyline").data(pie(data), key);
  polyline.enter().append("polyline");
  polyline.transition().duration(1000)
    .attrTween("points", function (d) {
      this._current = this._current || d;
      const interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function (t) {
        const d2 = interpolate(t);
        const pos = labelArc.centroid(d2);
        pos[0] = radius * .95 * (midAngle(d2) < Math.PI ? 1 : -1);
        return [sunArc.centroid(d2), labelArc.centroid(d2), pos];
      };
    });
  polyline.exit().remove();
};

//initialize
updateDateTimeLoc();
$("#clock-location").text(`${moment().format(" hh:mm:ss a")}`);
getCoords();

//change date
$("#range").on("change", function () {
  const rangeNum = $("#range").val();
  const rangeDate = moment().startOf("year").add(rangeNum, "days");
  today = rangeDate.format("YYYY-MM-DD");
  updateDateTimeLoc(rangeDate.format("MMMM D, YYYY"));
  getCoords(undefined, rangeDate.format("YYYY-MM-DD"));
});

//open location change form
$(document).on("click", "#change-location", function () {
  $("#location-search").html(
    `(<input id="new-coord" class="form-control  type="text" value="${coordLocation}" style="display: inline">)
      <button id="submit-button" type="submit" class="btn btn-primary" style="display:none;"></button>`);
});

//change location
$(document).on("click", "#submit-button", function () {
  event.preventDefault();
  const newCoord = $("#new-coord").val()
  $("#location-search").html(`(<a id="change-location" href="#">${newCoord}</a>)`);
  getCoords(newCoord);
});