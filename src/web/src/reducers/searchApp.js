import { combineReducers } from 'redux'
import {
  SEARCH_SELECT,
  SEARCH_INVALIDATE,
  SEARCH_REQUEST,
  SEARCH_RECEIVE
} from '../constants'

function searchResults (state = {
  isFetching: false,
  didInvalidate: false,
  items: [],
  paging: {}
}, action) {
  switch (action.type) {
    case SEARCH_INVALIDATE:
      return Object.assign({}, state, {
        didInvalidate: true
      })
    case SEARCH_REQUEST:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      })
    case SEARCH_RECEIVE:
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
    case SEARCH_INVALIDATE:
      return Object.assign({}, state, searchResults(undefined, action))

    case SEARCH_REQUEST:
    case SEARCH_RECEIVE:
      return Object.assign({}, state, searchResults(state, action))
  }

  return state
}

function select (state = {}, action) {
  switch (action.type) {
    case SEARCH_SELECT:
      return Object.assign({}, action.query)
  }

  return state
}

const rootReducer = combineReducers({
  fetch,
  select
})

export default rootReducer
