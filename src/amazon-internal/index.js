import Joi from 'joi'
import Amazon from '../amazon/amazon'
import Boom from 'boom'
import async from 'async'
import _ from 'lodash'
import { CronJob } from 'cron'
import data from './data.js'

var pickFieldsDeal = ['dealID', 'description', 'title', 'type']
var pickFieldsItem = ['currentPrice', 'currencyCode', 'dealPrice', 'egressUrl', 'isFulfilledByAmazon', 'itemID', 'merchantName', 'merchantID', 'primaryImage']

module.exports.register = function (server, options, next) {
  var client = server.plugins.amazon.client

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

  next()
}

exports.register.attributes = {
  name: 'amazon-internal',
  version: '1.0.0',
  dependencies: ['amazon']
}
