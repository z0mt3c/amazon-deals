// import Joi from 'joi'
import Amazon from './amazon'
// import Boom from 'boom'
import async from 'async'
import _ from 'lodash'
import moment from 'moment'
import { CronJob } from 'cron'

module.exports.register = function (server, options, next) {
  var deals = server.plugins['hapi-mongodb-profiles'].collection('deals')
  var items = server.plugins['hapi-mongodb-profiles'].collection('items')
  var offers = server.plugins['hapi-mongodb-profiles'].collection('offers')
  deals.ensureIndex({'prices': 1}, function () {})
  deals.ensureIndex({'prices.dealID': 1}, function () {})
  deals.ensureIndex({'prices.itemID': 1}, function () {})
  deals.ensureIndex({'title': 1}, function () {})
  var updates = []
  var lastUpdate
  var keepLastUpdatesCount = 100
  var amazon = new Amazon({})
  server.expose('client', amazon)

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
    loadMetadata: function () {
      server.log(['info'], 'Loading metadata')
      amazon.getDealMetadata(function (error, data) {
        if (error) {
          server.log(['error', 'getDealMetadata'], error)
        }

        server.log(['info'], 'Updating metadata')
        _.each(data.dealsByCategory, function (memo, dealIds, categoryId) {
          _.each(dealIds, function (dealId) {
            return {dealId: dealId, categoryId: categoryId}
          })
        }, [])

        var offerStatus = {
          modified: 0,
          upserted: 0,
          error: 0
        }

        async.forEachOfLimit(data.dealsByCategory, 1, function (dealIds, categoryId, next) {
          async.eachLimit(dealIds, 1, function (dealId, next) {
            offers.update({_id: dealId}, {$addToSet: {categoryIds: categoryId}}, {upsert: true}, function (err, r) {
              if (err) {
                offerStatus.error += 1
              } else {
                offerStatus.modified += r.result.nModified || 0
                offerStatus.upserted += r.result.upserted ? r.result.upserted.length : 0
              }

              next()
            })
          }, next)
        }, function () {
          server.log(['info', 'update'], { msg: 'Metadata updated', status: offerStatus })
          if ((offerStatus.modified + offerStatus.upserted) > 0) {
            internals.updateOffers({itemId: { $exists: false }})
          }
        })
      })
    },
    updateOffers: function (query) {
      query = _.isObject(query) ? query : {minDealPrice: { $ne: null }, startsAt: { $gt: moment().subtract(10, 'minute'), $lt: moment().add(1, 'hour') }}
      offers.find(query, { _id: 1 }).limit(5000).toArray(function (error, docs) {
        if (error) {
          server.log(['error', 'offersFind'], error)
        }

        var unknownOffers = _.pluck(docs, '_id')
        server.log(['info'], 'Processing ' + unknownOffers.length + ' unknown offers')

        var offset = new Date().getTime()
        amazon.fetchChunked(amazon.getDeals.bind(amazon), unknownOffers, 100, 1, function (error, data) {
          if (error) {
            server.log(['error', 'fetchChunked'], error)
          }

          var result = _.reduce(data.dealDetails, function (memo, dealDetail) {
            var deal = dealDetail
            deal.status = data.dealStatus[dealDetail.dealID]
            memo.push(deal)
            return memo
          }, [])

          server.log(['info'], 'Offer/Item details loaded')

          var offerStatus = {
            modified: 0,
            upserted: 0,
            error: 0
          }

          async.eachLimit(result, 1, function (deal, next) {
            var set = _.pick(deal, ['maxBAmount', 'maxCurrentPrice', 'maxDealPrice', 'maxListPrice', 'maxPercentOff', 'maxPrevPrice', 'minBAmount', 'minCurrentPrice', 'minDealPrice', 'minListPrice', 'minPercentOff', 'minPrevPrice', 'type', 'currencyCode'])
            set.itemId = deal.impressionAsin || deal.teaserAsin
            set.startsAt = deal.startsAt = moment(offset + deal.msToStart).add(1, 'minute').startOf('minute').toDate()
            set.endsAt = deal.endsAt = moment(offset + deal.msToEnd).add(1, 'minute').startOf('minute').toDate()
            offers.updateOne({ _id: deal.dealID }, { $set: set }, function (error, r) {
              if (error) {
                offerStatus.error += 1
              } else {
                offerStatus.modified += r.result.nModified || 0
                offerStatus.upserted += r.result.upserted ? r.result.upserted.length : 0

                if (((r.result.nModified || 0) + (r.result.upserted ? r.result.upserted.length : 0)) > 0) {
                  server.log(['deal'], deal)
                }
              }

              return next()
            })
          }, function () {
            server.log(['info', 'update'], { msg: 'All offers updated', status: offerStatus })
          })

          var articleStatus = {
            modified: 0,
            upserted: 0,
            error: 0
          }

          async.eachLimit(result, 1, function (deal, next) {
            var updateData = _.pick(deal, ['title', 'teaser', 'teaserImage', 'primaryImage', 'description', 'egressUrl', 'reviewAsin', 'reviewRating', 'totalReviews'])
            updateData.updatedAt = new Date()
            items.update({ _id: deal.impressionAsin || deal.teaserAsin }, { $set: updateData, $setOnInsert: { createdAt: new Date() } }, { upsert: true }, function (error, r) {
              if (error) {
                articleStatus.error += 1
              } else {
                articleStatus.modified += r.result.nModified || 0
                articleStatus.upserted += r.result.upserted ? r.result.upserted.length : 0
              }

              return next()
            })
          }, function () {
            server.log(['info', 'update'], { msg: 'All items updated', status: articleStatus })
          })
        })
      })
    }
  }

  var cronActive = (options.active !== false)

  this.jobMeta = new CronJob(options.cronExpressionMeta || '30 */15 8-22 * * *', function () {
    server.log(['info'], 'Trigger loadMetadata')
    internals.loadMetadata()
  }, null, cronActive, 'Europe/Berlin')

  this.jobOffers = new CronJob(options.cronExpressionOffer || '15 */5 8-22 * * *', function () {
    server.log(['info'], 'Trigger updateOffers')
    internals.updateOffers()
  }, null, cronActive, 'Europe/Berlin')

  server.log(['info'], 'Cronjob active: ' + cronActive)

  internals.addUpdate({ status: 'initialized' })

  server.on('log', (event, tags) => {
    if (tags.update) {
      internals.addUpdate(event.data)
    }
  })

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
    path: '/update/metadata',
    config: {
      tags: ['api'],
      handler: function (request, reply) {
        internals.loadMetadata()
        reply('OK')
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/update/offer',
    config: {
      tags: ['api'],
      handler: function (request, reply) {
        internals.updateOffers()
        reply('OK')
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'amazon',
  version: '1.0.0'
}
