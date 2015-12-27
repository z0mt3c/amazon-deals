import { combineReducers } from 'redux'
import {
  TODAY_SELECT,
  TODAY_INVALIDATE,
  TODAY_REQUEST,
  TODAY_RECEIVE
} from '../constants'

function todayDeals (state = {
  isFetching: false,
  didInvalidate: false,
  items: [],
  paging: {}
}, action) {
  switch (action.type) {
    case TODAY_INVALIDATE:
      return Object.assign({}, state, {
        didInvalidate: true
      })
    case TODAY_REQUEST:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      })
    case TODAY_RECEIVE:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        query: action.query,
        items: (state.items || []).concat(action.items),
        paging: action.paging,
        lastUpdated: action.receivedAt
      })
    default:
      return state
  }
}

function fetch (state = {}, action) {
  switch (action.type) {
    case TODAY_INVALIDATE:
      console.log(action.type, arguments)
      return Object.assign({}, state, todayDeals(undefined, action))

    case TODAY_REQUEST:
    case TODAY_RECEIVE:
      console.log(action.type, arguments)
      return Object.assign({}, state, todayDeals(state, action))
  }

  return state
}

function select (state = {}, action) {
  switch (action.type) {
    case TODAY_SELECT:
      return Object.assign({}, action.query)
  }

  return state
}

const rootReducer = combineReducers({
  fetch,
  select
})

export default rootReducer
