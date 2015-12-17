import React from 'react'
import superagent from 'superagent'
import _ from 'lodash'

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
        <div>{_.map(this.state.list, function (item) {
          return <div key={item._id}>{item.title}</div>
    })}</div>
      </div>
    )
  }
})
