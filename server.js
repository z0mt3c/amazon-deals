import Hapi from 'hapi'
var pkg = require('./package.json')
var server = new Hapi.Server({ debug: { request: ['info', 'error'] } })
server.connection({
  port: process.env.PORT || 5000,
  labels: ['api'],
  router: {
    stripTrailingSlash: false
  },
  routes: {
    json: {
      space: 2
    }
  }
})

server.register([
  {
    register: require('good'),
    options: {
      opsInterval: 1000,
      reporters: [{
        reporter: require('good-console'),
        events: { log: 'info' }
      }]
    }
  },
  require('inert'),
  require('h2o2'),
  require('vision'), {
    register: require('hapi-swaggered'),
    options: {
      cache: false,
      stripPrefix: '/api',
      responseValidation: true,
      tagging: {
        mode: 'tags'
      },
      tags: {},
      info: {
        title: pkg.name,
        description: pkg.description,
        version: pkg.version
      }
    }
  }, {
    register: require('hapi-swaggered-ui'),
    options: {
      title: pkg.name,
      authorization: false,
      path: '/docs',
      swaggerOptions: {
        validatorUrl: null
      }
    }
  }, {
    register: require('hapi-mongodb-profiles'),
    options: {
      profiles: [{
        name: 'main',
        url: process.env.MONGODB_URL || 'mongodb://localhost:27017/amazon',
        options: {}
      }]
    }
  }, {
    register: require('./src/web'),
    options: {}
  }
], {
  select: 'api'
}, function (err) {
  if (err) {
    throw err
  }

  server.register([{
    register: require('./src/api'),
    options: {}
  }, {
    register: require('./src/amazon'),
    options: {
      active: true
    }
  }, {
    register: require('./src/amazon-internal'),
    options: {}
  }, {
    register: require('./src/telegram'),
    options: {
      active: process.env.TELEGRAM_TOKEN != null,
      token: process.env.TELEGRAM_TOKEN
    }
  }], {
    routes: {
      prefix: '/api'
    }
  }, function (error) {
    if (error) {
      throw error
    }
    server.start(function () {
      server.log(['info'], 'Listening at http://localhost:5000')
    })
  })
})

module.exports = server
