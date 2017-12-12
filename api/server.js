require('dotenv').config()

var http = require('http')
var https = require('https')
var url = require('url')
var querystring = require('querystring')
var sessions = require('client-sessions')

var clientID = process.env.CLIENTID
var clientSecret = process.env.CLIENTSECRET
var cookieSecret = process.env.COOKIESECRET

var requestSessionHandler = sessions({
    cookieName: 'authTokens', // cookie name dictates the key name added to the request object
    secret: cookieSecret, // should be a large unguessable string
    duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
    activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
})

function requestToken(code, callback) {

  var postData = querystring.stringify({
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': 'http://localhost:8080/callback',
    'client_id': clientID,
    'client_secret': clientSecret
  })

  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(clientID + ':' + clientSecret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  }

  var resBody = ''

  var req = https.request(options, function(res) {
    console.log('STATUS:' + res.statusCode)
    res.setEncoding('utf8')
    res.on('data', function(chunk) {
      resBody = resBody + chunk
    })
    res.on('end', function() {
      callback(null, JSON.parse(resBody))
    })
  })

  req.on('error', function(err) {
    console.error(err)
  })

  // write data to request body
  req.write(postData)
  req.end()
}

function getNewAccessToken(refreshToken, callback) {
  var postData = querystring.stringify({
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken
  })

  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(clientID + ':' + clientSecret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  }

  var resBody = ''

  var req = https.request(options, function(res) {
    console.log('STATUS:' + res.statusCode)
    res.setEncoding('utf8')
    res.on('data', function(chunk) {
      resBody = resBody + chunk
    })
    res.on('end', function() {
      console.log(resBody)
      callback(resBody)
      // need to store new token in Cookie. need to refrach storeToken so it can exist outside of callback in api
    })
  })

  req.on('error', function(err) {
    console.error(err)
  })

  // write data to request body
  req.write(postData)
  req.end()
}

function fetchRecentlyPlayed(token, callback) {
  var resData = ''
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
      var resDataParsed = JSON.parse(resData)
      if (resDataParsed.error) {
        var errMessage = resDataParsed.error.message
        callback(errMessage, null)
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
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

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
    var token = ''

    requestSessionHandler(req, res, function () {
      token = req.authTokens.accessToken
  //    req.authTokens.refreshToken = refreshToken
    })

    fetchRecentlyPlayed(token, sendResponse)

    function sendResponse(err, recentAlbums) {
      if (err) {
        if (err == 'Invalid access token') {
          console.log('yup')
          var refreshToken = ''
          requestSessionHandler(req, res, function () {
            refreshToken = req.authTokens.refreshToken
            console.log('refreshToken ' + refreshToken)
          })
          getNewAccessToken(refreshToken, fetchRecentlyPlayed)
        }
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(err)
      } else {
        var filteredResults = filterResults(recentAlbums)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(filteredResults)
      }
    }
  } else if (/^\/api\/login/.test(req.url)) {
    res.writeHead(302, {'Location': 'https://accounts.spotify.com/authorize?client_id=' + clientID + '&response_type=code&redirect_uri=http://localhost:8080/callback&scope=user-read-recently-played'})
    res.end()
  } else if (/^\/callback/.test(req.url)) {
    var code = request.query.code
    requestToken(code, storeToken)
    function storeToken(err, response) {
      if (err) {
        console.error(err)
      } else {
        requestSessionHandler(req, res, function () {
            req.authTokens.accessToken = response.access_token
            req.authTokens.refreshToken = response.refresh_token
            var expiresIn = response.expires_in * 1000
            var date = new Date()
            req.authTokens.expiryDate = expiresIn + date.getTime()
        })
      }
      res.writeHead(302, {'Location': 'http://localhost:8000'})
      res.end()
    }
  } else if (/^\/api\/getloggedin/.test(req.url)) {
    var accessToken = ''
    var refreshToken = ''
    var expiryDate = ''
    var sendResponse = ''
    requestSessionHandler(req, res, function () {
        accessToken = req.authTokens.accessToken
        refreshToken = req.authTokens.refreshToken
        expiryDate = req.authTokens.expiryDate
    })
    if (accessToken == null) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('no token')
    } else {
      var date = new Date()
      if (date.getTime() < expiryDate) {
        //get new accessToken from refreshToken
        console.log('old: ' + accessToken)
        console.log(refreshToken)
        console.log(expiryDate)
        console.log(date.getTime())
        getNewAccessToken(refreshToken, sendResponse)
      } else {
        console.log('same: ' + accessToken)
        console.log(refreshToken)
        console.log(expiryDate)
        console.log(date.getTime())
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('logged in')
      }
      function sendResponse(response) {
        console.log(response)
//        console.log('new: ' + accessToken)
//        console.log(refreshToken)
//        console.log(expiryDate)
//        console.log(date.getTime())
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('logged in')
      }
    }
  } else {
    res.writeHead(404)
    res.end()
  }

})

server.listen(8080)
