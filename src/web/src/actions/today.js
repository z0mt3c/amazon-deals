import fetch from 'isomorphic-fetch'
import Qs from 'qs'
import xrc from 'x-result-count'

import {
  REQUEST_TODAY,
  RECEIVE_TODAY
} from '../constants'

export function requestToday (options) {
  return {
    type: REQUEST_TODAY,
    options
  }
}

function receiveToday (options, deals, page) {
  return {
    type: RECEIVE_TODAY,
    options,
    deals,
    page,
    receivedAt: Date.now()
  }
}

function fetchToday (options) {
  return dispatch => {
    dispatch(requestToday(options))
    let query = Qs.stringify(options)
    return fetch(`/api/deals/today?${query}`)
      .then(response => {
        return response.json().then(body => {
          return {
            body,
            page: xrc.parse(response.headers.get('x-result-count')),
            status: response.status
          }
        })
      })
      .then(data => dispatch(receiveToday(options, data.body, data.page)))
  }
}

function shouldFetchToday (state, options) {
  return true
  /*
  const posts = state.todayApp.postsByReddit[reddit]
  if (!posts) {
    return true
  } else if (posts.isFetching) {
    return false
  } else {
    return posts.didInvalidate
  }
  */
}

export function fetchTodayIfNeeded (options) {
  return (dispatch, getState) => {
    if (shouldFetchToday(getState(), options)) {
      return dispatch(fetchToday(options))
    }
  }
}
