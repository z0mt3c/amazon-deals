import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { fetchToday, selectToday, invalidateToday } from '../actions/today'
import Deals from '../components/Deals'
import CategoryPicker from '../components/CategoryPicker'

class TodayApp extends Component {

  constructor (props) {
    super(props)
    this.loadMore = this.loadMore.bind(this)
    this.changeCategory = this.changeCategory.bind(this)
  }

  componentDidMount () {
    const { dispatch, query } = this.props
    dispatch(selectToday(query))
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.query !== this.props.query) {
      const { dispatch, query } = nextProps
      dispatch(fetchToday(query))
    }
  }

  loadMore () {
    const { dispatch, query } = this.props
    dispatch(fetchToday(query))
  }

  changeCategory (category) {
    const { dispatch, query } = this.props
    dispatch(invalidateToday())
    dispatch(selectToday(Object.assign(query, { category: category })))
  }

  render () {
    const { query, items, paging, isFetching, lastUpdated } = this.props
    return (
      <div>
        <div className='clearfix'>
          <div className='pull-right'><CategoryPicker value={query.category} onChange={this.changeCategory}/></div>
        </div>
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
        {isFetching && items.length === 0 &&
          <div className='progress'>
             <div className='indeterminate'></div>
          </div>
        }
        {!isFetching && items.length === 0 &&
          <h2>Empty.</h2>
        }
        {items.length > 0 &&
          <div>
            <Deals deals={items} />
          </div>
        }
        {items.length > 0 && paging.count + paging.skip < paging.total &&
          <a className='waves-effect waves-light btn' style={{ width: '100%' }} onClick={() => this.loadMore()}>more</a>
        }
      </div>
    )
  }
}

TodayApp.propTypes = {
  query: PropTypes.object.isRequired,
  paging: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
  isFetching: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number,
  dispatch: PropTypes.func.isRequired
}

function mapStateToProps (state) {
  const { fetch, select: query } = state.todayApp
  const {
    paging,
    items,
    isFetching,
    lastUpdated
  } = Object.assign({}, {
    query: {},
    isFetching: true,
    paging: {},
    items: []
  }, fetch)

  return {
    query,
    paging,
    items,
    isFetching,
    lastUpdated
  }
}

export default connect(mapStateToProps)(TodayApp)
