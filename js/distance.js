// find distance in km
function computeDistance(startCoords, destCoords) {
  var startLatRads = degreesToRadians(startCoords.latitude);
  var startLongRads = degreesToRadians(startCoords.longitude);
  var destLatRads = degreesToRadians(destCoords.latitude);
  var destLongRads = degreesToRadians(destCoords.longitude);
  console.log(startCoords.latitude + ", " + startCoords.longitude + " " + destCoords.latitude + ", " + destCoords.longitude)
  var Radius = 6371; // radius of the Earth in km
  var distance = Math.acos(Math.sin(startLatRads) * Math.sin(destLatRads) +
  Math.cos(startLatRads) * Math.cos(destLatRads) *
  Math.cos(startLongRads - destLongRads)) * Radius;
  return distance;
}

function degreesToRadians(degrees) {
    var radians = (degrees * Math.PI)/180;
    return radians;
}

// use google maps api because our columbia sites use http
function googleLoc() {
  var xhr = new XMLHttpRequest();
  //xhr.timeout = 4000; 
  xhr.open('POST', "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyC1e6ucAhEkxGUIam1LyfdsXUnMjQTRe8w", false);
  xhr.send();
  if (xhr.status != 200) {
    return false;
  }  

  var response = JSON.parse(xhr.responseText);
  
  return isInRange(response.location.lat, response.location.lng);
}

function isInRange(lat, lng) {
  var userLoc = {latitude: lat, longitude: lng};
  var ps145Loc = {latitude: 40.79909, longitude: -73.96535919999997};
  var dist = computeDistance(userLoc, ps145Loc);
  console.log(dist);
  if (dist < .5) {
    return true;
  }
  return false;
}

// html geolocation not usable for http site
function getLocation() {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
  } else {
      console.log("Geolocation is not supported by this browser.");
  }
}

function showPosition(position) {
    console.log("Latitude: " + position.coords.latitude + 
    "<br>Longitude: " + position.coords.longitude); 
}
