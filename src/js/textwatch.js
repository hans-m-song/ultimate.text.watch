var isReady = false;
var isFetching = false;
var callbacks = [];

var temp_unit = {
  f: 0,
  c: 1
};

var style = {
  fuzzy: 0,
  human:   1,
  machine:  2
};
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

function readyCallback(event) {
  isReady = true;
  var callback;
  while (callbacks.length > 0) {
    callback = callbacks.shift();
    callback(event);
  }
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
    "2": weather[settings.weather],
    "6": temp_unit[settings.temp_unit],
    "7": style[settings.text_style]
  };
}

// Takes a JSON message as input.  Sends the message to the watch.
function transmitConfiguration(settings) {
  Pebble.sendAppMessage(settings, function(event) {
  }, logError);
}

function logError(event) {
  console.log('Unable to deliver message with transactionId='+
              event.data.transactionId +' ; Error is'+ event.error.message);
}


function showConfiguration(event) {
    var opts = getOptions();
    var url  = "http://zecoj.github.io/ultimate.text.watch/";
    console.log(opts);
    Pebble.openURL(url + "#options=" + encodeURIComponent(opts));
}

function webviewclosed(event) {
  var resp = event.response;
  console.log('configuration response: '+ resp + ' ('+ typeof resp +')');

  var options = JSON.parse(resp);
  if (typeof options.bluetooth === 'undefined' &&
      typeof options.text_style === 'undefined' &&
      typeof options.text_align === 'undefined' &&
      typeof options.temp_unit === 'undefined' &&
      typeof options.weather === 'undefined') {
    return;
  }

  onReady(function() {
    setOptions(resp);

    var message = prepareConfiguration(resp);
    transmitConfiguration(message);
  });
}

function appmessage(event) {
  if(!isFetching)window.navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
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

Pebble.addEventListener("showConfiguration", showConfiguration);
Pebble.addEventListener("webviewclosed", webviewclosed);
Pebble.addEventListener("appmessage", appmessage);

onReady(function(event) {
  var message = prepareConfiguration(getOptions());
  transmitConfiguration(message);
});