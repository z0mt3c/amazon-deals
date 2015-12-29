import Fetch from 'isomorphic-fetch'
import Qs from 'qs'
import xrc from 'x-result-count'
import _ from 'lodash'

import {
  SEARCH_SELECT,
  SEARCH_REQUEST,
  SEARCH_INVALIDATE,
  SEARCH_RECEIVE
} from '../constants'

export function invalidateSearch () {
  return {
    type: SEARCH_INVALIDATE
  }
}

export function selectSearch (query) {
  return {
    type: SEARCH_SELECT,
    query
  }
}

export function requestSearch (query) {
  return {
    type: SEARCH_REQUEST,
    query,
    receivedAt: Date.now()
  }
}

export function receiveSearch (query, items, paging) {
  return {
    type: SEARCH_RECEIVE,
    query,
    items,
    paging,
    receivedAt: Date.now()
  }
}

function _fetchSearch (query, skip = 0, limit = 100) {
  return dispatch => {
    dispatch(requestSearch(query))
    let q = Qs.stringify(Object.assign({}, query, { skip, limit }))
    return Fetch(`/api/search?${q}`)
      .then(response => {
        return response.json().then(items => {
          return {
            items,
            query,
            paging: xrc.parse(response.headers.get('x-result-count')),
            // TODO: handel status
            status: response.status
          }
        })
      })
      .then(data => dispatch(receiveSearch(query, data.items, data.paging)))
  }
}

function shouldFetchSearch (state, options) {
  const { fetch } = state.todayApp
  if (!fetch) {
    return true
  } else if (fetch.isFetching) {
    return false
  } else if (!_.isEqual(fetch.query, options)) {
    return true
  } else {
    return fetch.didInvalidate !== false
  }
}

export function fetchSearchIfNeeded (query) {
  return (dispatch, getState) => {
    if (shouldFetchSearch(getState(), query)) {
      return dispatch(_fetchSearch(query))
    }
  }
}

export function fetchSearch (query) {
  return (dispatch, getState) => {
    var { count, skip, total } = getState().searchApp.fetch.paging || { count: 0, skip: 0 }
    if (total == null || count + skip < total) {
      return dispatch(_fetchSearch(query, (count || 0) + (skip || 0)))
    }
  }
}
