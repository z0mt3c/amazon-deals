import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { fetchItemIfNeeded, selectItem } from '../actions/item'
import Item from '../components/Item'

class ItemApp extends Component {
  componentDidMount () {
    const { dispatch, params } = this.props
    dispatch(selectItem(params.asin))
    dispatch(fetchItemIfNeeded(params.asin))
  }

  render () {
    const { item } = this.props
    return (
      <div>
        <Item item={item}/>
      </div>
    )
  }
}

ItemApp.propTypes = {
  asin: PropTypes.string.isRequired,
  item: PropTypes.object.isRequired,
  isFetching: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number,
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired
}

function mapStateToProps (state) {
  const { asin, itemByAsin } = state.itemApp
  const {
    isFetching,
    lastUpdated,
    item
  } = itemByAsin[asin] || {
    isFetching: true,
    item: {}
  }

  return {
    asin,
    item,
    isFetching,
    lastUpdated
  }
}

export default connect(mapStateToProps)(ItemApp)
