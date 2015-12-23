import React from 'react'
import superagent from 'superagent'
import _ from 'lodash'
import List from 'material-ui/lib/lists/list'
// import ListDivider from 'material-ui/lib/lists/list-divider'
import ListItem from 'material-ui/lib/lists/list-item'
import Avatar from 'material-ui/lib/avatar'
import LazyLoad from 'react-lazy-load'
import moment from 'moment'

module.exports = React.createClass({
  getInitialState() {
    return {
      list: []
    }
  },

  componentDidMount() {
    this.setState({})
    superagent.get('api/deals/today')
      .set('Accept', 'application/json')
      .end(function (error, response) {
        this.setState({ list: JSON.parse(response.text) })
      }.bind(this))
  },

  render() {
    return (
    <div>
        <h2>Heute</h2>
        <List>
          {_.map(this.state.list, function (item) {
            return <ListItem key={item._id} primaryText={item.title} secondaryText={<span>Ab {moment(item.offer.startsAt).format('HH:mm')} Uhr</span>} /*leftAvatar={<Avatar src={item.primaryImage||item.teaserImage} />}*//>
          })}
        </List>
      </div>
    )
  }
})
