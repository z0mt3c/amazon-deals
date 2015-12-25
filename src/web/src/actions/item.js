import fetch from 'isomorphic-fetch'

import {
  SELECT_ITEM,
  REQUEST_ITEM,
  RECEIVE_ITEM
} from '../constants'

export function selectItem (asin) {
  return {
    type: SELECT_ITEM,
    asin
  }
}

function requestItem (asin) {
  return {
    type: REQUEST_ITEM,
    asin
  }
}

function receiveItem (asin, json) {
  return {
    type: RECEIVE_ITEM,
    asin,
    item: json,
    receivedAt: Date.now()
  }
}

function fetchItem (asin) {
  return dispatch => {
    dispatch(requestItem(asin))
    return fetch(`/api/item/${asin}`)
      .then(response => response.json())
      .then(json => dispatch(receiveItem(asin, json)))
  }
}

function shouldFetchItem (state, asin) {
  const item = state.itemApp.itemByAsin[asin]
  if (!item) {
    return true
  } else if (item.isFetching) {
    return false
  } else {
    return item.didInvalidate
  }
}

export function fetchItemIfNeeded (asin) {
  return (dispatch, getState) => {
    if (shouldFetchItem(getState(), asin)) {
      return dispatch(fetchItem(asin))
    }
  }
}
