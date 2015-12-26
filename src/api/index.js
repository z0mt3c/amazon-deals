import Joi from 'joi'
import Boom from 'boom'
import _ from 'lodash'
import moment from 'moment'
// import config from '../config'
import async from 'async'
import xrc from 'x-result-count'
// import { MongoClient } from 'mongodb'
// import assert from 'assert'
// import { CronJob } from 'cron'

module.exports.register = function (server, options, next) {
  var deals = server.plugins['hapi-mongodb-profiles'].collection('deals')
  var items = server.plugins['hapi-mongodb-profiles'].collection('items')
  var offers = server.plugins['hapi-mongodb-profiles'].collection('offers')

  server.route({
    method: 'GET',
    path: '/deals/old',
    config: {
      tags: ['api'],
      validate: {
        query: Joi.object({
          q: Joi.string().required()
        })
      },
      handler: function (request, reply) {
        var query = {}
        var conditions = []
        var q = request.query.q
        conditions.push({_id: q})
        conditions.push({'prices.itemID': q})
        conditions.push({'prices.dealID': q})
        conditions.push({'title': { $regex: q, $options: 'i' }})
        query = { $or: conditions }

        deals.find(query).limit(100).toArray(function (error, results) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(_.map(results, function (item) {
            item.primaryImage = item.primaryImage ? item.primaryImage.substr(39) : null
            return item
          }))
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/deals',
    config: {
      tags: ['api'],
      validate: {
        query: Joi.object({
          q: Joi.string().required()
        })
      },
      handler: function (request, reply) {
        var query = {}
        var conditions = []
        var q = request.query.q
        conditions.push({_id: q})
        conditions.push({'title': { $regex: q, $options: 'i' }})
        query = { $or: conditions }

        items.find(query).limit(100).toArray(function (error, results) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(_.map(results, function (item) {
            item.primaryImage = _.contains(item.primaryImage, 'http') ? item.primaryImage.substr(39) : item.primaryImage
            return item
          }))
        })
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/deals/today',
    config: {
      tags: ['api'],
      validate: {
        query: Joi.object({
          limit: Joi.number().integer().default(5000).optional(),
          skip: Joi.number().integer().default(0).optional(),
          since: Joi.date().optional(),
          until: Joi.date().optional()
        })
      },
      handler: function (request, reply) {
        var page = { skip: request.query.skip }
        var since = request.query.since || moment().startOf('day').toDate()
        var until = request.query.until || moment(since).add(1, 'day').startOf('day').toDate()
        var query = offers.find({
          startsAt: {
            $gte: since,
            $lt: until
          }
        })
        .sort({ startsAt: 1 })

        query.count(function (error, total) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          page.total = total

          query
          .skip(request.query.skip)
          .limit(request.query.limit)
          .toArray(function (error, docs) {
            if (error) {
              return reply(Boom.badImplementation('Error fetching deals', error))
            }

            async.mapLimit(docs, 5, function (offer, next) {
              items.findOne({ _id: offer.itemId }, function (error, item) {
                next(error, _.extend({}, item, { offer: offer }))
              })
            }, function (error, mapped) {
              if (error) {
                return reply(Boom.badImplementation('Error fetching deals', error))
              }

              page.count = docs.length
              return reply(mapped).header('x-result-count', xrc.generate(page))
            })
          })
        })
      }
    }
  })
  server.route({
    method: 'GET',
    path: '/item/{asin}',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          asin: Joi.string().required()
        })
      },
      handler: function (request, reply) {
        const asin = request.params.asin
        items.findOne({ _id: asin }, function (error, item) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching item', error))
          } else if (!item) {
            return reply(Boom.notFound('Item not found'))
          }

          offers.find({ itemId: asin }).sort({ startsAt: 1 }).limit(500).toArray((error, offerList) => {
            if (error) {
              return reply(Boom.badImplementation('Error fetching offers', error))
            }

            reply(Object.assign({}, item, { offers: offerList || [] }))
          })
        })
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'api',
  version: '1.0.0'
}
