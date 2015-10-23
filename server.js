import Hapi from 'hapi'
import hapiSwaggered from 'hapi-swaggered'
import hapiSwaggeredUi from 'hapi-swaggered-ui'

var server = new Hapi.Server()

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
  require('inert'),
  require('vision'),
  {
    register: require('hapi-swaggered'),
    options: {
      cache: false,
      stripPrefix: '/api',
      responseValidation: true,
      tagging: {
        mode: 'path',
        pathLevel: 1
      },
      tags: {
      },
      info: {
        title: 'Amazon Deals',
        description: 'Powered by node, hapi, joi, hapi-swaggered, hapi-swaggered-ui and swagger-ui',
        version: '1.0'
      }
    }
  },
  {
    register: require('hapi-swaggered-ui'),
    options: {
      title: 'Amazon Deals',
      authorization: false,
      path: '/docs',
      swaggerOptions: {
        validatorUrl: null
      }
    }
  }], {
  select: 'api'
}, function (err) {
  if (err) {
    throw err
  }

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: './public'
      }
    }
  })

  server.register({
    register: require('./src'),
    options: {}
  }, {
    routes: {
      prefix: '/api'
    }
  }, function (error) {
    if (error) {
      throw error
    }
  })
})

export default server
