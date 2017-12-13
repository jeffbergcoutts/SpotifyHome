var xhr = new XMLHttpRequest();
var response;

function getLoggedIn(callback) {
  xhr.open("GET", "http://localhost:8080/api/getloggedin/", true);
  xhr.withCredentials = true;
  xhr.onload = function() {
    response = xhr.response;
    if (response == 'no token') {
      var loginButton = document.getElementById('loginButton');
      loginButton.style.display = 'block';
    } else {
      var loginButton = document.getElementById('loginButton');
      loginButton.style.display = 'none';
    };
    callback();
  };
  xhr.onerror = function () {
    console.error(xhr.statusText);
  };
  xhr.send();
};

function getAlbums() {
  xhr.open("GET", "http://localhost:8080/api/spotifyhome/", true);
  xhr.withCredentials = true;
  xhr.onload = function() {
//    console.log(JSON.parse(xhr.response));
    displayAlbums(JSON.parse(xhr.response));
  };
  xhr.onerror = function () {
    console.error(xhr.statusText);
  };
  xhr.send();
};

function getRecentlyPlayed() {
  xhr.open("GET", "http://localhost:8080/api/recentlyplayed/", true);
  xhr.withCredentials = true;
  xhr.onload = function() {
    displayAlbums(JSON.parse(xhr.response));
  };
  xhr.onerror = function () {
    console.error(xhr.statusText);
  };
  xhr.send();
};

function displayAlbums(response) {
  var albums = response.albums;

  var albumsList = document.getElementById('albums');
  albumsList.innerHTML = '';

  for (var i = 0; i < albums.length; i++) {
    albumsList.innerHTML +=
    '</br><div><p><b>' + albums[i].name + '</b></br> ' + albums[i].artist + '</p>' +
    '<a target="_blank" href=' + albums[i].link + '><img src=' + albums[i].image + ' width=200></a></div>';
  };
};
