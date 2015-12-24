import React from 'react'
import { History } from 'react-router'
import AppBar from 'material-ui/lib/app-bar'
import LeftNav from 'material-ui/lib/left-nav'
// import Menu from 'material-ui/lib/menus/menu'
import MenuItem from 'material-ui/lib/menus/menu-item'
// import { pushPath } from 'redux-simple-router'
import { connect } from 'react-redux'

var LayoutApp = module.exports = React.createClass({
  mixins: [History],

  getInitialState () {
    return {
      open: false
    }
  },

  browse: function (page) {
    this.history.replaceState(null, page)
    // where does this dispatch come in place? may connect to redux?
    // this.props.dispatch(pushPath(page))
    this.setState({ open: false })
  },

  render () {
    return (<div>
      <AppBar title='Amazon Deals' onLeftIconButtonTouchTap={() => this.setState({open: true})}/>
      <LeftNav open={this.state.open} docked={false} onRequestChange={open => this.setState({open})}>
        <MenuItem primaryText='Heute' value='/today' onTouchTap={() => this.browse('/today')}/>
        <MenuItem primaryText='Suche' value='/deals' onTouchTap={() => this.browse('/deals')}/>
        <MenuItem primaryText='Reddit Test' value='/reddit' onTouchTap={() => this.browse('/reddit')}/>
      </LeftNav>
      <div>{this.props.children}</div>
    </div>)
  }
})

export default connect()(LayoutApp)
