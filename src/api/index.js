import Joi from 'joi'
import Boom from 'boom'
import _ from 'lodash'
import moment from 'moment'
// import config from '../config'
import async from 'async'
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
      handler: function (request, reply) {
        offers.find({
          startsAt: {
            $gte: moment().startOf('day').toDate(),
            $lt: moment().add(1, 'day').startOf('day').toDate()
          }
        }).sort({ startsAt: 1 }).toArray(function (error, docs) {
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

            return reply(mapped)
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
