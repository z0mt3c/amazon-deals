import { combineReducers } from 'redux'
import {
  REQUEST_ITEM,
  SELECT_ITEM,
  RECEIVE_ITEM
} from '../constants'

function asin (asin = 'none', action) {
  switch (action.type) {
    case SELECT_ITEM:
      return action.asin
    default:
      return asin
  }
}

function item (state = {
  isFetching: false,
  item: {}
}, action) {
  switch (action.type) {
    case REQUEST_ITEM:
      return Object.assign({}, state, {
        isFetching: true
      })
    case RECEIVE_ITEM:
      return Object.assign({}, state, {
        isFetching: false,
        item: action.item,
        lastUpdated: action.receivedAt
      })
    default:
      return state
  }
}

function itemByAsin (state = { }, action) {
  switch (action.type) {
    case RECEIVE_ITEM:
    case REQUEST_ITEM:
      return Object.assign({}, state, {
        [action.asin]: item(state[action.asin], action)
      })
    default:
      return state
  }
}

const rootReducer = combineReducers({
  asin,
  itemByAsin
})

export default rootReducer
