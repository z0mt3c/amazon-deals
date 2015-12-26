import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { fetchTodayIfNeeded } from '../actions/today'
import Deals from '../components/Deals'

const options = {}

class TodayApp extends Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleRefreshClick = this.handleRefreshClick.bind(this)
  }

  componentDidMount () {
    const { dispatch } = this.props
    dispatch(fetchTodayIfNeeded(options))
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.options !== this.props.options) {
      const { dispatch } = nextProps
      dispatch(fetchTodayIfNeeded(options))
    }
  }

  handleChange (options) {
    this.props.dispatch(fetchTodayIfNeeded(options))
  }

  handleRefreshClick (e) {
    e.preventDefault()

    const { dispatch } = this.props
    dispatch(fetchTodayIfNeeded(options))
  }

  render () {
    const { deals, isFetching, lastUpdated } = this.props
    return (
      <div>
        <p>
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
          <div className='progress'>
             <div className='indeterminate'></div>
          </div>
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
