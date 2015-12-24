import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import * as rootReducer from '../reducers'
import { routeReducer } from 'redux-simple-router'

const loggerMiddleware = createLogger()

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware,
  loggerMiddleware
)(createStore)

const reducers = combineReducers(Object.assign({
  routing: routeReducer
}, rootReducer))

export default function configureStore (initialState) {
  return createStoreWithMiddleware(reducers, initialState)
}
