import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { fetchTodayIfNeeded } from '../actions/today'
import Deals from '../components/Deals'


class TodayApp extends Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleRefreshClick = this.handleRefreshClick.bind(this)
  }

  componentDidMount () {
    const { dispatch, options } = this.props
    dispatch(fetchTodayIfNeeded(options))
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.options !== this.props.options) {
      const { dispatch, options } = nextProps
      dispatch(fetchTodayIfNeeded(options))
    }
  }

  handleChange (nextOptions) {
    this.props.dispatch(fetchTodayIfNeeded(nextOptions))
  }

  handleRefreshClick (e) {
    e.preventDefault()

    const { dispatch, options } = this.props
    dispatch(fetchTodayIfNeeded({ skip: 100, limit: 5 }))
  }

  render () {
    const { deals, isFetching, page, lastUpdated } = this.props
    return (
      <div>
        <p>
          AAA: {JSON.stringify(page)}<br/>
          {lastUpdated &&
            <span>
              Last updated at {new Date(lastUpdated).toLocaleTimeString()}.
              {' '}
            </span>
          }
          {!isFetching &&
            <a href='#' onClick={this.handleRefreshClick}>
              Refresh
            </a>
          }
        </p>
        {isFetching && deals.length === 0 &&
          <h2>Loading...</h2>
        }
        {!isFetching && deals.length === 0 &&
          <h2>Empty.</h2>
        }
        {deals.length > 0 &&
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <Deals deals={deals} />
          </div>
        }
      </div>
    )
  }
}

TodayApp.propTypes = {
  options: PropTypes.object.isRequired,
  page: PropTypes.object.isRequired,
  deals: PropTypes.array.isRequired,
  isFetching: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number,
  dispatch: PropTypes.func.isRequired
}

function mapStateToProps (state) {
  const { options, dealsByOptions } = state.todayApp
  const {
    isFetching,
    lastUpdated,
    page,
    items: deals
  } = dealsByOptions.result || {
    isFetching: true,
    page: {},
    items: []
  }

  return {
    options,
    deals,
    page,
    isFetching,
    lastUpdated
  }
}

export default connect(mapStateToProps)(TodayApp)
