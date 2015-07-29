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

server.register({
  register: hapiSwaggered,
  options: {
    cache: false,
    stripPrefix: '/api',
    responseValidation: true,
    tagging: {
      mode: 'path',
      pathLevel: 1
    },
    tags: {
      'foobar/test': 'Example foobar description'
    },
    info: {
      title: 'Amazon Deals',
      description: 'Powered by node, hapi, joi, hapi-swaggered, hapi-swaggered-ui and swagger-ui',
      version: '1.0'
    }
  }
}, {
  select: 'api',
  routes: {
    prefix: '/swagger'
  }
}, function(err) {
  if (err) {
    throw err
  }
})

server.register({
  register: hapiSwaggeredUi,
  options: {
    title: 'Amazon Deals',
    /*
    authorization: {
      field: 'apiKey',
      scope: 'query', // header works as well
      // valuePrefix: 'bearer '// prefix incase
      defaultValue: 'demoKey',
      placeholder: 'Enter your apiKey here'
    },
    */
    swaggerOptions: {
      validatorUrl: null
    }
  }
}, {
  select: 'api',
  routes: {
    prefix: '/docs'
  }
}, function(err) {
  if (err) {
    throw err
  }
})

server.route({
  path: '/',
  method: 'GET',
  handler: function(request, reply) {
    reply.redirect('/docs')
  }
})

server.register({
  register: require('./src'),
  options: {}
}, {
  routes: {
    prefix: '/api'
  }
}, function(error) {
  if (error) {
    throw error
  }
})

export default server