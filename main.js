var xhr = new XMLHttpRequest();
var response;

function getAlbums() {
  xhr.open("GET", "http://localhost:8080/api/spotifyhome/", true);
  xhr.onload = function() {
    displayAlbums(response);
  };
  xhr.onerror = function () {
    console.error(xhr.statusText);
  };
  xhr.send();
};

function getRecentlyPlayed() {
  xhr.open("GET", "http://localhost:8080/api/recentlyplayed/", true);
  xhr.onload = function() {
    displayAlbums(response);
  };
  xhr.onerror = function () {
    console.error(xhr.statusText);
  };
  xhr.send();
};

function displayAlbums() {
  var response = JSON.parse(xhr.response);
  var albums = response.albums

  var albumsList = document.getElementById('albums');
  albumsList.innerHTML = ''

  for (var i = 0; i < albums.length; i++) {
    albumsList.innerHTML +=
    '</br><div><p><b>' + albums[i].name + '</b> ' + albums[i].artist + '</p>' +
    '<a target="_blank" href=' + albums[i].link + '><img src=' + albums[i].image + ' width=200></a></div>';
  };
};
