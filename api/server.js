var http = require('http')
var https = require('https')
var url = require('url')

function fetchRecentlyPlayed(callback) {
  var resData = ''
  var token = 'BQAEgSa9o_-V92V1dHnNMAwy8VkRg5Bhb-Nyfim22RebMglIHJI1YUvUatMu8gYVqBVJ2g5mcumT_HoHAHllFsFPQ0QOf_pL8aL5in6S1FX5aGUEeGm9-HYnnNxQpWdyXNa-dbTngsMqbraXPu6Q'

  const options = {
    hostname: 'api.spotify.com',
    path: '/v1/me/player/recently-played?type=track',
    headers: {'Accept': 'application/json', 'Authorization': 'Bearer ' + token}
  }

  https.get(options, function (response) {
    response.on('data', function(response) {
      resData = resData + response.toString()
    })
    response.on('error', function(err) {
      callback(err, null)
    })
    response.on('end', function() {
      resDataParsed = JSON.parse(resData)
      if (resDataParsed.error) {
        callback(JSON.stringify(resDataParsed.error), null)
      } else {
        callback(null, resData)
      }
    })
  }).on('error', console.error)
}

function filterResults(results) {
  // parse response, create my own JSON object and return that with stringify
  var parsedResults = JSON.parse(results)
  var items = parsedResults.items
  var albums = { albums: [] }
  var lastAlbum = ''

  for (var i = 0; i < parsedResults.items.length; i++) {
    var albumName = parsedResults.items[i].track.album.name
    if (albumName != lastAlbum) {
      albums.albums.push({ name: albumName, artist: parsedResults.items[i].track.album.artists[0].name, link: parsedResults.items[i].track.album.external_urls.spotify, image: parsedResults.items[i].track.album.images[1].url })
    }
    lastAlbum = albumName
  }
  return JSON.stringify(albums)
}

var server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  var request = url.parse(req.url, true)

// here I need to fetch albums from spotify web api and send those as a json blob like this
  var albums =
    { albums: [
      { name: 'La De Da', link: 'https://open.spotify.com/album/52Z2D18gZNzOFDrOd6gv10', image: 'https://i.scdn.co/image/5e0fbac7e47e8c4d7c624d970ae45b00b7e0cf28' },
      { name: 'In Need of Medical Attention', link: 'https://open.spotify.com/album/5w3gRnXGiy4TTMeKatV0Tv', image: 'https://i.scdn.co/image/dc528846b33f690bd12816f978f88e8cce0a091b' }
    ] }

  if (/^\/api\/spotifyhome/.test(req.url)) {
//    fetchSavedAlbums(sendResponse)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(albums))
  } else if (/^\/api\/recentlyplayed/.test(req.url)) {
    fetchRecentlyPlayed(sendResponse)
    function sendResponse(err, recentAlbums) {
      if (err) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(err)
      } else {
        var filteredResults = filterResults(recentAlbums)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(filteredResults)
      }
    }
  }
    else {
    res.writeHead(404)
    res.end()
  }

})

server.listen(8080)
