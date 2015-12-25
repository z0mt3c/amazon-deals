import { connect } from 'react-redux'
import { pushPath } from 'redux-simple-router'

import React, { PropTypes } from 'react'
import LazyLoad from 'react-lazy-load'
let Toolbar = require('material-ui/lib/toolbar/toolbar')
let TextField = require('material-ui/lib/text-field')
let GridList = require('material-ui/lib/grid-list/grid-list')
let GridTile = require('material-ui/lib/grid-list/grid-tile')
let IconButton = require('material-ui/lib/icon-button')
require('react-tap-event-plugin')()
let superagent = require('superagent')

var HistoryApp = React.createClass({
  getInitialState () {
    return {
      query: '',
      windowWidth: window.innerWidth,
      message: 'Suchbegriff eingeben (mindestens 3 Zeichen)',
      dataList: [],
      dataItem: null
    }
  },

  handleResize (e) {
    this.setState({windowWidth: window.innerWidth})
  },

  componentDidMount () {
    window.addEventListener('resize', this.handleResize)
  },

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  },

  _handleChange (event) {
    var query = event.target.value
    this.setState({ query: query, dataList: [], message: 'Suche mit ENTER bestätigen (mindestens 3 Zeichen)' })
  },

  _handleKeyPress (event) {
    var query = this.state.query
    if (event.key === 'Enter') {
      if (query.length >= 3) {
        superagent.get('api/deals')
          .query({ q: query })
          .set('Accept', 'application/json')
          .end(function (err, res) {
            if (err) {
              console.log(err)
            }
            var result = res.body || []
            this.setState({ dataList: result, message: result.length === 0 ? 'Keine Treffer' : null })
          }.bind(this))
      } else {
        this.setState({ dataList: [], message: 'Suchbegriff eingeben (mindestens 3 Zeichen)' })
      }
    }
  },

  onItemClicked (item) {
    this.props.dispatch(pushPath('/item/' + item._id))
  },

  render () {
    var message = null

    if (this.state.message) {
      message = <div style={{padding: 50, textAlign: 'center'}}>
        {this.state.message}
      </div>
    }

    return (<div>
              <Toolbar>
                  <TextField hintText='Begriff / Artikelnummer eingeben' value={this.state.query} onChange={this._handleChange} fullWidth={true} onKeyPress={this._handleKeyPress}/>
              </Toolbar>
              {message}
              {this.renderList()}
            </div>)
  },

  renderList () {
    var self = this
    return <GridList cellHeight={350} style={{width: '100%', overflowY: 'auto'}} cols={Math.floor(this.state.windowWidth / 420) + 1}>
      {this.state.dataList.map(function (item) {
        // var itemClicked = self.onItemClicked.bind(self, item)
        return <GridTile key={item._id} title={item.title} onClick={() => self.onItemClicked(item)} actionIcon={<IconButton iconClassName='muidocs-icon' tooltip='icon'/>}>
           <LazyLoad>
             <img src={item.teaserImage || item.primaryImage} width='100%' />
           </LazyLoad>
        </GridTile> })}
    </GridList>
  },

  propTypes: {
    dispatch: PropTypes.func.isRequired
  }
})

export default connect()(HistoryApp)
