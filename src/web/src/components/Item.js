import React from 'react'

module.exports = React.createClass({
  componentDidMount() {
    this.setState({})
  },

  render() {
    return (
    <div>
        <h2>Item {this.props.params.asin}</h2>
      </div>
    )
  }
})

/*
componentDidMount() {
  this.setState({
    // route components are rendered with useful information, like URL params
    user: findUserById(this.props.params.userId)
  })
},
*/
