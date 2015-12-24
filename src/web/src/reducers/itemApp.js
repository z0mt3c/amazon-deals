import { combineReducers } from 'redux'
import {
  REQUEST_ITEM,
  RECEIVE_ITEM
} from '../constants'

function item (state = {
  isFetching: false,
  items: []
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

function itemById (state = { }, action) {
  switch (action.type) {
    case RECEIVE_ITEM:
    case REQUEST_ITEM:
      return Object.assign({}, state, {
        [action.id]: item(state[action.id], action)
      })
    default:
      return state
  }
}

const rootReducer = combineReducers({
  itemById
})

export default rootReducer
