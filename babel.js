require('babel/register')
var server = require('./server.js')

server.start(function () {
  console.log('started on http://localhost:8000')
})

module.exports = server