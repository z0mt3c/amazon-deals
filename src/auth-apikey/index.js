'use strict'

const Bcrypt = require('bcrypt')
const AuthBearer = require('hapi-auth-bearer-token')

module.exports.register = function (server, options, next) {
  server.register(AuthBearer, (error) => {
    server.auth.strategy('apikey', 'bearer-access-token', {
      allowQueryToken: true,
      allowMultipleHeaders: false,
      accessTokenName: 'apikey',
      validateFunc: function (token, callback) {
        Bcrypt.compare(token, options.apiKey, (error, isValid) => {
          return callback(error, isValid, { token: token })
        })
      }
    })

    return next(error)
  })
}

exports.register.attributes = {
  name: 'auth-apikey',
  version: '1.0.0'
}
