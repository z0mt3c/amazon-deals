import AppBar from 'material-ui/lib/app-bar'
import LeftNav from 'material-ui/lib/left-nav'
import MenuItem from 'material-ui/lib/menus/menu-item'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { pushPath } from 'redux-simple-router'

var LayoutApp = React.createClass({
  getInitialState () {
    return {
      open: false
    }
  },

  browse (page) {
    this.props.dispatch(pushPath(page))
    this.setState({ open: false })
  },

  render () {
    return (<div>
      <AppBar title='Blitzangebote' onLeftIconButtonTouchTap={() => this.setState({open: true})}/>
      <LeftNav open={this.state.open} docked={false} onRequestChange={open => this.setState({open})}>
        <MenuItem primaryText='Heute' value='/today' onTouchTap={() => this.browse('/today')}/>
        <MenuItem primaryText='Suche' value='/search' onTouchTap={() => this.browse('/search')}/>
      </LeftNav>
      <div className='container'>{this.props.children}</div>
    </div>)
  },

  propTypes: {
    dispatch: PropTypes.func.isRequired,
    children: PropTypes.object
  }
})

export default connect()(LayoutApp)
