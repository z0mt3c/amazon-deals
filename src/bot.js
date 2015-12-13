var TelegramBot = require('node-telegram-bot-api')
var bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {polling: true})
import { MongoClient } from 'mongodb'
import _ from 'lodash'

console.log('telegram bot active')

bot.onText(/\/start/, function (msg) {
  var fromId = msg.from.id
  bot.sendMessage(fromId, 'Hi, call me amazon-deals! I will notify you about new lightning deals for specific keywords on amazon germany.\n\nYou can control me by the following commands:\n\n/list - list your current keywords\n/add <keyword> - adds new keyword\n/remove <keyword> - removes keyword\n/stop - removes all keywords')
})

var registeredKeywords = []

MongoClient.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/amazon', function (error, db) {
  if (error) {
    throw error
  }

  var keywords = db.collection('keywords')
  keywords.ensureIndex({'client': 1}, function () {})

  var updateKeywords = function () {
    keywords.find({}).toArray(function (error, results) {
      if (error) {
        console.log(error)
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
          bot.sendMessage(fromId, 'Your keywords:\n' + _.map(results, function (item) {
            return '- ' + item.keyword
          }).join('\n'))
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
})

var notifyClient = function (deal, keyword) {
  bot.sendMessage(keyword.client, "Deal-Alert for '" + keyword.keyword + "': " + deal.title + ' for ' + deal.dealPrice + ' ' + deal.currencyCode + ' at ' + deal.egressUrl)
}

module.exports = {
  notify: function (deal) {
    _.each(registeredKeywords, function (keyword) {
      try {
        if (deal && _.contains((deal.title + deal.itemID + deal.dealID).toLowerCase(), keyword.keyword.toLowerCase())) {
          notifyClient(deal, keyword)
        }
      } catch (e) {
        console.log(e)
      }
    })
  }
}
