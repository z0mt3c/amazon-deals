import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
import { pushPath } from 'redux-simple-router'


class Deals extends Component {
  render() {
    const { dispatch } = this.props
    return (
      <ul>
        {this.props.deals.map((post, i) =>
          <li key={post._id} onClick={() => dispatch(pushPath('/item/' + post._id))}>{post.title}</li>
        )}
      </ul>
    )
  }
}

Deals.propTypes = {
  deals: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired
  }).isRequired).isRequired
}

function mapStateToProps (state) {
  return {}
}

export default connect(mapStateToProps)(Deals)
