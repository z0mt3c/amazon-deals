import React from 'react'
import { render } from 'react-dom'

import { createStore, combineReducers, applyMiddleware } from 'redux'
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import { syncHistory, routeReducer } from 'redux-simple-router'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'

import LayoutApp from './containers/layoutApp'
import SearchApp from './containers/searchApp'
import TodayApp from './containers/todayApp'
import ItemApp from './containers/itemApp'
import NoMatchApp from './containers/noMatchApp'

import * as reducers from './reducers'
const reducer = combineReducers(Object.assign({}, reducers, {
  routing: routeReducer
}))

const reduxRouterMiddleware = syncHistory(browserHistory)
const createStoreWithMiddleware = applyMiddleware(
  reduxRouterMiddleware,
  thunkMiddleware,
  createLogger()
)(createStore)
const store = createStoreWithMiddleware(reducer)

import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

render((
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path='/' component={LayoutApp}>
        <IndexRoute component={TodayApp}/>
        <Route path='today' component={TodayApp}/>
        <Route path='search' component={SearchApp}/>
        <Route path='search/:query' component={SearchApp}/>
        <Route path='item/:asin' component={ItemApp}/>
        <Route path='*' component={NoMatchApp}/>
      </Route>
    </Router>
  </Provider>
), document.getElementById('fly'))
