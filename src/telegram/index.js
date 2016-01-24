'use strict'

const _ = require('lodash')
const assert = require('assert')
const moment = require('moment')
const TelegramBot = require('node-telegram-bot-api')

let registeredKeywords = []

module.exports.register = function (server, options, next) {
  server.log(['info'], 'Telegram bot active: ' + (options.active !== false))

  if (options.active === false) {
    return next()
  }

  let token = options.token
  assert(token != null, 'Telegram token missing')

  let bot = new TelegramBot(token, {polling: true})
  let keywords = server.plugins['hapi-mongodb-profiles'].collection('keywords')
  keywords.ensureIndex({'client': 1}, function () {})

  bot.onText(/\/start/, function (msg) {
    let fromId = msg.from.id
    bot.sendMessage(fromId, 'Hi, call me amazon-deals! I will notify you about new lightning deals for specific keywords on amazon germany.\n\nYou can control me by the following commands:\n\n/list - list your current keywords\n/add <keyword> - adds new keyword\n/remove <keyword> - removes keyword\n/stop - removes all keywords')
  })

  let updateKeywords = function () {
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
    let fromId = msg.from.id

    keywords
      .find({ client: fromId })
      .limit(100)
      .toArray(function (error, results) {
        if (error) {
          bot.sendMessage(fromId, 'Sorry! Something went wrong! Someone has to fix me!')
        } else if (results && results.length > 0) {
          let list = _.map(results, function (item) {
            return '- ' + item.keyword
          })

          bot.sendMessage(fromId, 'Your keywords:\n' + list.join('\n'))
        } else {
          bot.sendMessage(fromId, 'No keywords registered')
        }
      })
  })

  bot.onText(/\/add (.+)/, function (msg, match) {
    let fromId = msg.from.id
    let keyword = match[1]
    if (keyword == null && keyword.length < 3) {
      bot.sendMessage(fromId, 'Keyword need to have at least 3 characters')
    } else {
      keywords.update({ client: fromId, keyword: keyword }, { client: fromId, keyword: keyword }, { upsert: true }, function (error, object) {
        bot.sendMessage(fromId, error ? 'Sorry! Something went wrong! Someone has to fix me!' : "Will notify you once if anything with '" + keyword + "' appears.")
      })
    }
  })

  bot.onText(/\/remove (.+)/, function (msg, match) {
    let fromId = msg.from.id
    let keyword = match[1]
    if (keyword == null && keyword.length < 3) {
      bot.sendMessage(fromId, 'Keyword need to have at least 3 characters')
    } else {
      keywords.remove({ client: fromId, keyword: keyword }, function (error, object) {
        bot.sendMessage(fromId, error ? 'Sorry! Something went wrong! Someone has to fix me!' : "Stopped watching for '" + keyword + "'.")
      })
    }
  })

  bot.onText(/\/stop/, function (msg) {
    let fromId = msg.from.id
    keywords.remove({ client: fromId }, function (error, object) {
      bot.sendMessage(fromId, error ? 'Sorry! Something went wrong! Someone has to fix me!' : 'Removed all keywords and will not bother you any further.')
    })
  })

  const urlPrefix = process.env.URL_PREFIX || server.info.uri

  let notifyClient = function (deal, keyword) {
    server.log(['info'], 'Sending notifications for ' + deal.title)
    const dealUrl = `${urlPrefix}/item/${deal.impressionAsin}`
    const amazonUrl = deal.egressUrl || `http://www.amazon.de/gp/product/${deal.impressionAsin}`
    const startsAt = moment(deal.startsAt).tz('Europe/Berlin').format('DD.MM.YYYY HH:mm')
    if (deal.minDealPrice != null) {
      bot.sendMessage(keyword.client, "Deal-Alert for '" + keyword.keyword + "'\n" + deal.title + ' for ' + deal.minDealPrice + ' ' + deal.currencyCode + ' starting at ' + startsAt + '\n' + amazonUrl + '\n' + dealUrl)
    } else {
      bot.sendMessage(keyword.client, "Deal-Alert for Keyword '" + keyword.keyword + "'\n" + deal.title + ' starting at ' + startsAt + '\n' + amazonUrl + '\n' + dealUrl)
    }
  }

  let notify = function (deal) {
    let checkList = _.map([deal.dealID, deal.impressionAsin, deal.teaserAsin, deal.teaser], item => _.isString(item) ? item.toLowerCase() : item)
    let checkStr = [deal.title, deal.teaser, deal.description].join(';').toLowerCase()
    _.each(registeredKeywords, function (keyword) {
      try {
        if (deal && (_.includes(checkStr, keyword.keyword.toLowerCase()) || _.includes(checkList, keyword.keyword.toLowerCase()))) {
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
