// import Joi from 'joi'
import Amazon from './amazon'
// import Boom from 'boom'
import async from 'async'
import _ from 'lodash'
import { CronJob } from 'cron'

var pickFieldsDeal = ['dealID', 'description', 'title', 'type']
var pickFieldsItem = ['currentPrice', 'currencyCode', 'dealPrice', 'egressUrl', 'isFulfilledByAmazon', 'itemID', 'merchantName', 'merchantID', 'primaryImage']

module.exports.register = function (server, options, next) {
  var deals = server.plugins['hapi-mongodb-profiles'].collection('deals')
  deals.ensureIndex({'prices': 1}, function () {})
  deals.ensureIndex({'prices.dealID': 1}, function () {})
  deals.ensureIndex({'prices.itemID': 1}, function () {})
  deals.ensureIndex({'title': 1}, function () {})

  var updates = []
  var lastUpdate
  var keepLastUpdatesCount = 100
  var amazon = new Amazon({})

  var internals = {
    notify: function notify (deal) {
      server.log([ 'deal' ], deal)
    },
    addUpdate: function addUpdate (update) {
      if (update) {
        update.time = new Date()
        lastUpdate = update
        updates.push(update)
      }

      if (updates.length > keepLastUpdatesCount) {
        updates = updates.slice(updates.length - keepLastUpdatesCount)
      }
    },
    updateRepository: function updateRepository (next) {
      amazon.fetch('dealsByType.LIGHTNING_DEAL', function (data) {
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
          deals.findOne({ _id: item.itemID, 'prices.dealID': item.dealID }, {fields: {_id: 1}}, function (error, document) {
            if (!error && document == null) {
              deals.update({ _id: item.itemID }, {
                $set: _.pick(item, ['primaryImage', 'egressUrl', 'description', 'title']),
                $addToSet: { prices: item }
              }, { upsert: true, w: 1 }, function (error, result) {
                if (!error) {
                  var localModified = result.result.nModified || 0
                  modified += localModified
                  var localInserted = result.result.upserted ? result.result.upserted.length : 0
                  inserted += localInserted

                  if (localModified + localInserted > 0) {
                    internals.notify(item)
                  }
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
    }
  }

  this.job = new CronJob(options.cronExpression || '30 */9 8-22 * * *', function () {
    internals.updateRepository(function (error, result) {
      console.log(error || result)
    })
  }, null, true, 'Europe/Berlin')

  internals.addUpdate({ status: 'initialized' })

  server.route({
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

  server.route({
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

  next()
}

exports.register.attributes = {
  name: 'amazon',
  version: '1.0.0'
}
