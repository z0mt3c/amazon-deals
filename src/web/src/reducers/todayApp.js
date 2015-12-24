import { combineReducers } from 'redux'
import {
  OPTIONS_TODAY,
  INVALIDATE_TODAY,
  REQUEST_TODAY,
  RECEIVE_TODAY
} from '../constants'

function options (options = {}, action) {
  switch (action.type) {
    case OPTIONS_TODAY:
      return action.reddit
    default:
      return options
  }
}

function todayDeals (state = {
  isFetching: false,
  didInvalidate: false,
  items: [],
  page: {}
}, action) {
  switch (action.type) {
    case INVALIDATE_TODAY:
      return Object.assign({}, state, {
        didInvalidate: true
      })
    case REQUEST_TODAY:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      })
    case RECEIVE_TODAY:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.deals,
        page: action.page,
        lastUpdated: action.receivedAt
      })
    default:
      return state
  }
}

function dealsByOptions (state = { }, action) {
  switch (action.type) {
    case INVALIDATE_TODAY:
    case REQUEST_TODAY:
    case RECEIVE_TODAY:
      return Object.assign({}, state, {
        result: todayDeals(undefined, action)
      })
    default:
      return state
  }
}

const rootReducer = combineReducers({
  dealsByOptions,
  options
})

export default rootReducer
