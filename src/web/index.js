var Path = require('path')

module.exports.register = function (server, options, next) {
  server.route({
    method: 'GET',
    path: '/{param?}',
    handler: {
      file: Path.join(__dirname, './public/index.html')
    }
  })

  server.route({
    method: 'GET',
    path: '/item/{param?}',
    handler: {
      file: Path.join(__dirname, './public/index.html')
    }
  })

  server.route({
    method: 'GET',
    path: '/search/{param?}',
    handler: {
      file: Path.join(__dirname, './public/index.html')
    }
  })

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: Path.join(__dirname, './public')
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/font/{param*}',
    handler: {
      directory: {
        path: Path.join(__dirname, '../../node_modules/materialize-css/font')
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
