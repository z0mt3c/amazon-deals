if (process.env.NEW_RELIC_LICENSE_KEY != null) {
  require('newrelic')
}

require('babel-core/register')
var server = require('./server.js')
module.exports = server
