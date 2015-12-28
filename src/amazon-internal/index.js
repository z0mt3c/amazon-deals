import Joi from 'joi'
import Boom from 'boom'
import _ from 'lodash'
import data from './data.js'
import async from 'async'
import { fixChars } from '../amazon/utils.js'

module.exports.register = function (server, options, next) {
  var client = server.plugins.amazon.client
  var items = server.plugins['hapi-mongodb-profiles'].collection('items')

  server.route({
    method: 'GET',
    path: '/internal/deal/category/{categoryId}/deal',
    config: {
      tags: ['api', 'internal'],
      validate: {
        params: Joi.object({
          categoryId: Joi.string().valid(_.pluck(data.categories, 'nodeId'))
        })
      },
      handler: function (request, reply) {
        client.fetch('dealsByCategory.' + request.params.categoryId, reply)
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/internal/deal/state/{state}/deal',
    config: {
      tags: ['api', 'internal'],
      validate: {
        params: Joi.object({
          state: Joi.string().valid(data.dealStates)
        })
      },
      handler: function (request, reply) {
        client.fetch('dealsByState.' + request.params.state, reply)
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/internal/deal/type/{type}/deal',
    config: {
      tags: ['api', 'internal'],
      validate: {
        params: Joi.object({
          type: Joi.string().valid(data.dealTypes)
        })
      },
      handler: function (request, reply) {
        client.fetch('dealsByType.' + request.params.type, reply)
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/internal/deal/accessType/{accessType}/deal',
    config: {
      tags: ['api', 'internal'],
      validate: {
        params: Joi.object({
          accessType: Joi.string().valid(data.accessTypes)
        })
      },
      handler: function (request, reply) {
        client.fetch('dealsByAccessType.' + request.params.accessType, reply)
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/internal/getDealMetadata',
    config: {
      tags: ['api', 'internal'],
      handler: function (request, reply) {
        client.getDealMetadata(function (error, data) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(data)
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/internal/getDeals',
    config: {
      tags: ['api', 'internal'],
      validate: {
        query: Joi.object({
          dealIds: Joi.array().items(Joi.string()).max(100).meta({
            swaggerType: 'string'
          })
        })
      },
      handler: function (request, reply) {
        client.getDeals(request.query.dealIds, function (error, data) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(data)
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/internal/getDealStatus',
    config: {
      tags: ['api', 'internal'],
      validate: {
        query: Joi.object({
          dealIds: Joi.array().items(Joi.string()).meta({
            swaggerType: 'string'
          })
        })
      },
      handler: function (request, reply) {
        client.getDealStatus(request.query.dealIds, function (error, data) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(data)
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/internal/fixChars',
    config: {
      tags: ['api', 'internal'],
      handler: function (request, reply) {
        items.find({ title: /(Â|Ã|â)/g }, { title: 1 }).toArray(function (error, found) {
          if (error) {
            reply(error)
          }

          async.mapLimit(found, 2, function (item, next) {
            items.update({ _id: item._id }, { $set: { title: fixChars(item.title) } }, function (error, result) {
              return next(null, { title: fixChars(item.title), result: result.result, error: error != null })
            })
          }, function (error, result) {
            reply(error || result)
          })
        })
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'amazon-internal',
  version: '1.0.0',
  dependencies: ['amazon']
}
