import Joi from 'joi'
import Amazon from './amazon'
import config from '../config'
import Boom from 'boom'
import async from 'async'
import _ from 'lodash'
import { MongoClient } from 'mongodb'
import assert from 'assert'
import { CronJob } from 'cron'

var amazon = new Amazon(config.amazon)
var pickFields = ['dealID', 'description', 'msToEnd', 'msToFeatureEnd', 'msToStart', 'primeAccessType', 'primeAccessDuration', 'teaser', 'teaserAsin', 'teaserImage', 'title', 'type', 'items']
var pickFieldsDeal = ['dealID', 'description', 'title', 'type']
var pickFieldsItem = ['currentPrice', 'currencyCode', 'dealPrice', 'egressUrl', 'isFulfilledByAmazon', 'itemID', 'merchantName', 'merchantID', 'primaryImage']
var db

MongoClient.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/amazon', function (error, mongodb) {
  assert.equal(null, error)
  db = mongodb
  db.collection('deals').ensureIndex({'prices': 1}, function () {})
  db.collection('deals').ensureIndex({'prices.dealID': 1}, function () {})
  db.collection('deals').ensureIndex({'prices.itemID': 1}, function () {})
  db.collection('deals').ensureIndex({'title': 1}, function () {})
})

var updates = []
var lastUpdate
var keepLastUpdatesCount = 100

var internals = {
  addUpdate(update) {
    if (update) {
      update.time = new Date()
      lastUpdate = update
      updates.push(update)
    }

    if (updates.length > keepLastUpdatesCount) {
      updates = updates.slice(updates.length - keepLastUpdatesCount)
    }
  },
  updateRepository(next) {
    internals.fetch('dealsByType.LIGHTNING_DEAL', function (data) {
      if (!data) {
        return next(null, { status: 'EMPTY' })
      }

      var results = _.reduce(data, function (memo, deal) {
        return _.reduce(deal ? deal.items : [], function (memo, item) {
          if (item && item.dealPrice != null) {
            item = _.extend({ found: new Date() }, _.pick(deal, pickFieldsDeal), _.pick(item, pickFieldsItem))
            memo.push(item)
          }
          return memo
        }, memo)
      }, [])

      var modified = 0
      var inserted = 0

      async.eachLimit(results, 1, function (item, cb) {
        db.collection('deals').findOne({ _id: item.itemID, 'prices.dealID': item.dealID }, {fields: {_id: 1}}, function (error, document) {
          if (!error && document == null) {
            db.collection('deals').update({ _id: item.itemID }, {
              $set: _.pick(item, ['primaryImage', 'egressUrl', 'description', 'title']),
              $addToSet: { prices: item }
            }, { upsert: true, w: 1 }, function (error, result) {
              if (!error) {
                modified += result.result.nModified || 0
                inserted += result.result.upserted ? result.result.upserted.length : 0
              }
              return cb()
            })
          } else {
            return cb()
          }
        })
      }, function () {
        var updateInfo = {
          status: 'OK',
          total: results.length,
          modified: modified,
          inserted: inserted,
          time: new Date()
        }
        internals.addUpdate(updateInfo)
        next(null, updateInfo)
      })
    })
  },
  fetchChunked(fn, items, pageSize, limit, next) {
    var chunks = _.chunk(items, pageSize || 100)

    async.mapLimit(chunks, limit || 1, fn, function (error, results) {
      if (error) {
        return next(error)
      }

      return next(error, _.reduce(results, function (memo, result) {
        _.each(_.keys(result), function (key) {
          if (result[key]) {
            memo[key] = _.extend(memo[key] || {}, result[key])
          }
        })

        return memo
      }, {}))
    })
  },
  fetch(prefix, reply) {
    amazon.getDealsFor(prefix, function (error, data) {
      if (error) {
        return reply(Boom.badImplementation('Error fetching deals', error))
      }
      internals.fetchChunked(amazon.getDeals.bind(amazon), data, 100, 1, function (error, data) {
        if (error) {
          return reply(Boom.badImplementation('Error fetching deals', error))
        }

        var result = _.reduce(data.dealDetails, function (memo, dealDetail) {
          var deal = _.pick(dealDetail, pickFields)
          deal.status = data.dealStatus[dealDetail.dealID]
          memo.push(deal)
          return memo
        }, [])

        result = _.sortBy(result, 'msToStart')
        var replying = reply(result)
        if (replying && _.isFunction(replying.header)) {
          replying.header('x-result-count', result.length)
        }
      })
    })
  }
}

internals.addUpdate({ status: 'initialized' })

var job = new CronJob('30 */9 8-20 * * *', function () {
  internals.updateRepository(function (error, result) {
    console.log(error || result)
  })
}, null, true, 'Europe/Berlin')

module.exports.register = function (plugin, options, next) {
  plugin.route({
    method: 'GET',
    path: '/category',
    config: {
      tags: ['api'],
      handler: function (request, reply) {
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
    path: '/update',
    config: {
      tags: ['api'],
      handler: function (request, reply) {
        internals.updateRepository(function (error, status) {
          reply(error || status)
        })
      }
    }
  })

  plugin.route({
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

        db.collection('deals').find(query).limit(100).toArray(function (error, results) {
          if (error) {
            return reply(Boom.badImplementation('Error fetching deals', error))
          }

          reply(_.map(results, function(item) {
            item.primaryImage = item.primaryImage.substr(39)
            return item
          }))
        })
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/status',
    config: {
      tags: ['api'],
      handler: function (request, reply) {
        var currentDate = new Date()
        var hours = currentDate.getHours()
        var diff = currentDate.getTime() - lastUpdate.time.getTime()
        var reverse = updates.slice(0)
        reverse.reverse()
        reply(reverse).code(hours > 8 && hours < 21 && diff > 3600000 ? 501 : 200)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/internal/deal/category/{categoryId}/deal',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          categoryId: Joi.string().valid(_.pluck(config.categories, 'nodeId'))
        })
      },
      handler: function (request, reply) {
        internals.fetch('dealsByCategory.' + request.params.categoryId, reply)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/internal/deal/state/{state}/deal',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          state: Joi.string().valid(config.dealStates)
        })
      },
      handler: function (request, reply) {
        internals.fetch('dealsByState.' + request.params.state, reply)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/internal/deal/type/{type}/deal',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          type: Joi.string().valid(config.dealTypes)
        })
      },
      handler: function (request, reply) {
        internals.fetch('dealsByType.' + request.params.type, reply)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/internal/deal/accessType/{accessType}/deal',
    config: {
      tags: ['api'],
      validate: {
        params: Joi.object({
          accessType: Joi.string().valid(config.accessTypes)
        })
      },
      handler: function (request, reply) {
        internals.fetch('dealsByAccessType.' + request.params.accessType, reply)
      }
    }
  })

  plugin.route({
    method: 'GET',
    path: '/internal/getDealMetadata',
    config: {
      tags: ['api'],
      handler: function (request, reply) {
        amazon.getDealMetadata(function (error, data) {
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
          dealIds: Joi.array().items(Joi.string()).max(100).meta({
            swaggerType: 'string'
          })
        })
      },
      handler: function (request, reply) {
        amazon.getDeals(request.query.dealIds, function (error, data) {
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
      handler: function (request, reply) {
        amazon.getDealStatus(request.query.dealIds, function (error, data) {
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
