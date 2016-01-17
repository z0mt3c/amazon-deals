'use strict'

const Amazon = require('./amazon')
const async = require('async')
const _ = require('lodash')
const moment = require('moment')
const Hoek = require('hoek')
const utils = require('./utils')
const cron = require('cron')
const CronJob = cron.CronJob

const pickForOffer = ['title', 'maxBAmount', 'startsAt', 'endsAt', 'maxCurrentPrice', 'maxDealPrice', 'maxListPrice', 'maxPercentOff', 'maxPrevPrice', 'minBAmount', 'minCurrentPrice', 'minDealPrice', 'minListPrice', 'minPercentOff', 'minPrevPrice', 'type', 'currencyCode']
const pickForItem = ['title', 'teaser', 'teaserImage', 'primaryImage', 'description', 'egressUrl', 'reviewAsin', 'reviewRating', 'totalReviews', 'itemType', 'isFulfilledByAmazon', 'updatedAt']

module.exports.register = function (server, options, next) {
  let deals = server.plugins['hapi-mongodb-profiles'].collection('deals')
  deals.ensureIndex({'prices': 1}, function () {})
  deals.ensureIndex({'prices.dealID': 1}, function () {})
  deals.ensureIndex({'prices.itemID': 1}, function () {})
  deals.ensureIndex({'title': 1}, function () {})

  let items = server.plugins['hapi-mongodb-profiles'].collection('items')

  let offers = server.plugins['hapi-mongodb-profiles'].collection('offers')
  offers.ensureIndex({'startsAt': 1}, function () {})
  offers.ensureIndex({'itemId': 1}, function () {})

  let updates = []
  let lastUpdate
  let keepLastUpdatesCount = 100
  let amazon = new Amazon({})
  server.expose('client', amazon)

  let internals = {
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
        let dealsByCategory = data ? data.dealsByCategory : {}

        _.each(dealsByCategory, function (memo, dealIds, categoryId) {
          _.each(dealIds, function (dealId) {
            return {dealId: dealId, categoryId: categoryId}
          })
        }, [])

        let offerStatus = {
          modified: 0,
          upserted: 0,
          error: 0
        }

        async.forEachOfLimit(dealsByCategory, 1, function (dealIds, categoryId, next) {
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
      query = _.isObject(query) ? query : {minDealPrice: null, startsAt: { $lte: moment().add(10, 'minute').toDate(), $gte: moment().subtract(4, 'hour').toDate() }}
      offers.find(query, { _id: 1, categoryIds: 1 }).limit(5000).toArray(function (error, docs) {
        if (error) {
          server.log(['error', 'offersFind'], error)
        }

        let unknownOffers = _.map(docs, '_id')
        let indexedOffers = _.keyBy(docs, '_id')
        server.log(['info'], 'Processing ' + unknownOffers.length + ' unknown offers')

        let offset = new Date().getTime()
        amazon.fetchChunked(amazon.getDeals.bind(amazon), unknownOffers, 100, 1, function (error, data) {
          if (error) {
            server.log(['error', 'fetchChunked'], error)
          } else if (data == null) {
            server.log(['error', 'empty'], 'Empty data')
          } else if (data.dealDetails == null) {
            server.log(['error', 'empty'], 'Empty deal data')
          }

          let result = _.reduce(data && data.dealDetails ? data.dealDetails : [], function (memo, dealDetail) {
            let deal = dealDetail
            deal.categoryIds = Hoek.reach(indexedOffers[deal.dealID], 'categoryIds') || []
            deal.title = utils.fixChars(deal.title)
            deal.teaser = utils.fixChars(deal.teaser)
            deal.description = utils.fixChars(deal.description)
            deal.status = data.dealStatus[dealDetail.dealID]
            deal.teaserImage = utils.stripHost(deal.teaserImage)
            deal.teaserImage = utils.stripHost(deal.teaserImage)
            deal.primaryImage = utils.stripHost(deal.primaryImage)
            deal.startsAt = moment(offset + deal.msToStart).add(1, 'minute').startOf('minute').toDate()
            deal.endsAt = moment(offset + deal.msToEnd).add(1, 'minute').startOf('minute').toDate()
            deal.updatedAt = new Date()
            memo.push(deal)
            return memo
          }, [])

          server.log(['info'], 'Offer/Item details loaded')

          let offerStatus = {
            modified: 0,
            upserted: 0,
            error: 0
          }

          async.eachLimit(result, 1, function (deal, next) {
            let set = _.pick(deal, pickForOffer)
            set.itemId = deal.impressionAsin || deal.teaserAsin

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

          let articleStatus = {
            modified: 0,
            upserted: 0,
            error: 0
          }

          async.eachLimit(result, 1, function (deal, next) {
            let updateData = _.pick(deal, pickForItem)
            items.update({ _id: deal.impressionAsin || deal.teaserAsin }, { $set: updateData, $addToSet: { categoryIds: { $each: deal.categoryIds } }, $setOnInsert: { createdAt: new Date() } }, { upsert: true }, function (error, r) {
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

  let cronActive = (options.active !== false)

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
        let currentDate = new Date()
        let hours = currentDate.getHours()
        let diff = currentDate.getTime() - lastUpdate.time.getTime()
        let reverse = updates.slice(0)
        reverse.reverse()
        reply(reverse).code(hours > 8 && hours < 21 && diff > 3600000 ? 501 : 200)
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/update/metadata',
    config: {
      auth: 'apikey',
      tags: ['api', 'maintenance'],
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
      auth: 'apikey',
      tags: ['api', 'maintenance'],
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
