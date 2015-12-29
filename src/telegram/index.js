import _ from 'lodash'
import assert from 'assert'
import moment from 'moment'
import TelegramBot from 'node-telegram-bot-api'

var registeredKeywords = []

module.exports.register = function (server, options, next) {
  server.log(['info'], 'Telegram bot active: ' + (options.active !== false))

  if (options.active === false) {
    return next()
  }

  var token = options.token
  assert(token != null, 'Telegram token missing')

  var bot = new TelegramBot(token, {polling: true})
  var keywords = server.plugins['hapi-mongodb-profiles'].collection('keywords')
  keywords.ensureIndex({'client': 1}, function () {})

  bot.onText(/\/start/, function (msg) {
    var fromId = msg.from.id
    bot.sendMessage(fromId, 'Hi, call me amazon-deals! I will notify you about new lightning deals for specific keywords on amazon germany.\n\nYou can control me by the following commands:\n\n/list - list your current keywords\n/add <keyword> - adds new keyword\n/remove <keyword> - removes keyword\n/stop - removes all keywords')
  })

  var updateKeywords = function () {
    keywords.find({}).toArray(function (error, results) {
      if (error) {
        server.log(['info'], error)
      }
      registeredKeywords = results
    })
  }

  setInterval(updateKeywords, 1000 * 60)
  updateKeywords()

  bot.onText(/\/list/, function (msg, match) {
    var fromId = msg.from.id

    keywords
      .find({ client: fromId })
      .limit(100)
      .toArray(function (error, results) {
        if (error) {
          bot.sendMessage(fromId, 'Sorry! Something went wrong! Someone has to fix me!')
        } else if (results && results.length > 0) {
          var list = _.map(results, function (item) {
            return '- ' + item.keyword
          })

          bot.sendMessage(fromId, 'Your keywords:\n' + list.join('\n'))
        } else {
          bot.sendMessage(fromId, 'No keywords registered')
        }
      })
  })

  bot.onText(/\/add (.+)/, function (msg, match) {
    var fromId = msg.from.id
    var keyword = match[1]
    if (keyword == null && keyword.length < 3) {
      bot.sendMessage(fromId, 'Keyword need to have at least 3 characters')
    } else {
      keywords.update({ client: fromId, keyword: keyword }, { client: fromId, keyword: keyword }, { upsert: true }, function (error, object) {
        bot.sendMessage(fromId, error ? 'Sorry! Something went wrong! Someone has to fix me!' : "Will notify you once if anything with '" + keyword + "' appears.")
      })
    }
  })

  bot.onText(/\/remove (.+)/, function (msg, match) {
    var fromId = msg.from.id
    var keyword = match[1]
    if (keyword == null && keyword.length < 3) {
      bot.sendMessage(fromId, 'Keyword need to have at least 3 characters')
    } else {
      keywords.remove({ client: fromId, keyword: keyword }, function (error, object) {
        bot.sendMessage(fromId, error ? 'Sorry! Something went wrong! Someone has to fix me!' : "Stopped watching for '" + keyword + "'.")
      })
    }
  })

  bot.onText(/\/stop/, function (msg) {
    var fromId = msg.from.id
    keywords.remove({ client: fromId }, function (error, object) {
      bot.sendMessage(fromId, error ? 'Sorry! Something went wrong! Someone has to fix me!' : 'Removed all keywords and will not bother you any further.')
    })
  })

  var notifyClient = function (deal, keyword) {
    server.log(['info'], 'Sending notifications for ' + deal.title)
    if (deal.minDealPrice != null) {
      bot.sendMessage(keyword.client, "Deal-Alert for '" + keyword.keyword + "'\n" + deal.title + ' for ' + deal.minDealPrice + ' ' + deal.currencyCode + ' starting at ' + moment(deal.startsAt).tz('Europe/Berlin').format('DD.MM.YYYY HH:mm') + '\n' + deal.egressUrl)
    } else {
      bot.sendMessage(keyword.client, "Deal-Alert for Keyword '" + keyword.keyword + "'\n" + deal.title + ' starting at ' + moment(deal.startsAt).tz('Europe/Berlin').format('DD.MM.YYYY HH:mm') + '\nhttp://www.amazon.de/gp/product/' + deal.impressionAsin)
    }
  }

  var notify = function (deal) {
    var checkMe = [deal.title, deal.teaser, deal.dealID, deal.impressionAsin, deal.teaserAsin, deal.teaser, deal.description].join(';').toLowerCase()
    _.each(registeredKeywords, function (keyword) {
      try {
        if (deal && _.contains(checkMe, keyword.keyword.toLowerCase())) {
          notifyClient(deal, keyword)
        }
      } catch (e) {
        server.log(['info', 'error'], e)
      }
    })
  }

  server.on('log', (event, tags) => {
    if (tags.deal) {
      notify(event.data)
    }
  })

  return next()
}

exports.register.attributes = {
  name: 'telegram',
  version: '1.0.0'
}
