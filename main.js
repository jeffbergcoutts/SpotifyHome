var xhr = new XMLHttpRequest();
var response;

function getTime() {
  xhr.open("GET", "http://localhost:8080/api/gettime/", false);
  xhr.send();
  response = JSON.parse(xhr.response);
  console.log(response);

  document.getElementById('result').innerHTML = 'Result ' + xhr.status;
  document.getElementById('hours').innerHTML = 'Hours: ' + response.hour;
  document.getElementById('minutes').innerHTML = 'Minutes ' + response.minute;
  document.getElementById('seconds').innerHTML = 'Seconds ' + response.second;
}

function spotifyHome() {
  xhr.open("GET", "http://localhost:8080/api/spotifyhome/", false);
  xhr.send();
  response = JSON.parse(xhr.response);
  console.log(response);

  document.getElementById('album1').innerHTML = '<a href=' + response.album1 + '>' + response.album1 + '</a>';
}
