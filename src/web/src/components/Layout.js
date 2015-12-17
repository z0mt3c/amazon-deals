import React from 'react'
import { Link } from 'react-router'
import AppBar from 'material-ui/lib/app-bar'

module.exports = React.createClass({
  componentDidMount() {
    this.setState({})
  },

  render() {
    return (
      <div>
        <AppBar title='Test' />
        <div>
            <Link to='/today'>Today</Link>
            {' '}
            <Link to='/deals'>Deals</Link>
        </div>
        <div>{this.props.children}</div>
      </div>)
  }
})
