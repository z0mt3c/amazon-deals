import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { fetchSearch, selectSearch, invalidateSearch } from '../actions/search'
import Results from '../components/Results'
import TextField from 'material-ui/lib/text-field'
import CategoryPicker from '../components/CategoryPicker'

class SearchApp extends Component {

  constructor (props) {
    super(props)
    this.loadMore = this.loadMore.bind(this)
    this.changeCategory = this.changeCategory.bind(this)
    this.handleRefreshClick = this.handleRefreshClick.bind(this)
    this.changeKeyword = this.changeKeyword.bind(this)
  }

  componentDidMount () {
    const { dispatch, query } = this.props
    dispatch(selectSearch(query))
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.query !== this.props.query) {
      const { dispatch, query } = nextProps
      dispatch(fetchSearch(query))
    }
  }

  loadMore () {
    const { dispatch, query } = this.props
    dispatch(fetchSearch(query))
  }

  changeCategory (category) {
    const { dispatch, query } = this.props
    dispatch(invalidateSearch())
    dispatch(selectSearch(Object.assign({}, query, { category: category })))
  }

  changeKeyword (event) {
    if (event.key === 'Enter') {
      const { dispatch, query } = this.props
      dispatch(invalidateSearch())
      let value = event.target.value
      dispatch(selectSearch(Object.assign({}, query, { q: value === '' ? undefined : value })))
    }
  }

  handleRefreshClick (category) {
    const { dispatch, query } = this.props
    dispatch(invalidateSearch())
    dispatch(selectSearch(Object.assign({}, query)))
  }

  render () {
    const { query, items, paging, isFetching, lastUpdated } = this.props
    return (
      <div>
        <div className='row'>
          <div className='col s12 m6'>
            <TextField hintText='Suchbegriff' floatingLabelText='Suchen' fullWidth={true} onKeyPress={this.changeKeyword} className='pull-left'/>
          </div>
          <div className='col s12 m6'>
            <div className='pull-right' style={{marginTop: 16, marginRight: -20}}><CategoryPicker value={query.category} onChange={this.changeCategory}/></div>
          </div>
        </div>
        <p>
          {lastUpdated &&
            <span>
              Geladen um {new Date(lastUpdated).toLocaleTimeString()} Uhr.
              {' '}
            </span>
          }
          {!isFetching &&
            <a href='#' onClick={this.handleRefreshClick}>
              Aktualisieren
            </a>
          }
        </p>
        {isFetching && items.length === 0 &&
          <div className='progress'>
             <div className='indeterminate'></div>
          </div>
        }
        {!isFetching && items.length === 0 &&
          <h4>Nichts gefunden :-(</h4>
        }
        {items.length > 0 &&
          <div>
            <Results deals={items} />
          </div>
        }
        {items.length > 0 && paging.count + paging.skip < paging.total &&
          <a className='waves-effect waves-light btn' style={{ width: '100%' }} onClick={() => this.loadMore()}>more</a>
        }
      </div>
    )
  }
}

SearchApp.propTypes = {
  query: PropTypes.object.isRequired,
  paging: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
  isFetching: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number,
  dispatch: PropTypes.func.isRequired
}

function mapStateToProps (state) {
  const { fetch, select: query } = state.searchApp
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

export default connect(mapStateToProps)(SearchApp)
