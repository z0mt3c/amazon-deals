import Joi from 'joi'
import Boom from 'boom'
import _ from 'lodash'
import moment from 'moment'
import async from 'async'
import xrc from 'x-result-count'
import { stripHost } from '../amazon/utils'

module.exports.register = function (server, options, next) {
  var items = server.plugins['hapi-mongodb-profiles'].collection('items')
  var offers = server.plugins['hapi-mongodb-profiles'].collection('offers')

  server.route({
    method: 'GET',
    path: '/search',
    config: {
      tags: ['api'],
      validate: {
        query: Joi.object({
          q: Joi.string().optional(),
          limit: Joi.number().integer().default(50).optional(),
          skip: Joi.number().integer().default(0).optional(),
          category: Joi.number().integer().optional()
        })
      },
      handler: function (request, reply) {
        var page = { skip: request.query.skip }
        var query = {}

        var q = request.query.q
        var conditions = []
        if (q) {
          conditions.push({_id: q})
          conditions.push({'title': { $regex: q, $options: 'i' }})
        }

        if (conditions.length > 0) {
          query['$or'] = conditions
        }

        if (request.query.category) {
          query.categoryIds = request.query.category + ''
        }

        let find = items.find(query)

        find.count(function (error, total) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          page.total = total

          find.sort({_id: 1})
            .skip(request.query.skip)
            .limit(request.query.limit)
            .toArray(function (error, results) {
              if (error) {
                return reply(Boom.badImplementation('Error fetching deals', error))
              }

              page.count = results.length

              reply(_.map(results, function (item) {
                item.primaryImage = stripHost(item.primaryImage)
                item.teaserImage = stripHost(item.teaserImage)
                return item
              })).header('x-result-count', xrc.generate(page))
            })
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
          q: Joi.string(),
          limit: Joi.number().integer().default(50).optional(),
          skip: Joi.number().integer().default(0).optional(),
          category: Joi.number().integer().optional(),
          since: Joi.date().optional(),
          until: Joi.date().optional()
        })
      },
      handler: function (request, reply) {
        var page = { skip: request.query.skip }
        var since = request.query.since || moment().startOf('day').toDate()
        var until = request.query.until || moment(since).add(1, 'day').startOf('day').toDate()
        var mquery = {
          startsAt: {
            $gte: since,
            $lt: until
          }
        }

        var q = request.query.q
        if (q) {
          let conditions = mquery['$or'] = []
          conditions.push({_id: q})
          conditions.push({itemId: q})
          conditions.push({'title': { $regex: q, $options: 'i' }})
        }

        if (request.query.category) {
          mquery.categoryIds = request.query.category + ''
        }

        var query = offers.find(mquery)
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
