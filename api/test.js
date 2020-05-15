require('dotenv').config()
var querystring = require('querystring')
var https = require('https')

var clientID = process.env.CLIENTID
var clientSecret = process.env.CLIENTSECRET
var refreshToken = process.env.REFRESHTOKEN

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
      // console.log(resBody)
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

getNewAccessToken(refreshToken, printData)
function printData(error, body) {
  console.log(body)
}
