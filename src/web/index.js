var path = require('path')

module.exports.register = function (server, options, next) {
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, './public')
      }
    }
  })

  server.route({
    method: ['GET'],
    path: '/images/{p*}',
    config: {
      handler: {
        proxy: {
          host: 'images-na.ssl-images-amazon.com',
          protocol: 'https',
          passThrough: true
        }
      }
    }
  })

  return next()
}

exports.register.attributes = {
  name: 'web',
  version: '1.0.0',
  dependencies: ['inert', 'vision']
}
