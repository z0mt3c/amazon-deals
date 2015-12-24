import React, { PropTypes, Component } from 'react'

export default class Deals extends Component {
  render() {
    return (
      <ul>
        {this.props.deals.map((post, i) =>
          <li key={i}>{post.title}</li>
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
