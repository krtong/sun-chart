# sun-chart
This project uses free-to-use API's only. Huge thanks to:

https://opencagedata.com/ &

https://sunrise-sunset.org/

This component only usues bootstrap, momentjs, jquery, and D3 (although D3 doesn't always play well with bootstrap, which is why its script tag is below app.js).
No server side. Very vanilla. No design pattern yet, although any more complexity may require it to handle multiple d3 components.
Just sketching things out and trying to learn how to use D3 (god help me). 
UTC time zones are sketchy. I've plugged in some very basic ones, but because time zone abbreviations overlap, I may implement moment-timezones later. 

With that, here's the to do:
1. remove utc obj and just use momentjs-timezones instead. https://momentjs.com/timezone/
2. refactor with some sort of design pattern for better scalability.
3. Add weather as an outer donut around the inner sun donut.
4. Check to see how accurate it is. (ie: go outside more and spend less time on github). 
