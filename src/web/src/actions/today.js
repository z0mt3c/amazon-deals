import Fetch from 'isomorphic-fetch'
import Qs from 'qs'
import xrc from 'x-result-count'
import _ from 'lodash'

import {
  TODAY_SELECT,
  TODAY_REQUEST,
  TODAY_RECEIVE
} from '../constants'

export function selectToday (query) {
  return {
    type: TODAY_SELECT,
    query
  }
}

export function requestToday (query) {
  return {
    type: TODAY_REQUEST,
    query,
    receivedAt: Date.now()
  }
}

export function receiveToday (query, items, paging) {
  return {
    type: TODAY_RECEIVE,
    query,
    items,
    paging,
    receivedAt: Date.now()
  }
}

function _fetchToday (query, skip = 0, limit = 50) {
  return dispatch => {
    dispatch(requestToday(query))
    let q = Qs.stringify(Object.assign({}, query, { skip, limit }))
    return Fetch(`/api/deals/today?${q}`)
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
      .then(data => dispatch(receiveToday(query, data.items, data.paging)))
  }
}

function shouldFetchToday (state, options) {
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

export function fetchTodayIfNeeded (query) {
  return (dispatch, getState) => {
    if (shouldFetchToday(getState(), query)) {
      return dispatch(_fetchToday(query))
    }
  }
}

export function fetchToday (query) {
  return (dispatch, getState) => {
    var { count, skip, total } = getState().todayApp.fetch.paging || { count: 0, skip: 0 }
    if (total == null || count + skip < total) {
      return dispatch(_fetchToday(query, count + skip))
    }
  }
}
