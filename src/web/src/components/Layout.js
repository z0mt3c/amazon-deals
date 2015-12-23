import React from 'react'
import { History } from 'react-router'
import AppBar from 'material-ui/lib/app-bar'
import LeftNav from 'material-ui/lib/left-nav'
// import Menu from 'material-ui/lib/menus/menu'
import MenuItem from 'material-ui/lib/menus/menu-item'

import { pushPath } from 'redux-simple-router'

module.exports = React.createClass({
  mixins: [History],

  getInitialState() {
    return {
      open: false
    }
  },

  componentDidMount() {
    // this.setState({})
  },

  onNavChange: function (e, i, item) {
    this.history.replaceState(null, item.route)
  },

  onMenuClick: function (e, i, item) {
    // this.history.replaceState(null, item.route)
    console.log(arguments)
  },

  render() {
    return (
    <div>
        <AppBar title='Amazon Deals' onLeftIconButtonTouchTap={() => this.setState({open: true})}/>
        <LeftNav open={this.state.open} onRequestChange={open => this.setState({open})}>
          <MenuItem primaryText='Heute' value='/today' onTouchTap={() => this.history.replaceState(null, '/today')}></MenuItem>
          <MenuItem primaryText='Suche' value='/deals' onTouchTap={() => this.history.replaceState(null, '/deals')}></MenuItem>
        </LeftNav>
        <div>{this.props.children}</div>
      </div>)
  }
})
