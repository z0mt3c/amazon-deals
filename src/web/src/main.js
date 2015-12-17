import React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute } from 'react-router'

import Layout from './components/Layout'
import Deals from './components/Deals'
import Today from './components/Today'
import NoMatch from './components/NoMatch'

import createBrowserHistory from 'history/lib/createBrowserHistory'

const history = createBrowserHistory()

// Declarative route configuration (could also load this config lazily
// instead, all you really need is a single root route, you don't need to
// colocate the entire config).
render((
  <Router history={history}>
    <Route path="/" component={Layout}>
      <IndexRoute component={Today}/>
      <Route path="today" component={Today}/>
      <Route path="deals" component={Deals}/>
      <Route path="*" component={NoMatch}/>
    </Route>
  </Router>
), document.getElementById('example'))
