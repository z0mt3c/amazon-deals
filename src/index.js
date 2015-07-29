import Joi from 'joi'
import Amazon from './amazon'
import config from '../config'
import Boom from 'boom'
import async from 'async'
import _ from 'lodash'

var amazon = new Amazon(config.amazon)
var pickFields = ['dealID', 'description', 'msToEnd', 'msToFeatureEnd', 'msToStart', 'primeAccessType', 'primeAccessDuration', 'teaser', 'teaserAsin', 'teaserImage', 'title', 'type', 'items']

var internals = {
  fetchChunked(fn, items, pageSize, limit, next) {
      var chunks = _.chunk(items, pageSize ||  200)

      async.mapLimit(chunks, limit || 1, fn, function(error, results) {
        if (error) {
          return next(error)
        }

        return next(error, _.reduce(results, function(memo, result) {
          _.each(_.keys(result), function(key) {
            if (result[key]) {
              memo[key] = _.extend(memo[key] || {}, result[key])
            }
          })

          return memo
        }, {}));
      })
    },
    fetch(prefix, reply) {
      amazon.getDealsFor(prefix, function(error, data) {
        if (error) {
          return reply(Boom.badImplementation('Error fetching deals', error))
        }

        internals.fetchChunked(amazon.getDeals.bind(amazon), data, 200, 1, function(error, data) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          var result = _.reduce(data.dealDetails, function(memo, dealDetail) {
            var deal = _.pick(dealDetail, pickFields)
            deal.status = data.dealStatus[dealDetail.dealID]
            memo.push(deal)
            return memo
          }, [])

          result = _.sortBy(result, 'msToStart')
          reply(result).header('x-result-count', result.length)
        })
      })
    }
}

module.exports.register = function(plugin, options, next) {
  plugin.route({
    method: 'GET',
    path: '/category',
    config: {
      tags: ['api'],
      handler: function(request, reply) {
        reply(config.categories)
      },
      response: {
        modify: true,
        schema: Joi.array().items(Joi.object({
          id: Joi.string(),
          name: Joi.string()
        }).rename('nodeId', 'id').rename('category', 'name'))
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/deal/category/{categoryId}/deal',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          categoryId: Joi.string().valid(_.pluck(config.categories, 'nodeId'))
        })
      },
      handler: function(request, reply) {
        internals.fetch('dealsByCategory.' + request.params.categoryId, reply)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/deal/state/{state}/deal',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          state: Joi.string().valid(config.dealStates)
        })
      },
      handler: function(request, reply) {
        internals.fetch('dealsByState.' + request.params.state, reply)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/deal/type/{type}/deal',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          type: Joi.string().valid(config.dealTypes)
        })
      },
      handler: function(request, reply) {
        internals.fetch('dealsByType.' + request.params.type, reply)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/deal/accessType/{accessType}/deal',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          accessType: Joi.string().valid(config.accessTypes)
        })
      },
      handler: function(request, reply) {
        internals.fetch('dealsByAccessType.' + request.params.accessType, reply)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/internal/getDealMetadata',
    config: {
      tags: ['api'],
      handler: function(request, reply) {
        amazon.getDealMetadata(function(error, data) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(data)
        })
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/internal/getDeals',
    config: {
      tags: ['api'],
      validate: {
        query: Joi.object({
          dealIds: Joi.array().items(Joi.string()).max(200).meta({
            swaggerType: 'string'
          })
        })
      },
      handler: function(request, reply) {
        amazon.getDeals(request.query.dealIds, function(error, data) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(data)
        })
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/internal/getDealStatus',
    config: {
      tags: ['api'],
      validate: {
        query: Joi.object({
          dealIds: Joi.array().items(Joi.string()).meta({
            swaggerType: 'string'
          })
        })
      },
      handler: function(request, reply) {
        amazon.getDealStatus(request.query.dealIds, function(error, data) {
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
  name: 'amazon-lighting',
  version: '1.0.0'
}