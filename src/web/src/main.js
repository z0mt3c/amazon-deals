import React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute } from 'react-router'
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'

import Layout from './components/Layout'
import Deals from './components/Deals'
import Today from './components/Today'
import Item from './components/Item'
import NoMatch from './components/NoMatch'

import createBrowserHistory from 'history/lib/createBrowserHistory'
// import { createHistory } from 'history'

import { syncReduxAndRouter, routeReducer } from 'redux-simple-router'

// import reducers from '<project-path>/reducers'
const reducers = {}

const reducer = combineReducers(Object.assign({}, reducers, {
  routing: routeReducer
}))
const store = createStore(reducer)
const history = createBrowserHistory()
// const history = createHistory()

syncReduxAndRouter(history, store)

import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

render((
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={Layout}>
        <IndexRoute component={Today}/>
        <Route path="today" component={Today}/>
        <Route path="deals" component={Deals}/>
        <Route path="item/:asin" component={Item}/>
        <Route path="*" component={NoMatch}/>
      </Route>
    </Router>
  </Provider>
), document.getElementById('fly'))
