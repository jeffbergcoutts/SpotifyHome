var http = require('http')
var url = require('url')

var server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  var request = url.parse(req.url, true)
  console.log(request)

// here I need to fetch albums from spotify web api and send those as a json blob like this
  var albums =
  { albums: [
    { name: 'La De Da', link: 'https://open.spotify.com/album/52Z2D18gZNzOFDrOd6gv10', image: 'https://i.scdn.co/image/5e0fbac7e47e8c4d7c624d970ae45b00b7e0cf28' },
    { name: 'In Need of Medical Attention', link: 'https://open.spotify.com/album/5w3gRnXGiy4TTMeKatV0Tv', image: 'https://i.scdn.co/image/dc528846b33f690bd12816f978f88e8cce0a091b' }
  ] }

  if (/^\/api\/spotifyhome/.test(req.url)) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(albums))
  }
    else {
    res.writeHead(404)
    res.end()
  }

})

server.listen(8080)
