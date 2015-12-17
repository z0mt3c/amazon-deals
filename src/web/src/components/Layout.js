import React from 'react'
import { History } from 'react-router'
import AppBar from 'material-ui/lib/app-bar'
import LeftNav from 'material-ui/lib/left-nav'

let menuItems = [
  {
    text: 'Heute',
    route: 'today',
    payload: '/today'
  },
  {
    text: 'Suche',
    route: 'deals',
    payload: '/deals'
  }
]

module.exports = React.createClass({
  mixins: [History],

  getInitialState() {
    return {
      showNav: false
    }
  },

  componentDidMount() {
    this.setState({})
  },

  showNav: function() {
    this.refs.leftNav.toggle()
  },

  onNavChange: function(e, i, item) {
    this.history.replaceState(null, item.route)
  },

  render() {
    return (
      <div>
        <AppBar title='Amazon Deals' onLeftIconButtonTouchTap={this.showNav}/>
        <LeftNav ref='leftNav' docked={false} menuItems={menuItems} onChange={this.onNavChange}/>
        <div>{this.props.children}</div>
      </div>)
  }
})
