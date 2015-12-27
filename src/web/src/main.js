import React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute } from 'react-router'
import { syncReduxAndRouter } from 'redux-simple-router'
import { Provider } from 'react-redux'

import LayoutApp from './containers/layoutApp'
import SearchApp from './containers/searchApp'
import TodayApp from './containers/todayApp'
import ItemApp from './containers/itemApp'
import NoMatchApp from './containers/noMatchApp'

import configureStore from './utils/configureStore'
const store = configureStore()

import createBrowserHistory from 'history/lib/createBrowserHistory'
const history = createBrowserHistory()

syncReduxAndRouter(history, store)

import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

render((
  <Provider store={store}>
    <Router history={history}>
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
