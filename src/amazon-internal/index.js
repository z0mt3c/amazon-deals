import Joi from 'joi'
import Boom from 'boom'
import _ from 'lodash'
import data from './data.js'
import async from 'async'
import { fixChars } from '../amazon/utils.js'
import Bcrypt from 'bcrypt'

module.exports.register = function (server, options, next) {
  var client = server.plugins.amazon.client
  var items = server.plugins['hapi-mongodb-profiles'].collection('items')
  var offers = server.plugins['hapi-mongodb-profiles'].collection('offers')

  server.route({
    method: 'GET',
    path: '/internal/deal/category/{categoryId}/deal',
    config: {
      auth: 'apikey',
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
      auth: 'apikey',
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
      auth: 'apikey',
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
      auth: 'apikey',
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
      auth: 'apikey',
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
      auth: 'apikey',
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
      auth: 'apikey',
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
      auth: 'apikey',
      tags: ['api', 'maintenance'],
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

  server.route({
    method: 'GET',
    path: '/internal/updateCategories',
    config: {
      auth: 'apikey',
      tags: ['api', 'maintenance'],
      handler: function (request, reply) {
        items.find({ categoryIds: { $exists: false } }, { _id: 1 }).toArray(function (error, found) {
          if (error) {
            reply(error)
          }

          async.mapLimit(found, 2, function (item, next) {
            offers.findOne({ itemId: item._id }, { categoryIds: 1 }, function (error, offer) {
              if (error || !offer) {
                return next(null, { item: item, error: error, offer: offer })
              } else {
                var categoryIds = offer.categoryIds || []
                items.update({ _id: item._id }, { $addToSet: { categoryIds: { $each: categoryIds } } }, function (error, result) {
                  return next(null, { itemId: item._id, result: result.result, error: error != null })
                })
              }
            })
          }, function (error, result) {
            reply(error || result)
          })
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/internal/updateOfferTitle',
    config: {
      auth: 'apikey',
      tags: ['api', 'maintenance'],
      handler: function (request, reply) {
        offers.find({ title: { $exists: false } }, { _id: 1, itemId: 1 }).toArray(function (error, found) {
          if (error) {
            reply(error)
          }

          async.mapLimit(found, 2, function (offer, next) {
            items.findOne({ _id: offer.itemId }, { title: 1 }, function (error, item) {
              if (error || !item) {
                return next(null, { item: item, error: error, offer: offer })
              } else {
                offers.update({ _id: offer._id }, { $set: { title: item.title } }, function (error, result) {
                  return next(null, { item: item, offer: offer, result: result.result, error: error != null })
                })
              }
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
