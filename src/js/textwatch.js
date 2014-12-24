var isReady = false;
var isFetching = false;
var callbacks = [];

var alignment = {
  center: 0,
  left:   1,
  right:  2
};
var weather = {
  off: 0,
  on_15: 15,
  on_30: 30,
  on_60: 59
};


var locationOptions = { "timeout": 150000, "maximumAge": 600000 };

function fetchWeather(latitude, longitude) {
  if (isFetching) {
    console.log("fetchWeather: already fetching, quit");
    return;
  }
  else {

  isFetching = true;
 
  /*
  var lastsync = localStorage.getItem("lastsync");
  var nextsync = Math.floor((new Date).getTime()/1000);
  var syncdiff = nextsync - lastsync;
  console.log("01 lastsync: "+lastsync);
  console.log("01 nextsync: "+nextsync);
  console.log("01 syncdiff: "+syncdiff);
  if ((nextsync - lastsync) < 600) {
  console.log("no need to sync");
    return;
  }
  */

  var response;
  var req = new XMLHttpRequest();
  req.open('GET', "http://api.openweathermap.org/data/2.5/find?" +
             "lat=" + latitude + "&lon=" + longitude + "&cnt=1", true);
  req.onload = function(e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        console.log(req.responseText);
        response = JSON.parse(req.responseText);
        var temperatureC, icon, city;
        if (response && response.list && response.list.length > 0) {
          var weatherResult = response.list[0];
          temperatureC = Math.round(weatherResult.main.temp - 273.15);
          //temperatureF = Math.round(1.8 * (weatherResult.main.temp - 273.15) + 32);
          //icon = iconFromWeatherId(weatherResult.weather[0].id);
          icon = weatherResult.weather[0].main;
          city = weatherResult.name;
          //console.log(temperatureF);
          console.log(temperatureC);
          console.log(icon);
          console.log(city);
          Pebble.sendAppMessage({
            "icon":icon,
            "temperatureC":"" + temperatureC+"\u00B0C"
            });
        }
      } else {
        console.log("Error");
      }
    }
  };
  req.send(null);
  isFetching = false;
  }
}

function locationSuccess(pos) {
  var coordinates = pos.coords;
  var datetime = "======= lastsync: " + new Date();
  console.log(datetime);
  fetchWeather(coordinates.latitude, coordinates.longitude);
  //window.navigator.geolocation.clearWatch(locationWatcher);
  
}

function locationError(err) {
  console.warn('location error (' + err.code + '): ' + err.message);
  Pebble.sendAppMessage({
    "icon": "no data",
    "temperatureC":"01234",
  });
}

function readyCallback(event) {
  isReady = true;
  //var callback;
  //while (callbacks.length > 0) {
  //  callback = callbacks.shift();
  //  callback(event);
  //}
  //console.log("connect!" + e.ready);
  window.navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  //console.log(e.type);
}

// Retrieves stored configuration from localStorage.
function getOptions() {
  return localStorage.getItem("options") || ("{}");
}

// Stores options in localStorage.
function setOptions(options) {
  localStorage.setItem("options", options);
}

// Takes a string containing serialized JSON as input.  This is the
// format that is sent back from the configuration web UI.  Produces
// a JSON message to send to the watch face.
function prepareConfiguration(serialized_settings) {
  var settings = JSON.parse(serialized_settings);
  return {
    "0": alignment[settings.text_align],
    "1": settings.bluetooth ? 1 : 0,
    "2": weather[settings.weather]
  };
}

// Takes a JSON message as input.  Sends the message to the watch.
function transmitConfiguration(settings) {
  console.log('sending message: '+ JSON.stringify(settings));
  Pebble.sendAppMessage(settings, function(event) {
    // Message delivered successfully
  }, logError);
}

function logError(event) {
  console.log('Unable to deliver message with transactionId='+
              event.data.transactionId +' ; Error is'+ event.error.message);
}


function showConfiguration(event) {
  //onReady(function() {
    var opts = getOptions();
    //var url  = "http://zecoj.com/pebble/fuzzy.text.shake.html";
    //var url  = "http://cdn.rawgit.com/zecoj/fuzzy.text.shake/gh-pages/index.html";
    var url  = "http://zecoj.github.io/fuzzy.text.shake/";
    console.log(opts);
    Pebble.openURL(url + "#options=" + encodeURIComponent(opts));
  //});
}

function webviewclosed(event) {
  var resp = event.response;
  console.log('configuration response: '+ resp + ' ('+ typeof resp +')');

  var options = JSON.parse(resp);
  if (typeof options.bluetooth === 'undefined' &&
      typeof options.text_align === 'undefined' &&
      typeof options.weather === 'undefined') {
    return;
  }

  onReady(function() {
    setOptions(resp);

    var message = prepareConfiguration(resp);
    transmitConfiguration(message);
  console.log('WEB_bluetooth: '+options.bluetooth);
  });
}

function appmessage(event) {
  window.navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  console.log("message!");
}

function onReady(callback) {
  if (isReady) {
    callback();
  }
  else {
    callbacks.push(callback);
  }
}

Pebble.addEventListener("ready", readyCallback);
Pebble.addEventListener("showConfiguration", showConfiguration);
Pebble.addEventListener("webviewclosed", webviewclosed);
Pebble.addEventListener("appmessage", appmessage);

onReady(function(event) {
  var message = prepareConfiguration(getOptions());
  transmitConfiguration(message);
});