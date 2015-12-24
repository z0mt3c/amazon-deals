import fetch from 'isomorphic-fetch'

import {
  REQUEST_ITEM,
  RECEIVE_ITEM
} from '../constants'

function requestItem (id) {
  return {
    type: REQUEST_ITEM,
    id
  }
}

function receiveItem (id, json) {
  return {
    type: RECEIVE_ITEM,
    id,
    item: json,
    receivedAt: Date.now()
  }
}

function fetchItem (id) {
  return dispatch => {
    dispatch(requestItem(id))
    return fetch(`/api/item/${id}`)
      .then(response => response.json())
      .then(json => dispatch(receiveItem(id, json)))
  }
}

function shouldFetchItem (state, id) {
  const item = state.itemApp.itemById[id]
  if (!item) {
    return true
  } else if (item.isFetching) {
    return false
  } else {
    return item.didInvalidate
  }
}

export function fetchItemIfNeeded (id) {
  return (dispatch, getState) => {
    if (shouldFetchItem(getState(), id)) {
      return dispatch(fetchItem(id))
    }
  }
}
