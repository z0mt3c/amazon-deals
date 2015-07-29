import Wreck from 'wreck'
import _ from 'lodash'
import Hoek from 'hoek'

var wreckOptions = {
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

export default class Amazon {
  constructor(options) {
    this.options = options
  }

  getDealMetadata(next) {
    var url = 'https://www.amazon.de/xa/dealcontent/v2/GetDealMetadata?nocache=' + new Date().getTime()
    var payload = _.extend({
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

    var options = Hoek.applyToDefaults(wreckOptions, this.options.wreck || {})
    options.payload = JSON.stringify(payload)

    Wreck.post(url, options, function (error, res, payload) {
      if (error) {
        return next(error)
      }

      return next(null, payload)
    })
  }

  getDealsFor(prefix, next) {
    this.getDealMetadata(function(error, data) {
      if (error) {
        return next(error)
      }

      var deals = Hoek.reach(data, prefix)
      return next(null, deals)
    })
  }

  getDeals(ids, next) {
    Hoek.assert(!!ids || ids.length < 200, 'Only 200 dealIds per call allowed')
    var url = 'https://www.amazon.de/xa/dealcontent/v2/GetDeals?nocache=' + new Date().getTime()
    var dealTargets = _.map(ids, function(id) { return { dealID: id }; })
    var payload = _.extend({
      dealTargets: dealTargets,
      responseSize: 'ALL',
      itemResponseSize: 'NONE'
    }, _.pick(this.options, ['requestMetadata']))

    var options = Hoek.applyToDefaults(wreckOptions, this.options.wreck || {})
    options.payload = JSON.stringify(payload)

    Wreck.post(url, options, function (error, res, payload) {
      if (error) {
        return next(error)
      }

      return next(null, payload)
    })
  }

  getDealStatus(ids, next) {
    Hoek.assert(!!ids || ids.length < 200, 'Only 200 dealIds per call allowed')
    var url = 'https://www.amazon.de/xa/dealcontent/v2/GetDealStatus?nocache=' + new Date().getTime()
    var dealTargets = _.map(ids, function(id) { return { dealID: id, itemIDs: null }; })
    var payload = _.extend({
      dealTargets: dealTargets,
      responseSize: 'STATUS_ONLY',
      itemResponseSize: 'NONE'
    }, _.pick(this.options, ['requestMetadata']))

    var options = Hoek.applyToDefaults(wreckOptions, this.options.wreck || {})
    options.payload = JSON.stringify(payload)

    Wreck.post(url, options, function (error, res, payload) {
      if (error) {
        return next(error)
      }

      return next(null, payload)
    })
  }
}
