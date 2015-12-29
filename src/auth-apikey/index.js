import Boom from 'boom'
import Bcrypt from 'bcrypt'

module.exports.register = function (server, options, next) {
  server.auth.scheme('apikey', (server) => {
    return {
      authenticate: function (request, reply) {
        const req = request.raw.req
        const authorization = req.headers.authorization

        if (!authorization) {
          return reply(Boom.unauthorized(null, 'Bearer', options.unauthorizedAttributes))
        }

        const parts = authorization.split(/\s+/)

        if (parts[0].toLowerCase() !== 'bearer') {
          return reply(Boom.unauthorized(null, 'Bearer', options.unauthorizedAttributes))
        }

        if (parts.length !== 2) {
          return reply(Boom.badRequest('Bad HTTP authentication header format', 'Bearer'))
        }

        if (!options.apiKey) {
          return reply(Boom.unauthorized('No api-key configured', 'Bearer', options.unauthorizedAttributes))
        }

        Bcrypt.compare(parts[1], options.apiKey, (error, isValid) => {
          if (!error && isValid === true) {
            return reply.continue({credentials: {}})
          } else if (error) {
            return reply(Boom.unauthorized('Bad api-key', 'Bearer', options.unauthorizedAttributes))
          } else {
            return reply(Boom.unauthorized('Error during api-key validation', 'Bearer', options.unauthorizedAttributes))
          }
        })
      }
    }
  })

  server.auth.strategy('apikey', 'apikey')

  return next()
}

exports.register.attributes = {
  name: 'auth-apikey',
  version: '1.0.0'
}
