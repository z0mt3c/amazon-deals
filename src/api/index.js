import Joi from 'joi'
import Boom from 'boom'
import _ from 'lodash'
// import config from '../config'
// import async from 'async'
// import { MongoClient } from 'mongodb'
// import assert from 'assert'
// import { CronJob } from 'cron'

module.exports.register = function (server, options, next) {
  var deals = server.plugins['hapi-mongodb-profiles'].collection('deals')

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
        conditions.push({'prices.itemID': q})
        conditions.push({'prices.dealID': q})
        conditions.push({'title': { $regex: q, $options: 'i' }})
        query = { $or: conditions }

        deals.find(query).limit(100).toArray(function (error, results) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(_.map(results, function (item) {
            item.primaryImage = item.primaryImage.substr(39)
            return item
          }))
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
