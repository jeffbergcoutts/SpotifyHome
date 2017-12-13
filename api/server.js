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

function fetchSavedAlbums(token, callback) {
  var resData = ''
  const options = {
    hostname: 'api.spotify.com',
    path: '/v1/me/albums',
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

function filterResults(results, filter) {
  // parse response, create my own JSON object and return that with stringify
  if (filter == 0) {
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
  } else if (filter == 1) {
    return JSON.stringify(results)
  }
}

var server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  var request = url.parse(req.url, true)

  if (/^\/api\/spotifyhome/.test(req.url)) {
    // SPOTIFY HOME (Album view)

    // Get Access Token from Cookie
    var token = ''
    requestSessionHandler(req, res, function () {
      token = req.authTokens.accessToken
    })

    // Get Recently Played from Spotify API
    fetchSavedAlbums(token, sendResponse)

    // Return filtered album list in JSON format
    function sendResponse(err, recentAlbums) {
      if (err) {
        res.end(err)
      } else {
        var filteredAlbums = filterResults(recentAlbums, 1)
        res.end('here here: ' + filteredAlbums)
      }
    }

  } else if (/^\/api\/recentlyplayed/.test(req.url)) {
    // RECENTLY PLAYED

    // Get Access Token from Cookie
    var token = ''
    requestSessionHandler(req, res, function () {
      token = req.authTokens.accessToken
    })

    // Get Recently Played from Spotify API
    fetchRecentlyPlayed(token, sendResponse)

    // Return filtered album list in JSON format
    function sendResponse(err, recentAlbums) {
      if (err) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(err)
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(filterResults(recentAlbums, 0))
      }
    }

  } else if (/^\/api\/login/.test(req.url)) {
    // LOGIN

    // Redirect to Spotify login page
    res.writeHead(302, {'Location': 'https://accounts.spotify.com/authorize?client_id=' + clientID + '&response_type=code&redirect_uri=http://localhost:8080/callback&scope=user-read-recently-played user-library-read'})
    res.end()

  } else if (/^\/callback/.test(req.url)) {
    // CALLBACK (Endpoint for callback from Spotify login)

    // Get code from response from Spotify and use to request Tokens
    var code = request.query.code
    requestToken(code, storeToken)

    // Store tokens and expiry date in cookie
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
      // Redirect back to home page
      res.writeHead(302, {'Location': 'http://localhost:8000'})
      res.end()
    }
  } else if (/^\/api\/getloggedin/.test(req.url)) {
    // GET LOGGED IN
    // Check for a valid Access Token and requests new one if needed

    var accessToken = ''
    var refreshToken = ''
    var expiryDate = ''
    var date = new Date()

    // get tokens and expiry date from cookie
    requestSessionHandler(req, res, function () {
        accessToken = req.authTokens.accessToken
        refreshToken = req.authTokens.refreshToken
        expiryDate = req.authTokens.expiryDate
    })

    if (accessToken == null) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('no token')
    } else {
      // if token is expired, get new one with refresh token
      if (date.getTime() > expiryDate) {
        getNewAccessToken(refreshToken, storeToken)

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
          res.end('logged in')
        }

      } else {
        res.end('logged in')
      }
    }
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(8080)
