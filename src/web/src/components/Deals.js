import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
import { pushPath } from 'redux-simple-router'

import List from 'material-ui/lib/lists/list'
// import Divider from 'material-ui/lib/divider'
// import ListItem from 'material-ui/lib/lists/list-item'
import MenuItem from 'material-ui/lib/menus/menu-item'
import moment from 'moment'

class Deals extends Component {
  render () {
    const { dispatch, deals } = this.props
    return (
      <List>
        {deals.map((post, i) =>
          <MenuItem key={post._id} onTouchTap={() => dispatch(pushPath('/item/' + post._id))} primaryText={post.title} rightIconButton={<span style={{ 'padding-left': 10, 'padding-right': 10, 'background-color': 'white' }}>Ab {moment(post.offer.startsAt).format('HH:mm')}</span>}/>
        )}
      </List>
    )
  }
}

Deals.propTypes = {
  deals: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired
  }).isRequired).isRequired,
  dispatch: PropTypes.func.isRequired
}

function mapStateToProps (state) {
  return {}
}

export default connect(mapStateToProps)(Deals)
