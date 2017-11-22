var http = require('http')
var url = require('url')

var server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  var request = url.parse(req.url, true)
  console.log(request)
  if (/^\/api\/gettime/.test(req.url)) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ hour: 10, minute: 20, second: 30 }))
  } else if (/^\/api\/spotifyhome/.test(req.url)) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ album1: 'https://open.spotify.com/album/52Z2D18gZNzOFDrOd6gv10' }))
  }
    else {
    res.writeHead(404)
    res.end()
  }

})

server.listen(8080)
