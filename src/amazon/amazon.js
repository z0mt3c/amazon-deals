'use strict'

const Wreck = require('wreck')
const _ = require('lodash')
const Hoek = require('hoek')
const async = require('async')
const Boom = require('boom')

const wreckOptions = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.107 Safari/537.36'
  },
  timeout: 1000,
  maxBytes: 1048576,
  rejectUnauthorized: true,
  json: true
}

const defaultOptions = {
  requestMetadata: {
    'marketplaceID': 'A1PA6795UKMFR9',
    'clientID': 'goldbox',
    'sessionID': '000-0000000-0000000',
    'customerID': null
  },
  'widgetContext': {
    'pageType': 'GoldBox',
    'subPageType': 'main',
    'deviceType': 'pc',
    'refRID': 'HZ2ZKN9W6QTESYCF4MDT',
    'widgetID': '661465447'
  },
  endpoint: 'https://www.amazon.de/xa/dealcontent/v2',
  pickFields: ['dealID', 'description', 'msToEnd', 'msToFeatureEnd', 'msToStart', 'primeAccessType', 'primeAccessDuration', 'teaser', 'teaserAsin', 'teaserImage', 'title', 'type', 'items']
}

module.exports = class Amazon {
constructor(options) {
  this.options = Hoek.applyToDefaults(defaultOptions, options)
}

getDealMetadata(next) {
  let url = this.options.endpoint + '/GetDealMetadata?nocache=' + new Date().getTime()
  let payload = _.extend({
    page: 1,
    dealsPerPage: 1,
    itemResponseSize: 'NONE',
    queryProfile: {
      featuredOnly: false,
      dealTypes: [
        'LIGHTNING_DEAL'
      ],
      inclusiveTargetValues: [
        { name: 'MARKETING_ID', value: '!norsdl' },
        { name: 'MARKETING_ID', value: '!exclusion' }
      ]
    }
  }, _.pick(this.options, ['requestMetadata', 'widgetContext']))

  let options = Hoek.applyToDefaults(wreckOptions, this.options.wreck || {})
  options.payload = JSON.stringify(payload)

  Wreck.post(url, options, function (error, res, payload) {
    if (error) {
      return next(error)
    }

    return next(null, payload)
  })
}

getDealsFor(prefix, next) {
  this.getDealMetadata(function (error, data) {
    if (error) {
      return next(error)
    }
    let deals = Hoek.reach(data, prefix)
    return next(null, deals)
  })
}

getDeals(ids, next) {
  Hoek.assert(!!ids || ids.length < 100, 'Only 100 dealIds per call allowed')
  let url = this.options.endpoint + '/GetDeals?nocache=' + new Date().getTime()
  let dealTargets = _.map(ids, function (id) {
    return { dealID: id }
  })
  let payload = _.extend({
    dealTargets: dealTargets,
    responseSize: 'ALL',
    itemResponseSize: 'NONE'
  }, _.pick(this.options, ['requestMetadata']))

  let options = Hoek.applyToDefaults(wreckOptions, this.options.wreck || {})
  options.payload = JSON.stringify(payload)

  Wreck.post(url, options, function (error, res, payload) {
    if (error) {
      return next(error)
    }

    return next(null, payload)
  })
}

getDealStatus(ids, next) {
  Hoek.assert(!!ids || ids.length < 100, 'Only 100 dealIds per call allowed')
  let url = this.options.endpoint + '/GetDealStatus?nocache=' + new Date().getTime()
  let dealTargets = _.map(ids, function (id) {
    return { dealID: id, itemIDs: null }
  })

  let payload = _.extend({
    dealTargets: dealTargets,
    responseSize: 'STATUS_ONLY',
    itemResponseSize: 'NONE'
  }, _.pick(this.options, ['requestMetadata']))

  let options = Hoek.applyToDefaults(wreckOptions, this.options.wreck || {})
  options.payload = JSON.stringify(payload)

  Wreck.post(url, options, function (error, res, payload) {
    if (error) {
      return next(error)
    }

    return next(null, payload)
  })
}

fetchChunked(fn, items, pageSize, limit, next) {
  let chunks = _.chunk(items, pageSize || 100)

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
}

fetch(prefix, reply) {
  let self = this
  self.getDealsFor(prefix, function (error, data) {
    if (error) {
      return reply(Boom.badImplementation('Error fetching deals', error))
    }

    self.fetchChunked(self.getDeals.bind(self), data, 100, 1, function (error, data) {
      if (error) {
        return reply(Boom.badImplementation('Error fetching deals', error))
      }

      let result = _.reduce(data.dealDetails, function (memo, dealDetail) {
        let deal = _.pick(dealDetail, self.options.pickFields)
        deal.status = data.dealStatus[dealDetail.dealID]
        memo.push(deal)
        return memo
      }, [])

      result = _.sortBy(result, 'msToStart')
      let replying = reply(result)
      if (replying && _.isFunction(replying.header)) {
        replying.header('x-result-count', result.length)
      }
    })
  })
}
}
