import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
import { pushPath } from 'redux-simple-router'

class Deals extends Component {
  render () {
    const { dispatch, deals } = this.props
    return (
      <ul className='collection with-header'>
        <li key='search_results' className='collection-header' style={{ backgroundColor: '#00bcd4', color: 'white' }}><h5>Ergebnisse</h5></li>
        {deals.reduce((memo, post, i) => {
          let image = post.primaryImage || post.teaserImage
          if (image != null) {
            image = image.replace(/\.jpg$/ig, '._SL400_SL84_.jpg')
          }

          memo.push(<li className='collection-item avatar' key={post._id} onClick={() => dispatch(pushPath('/item/' + post._id))} style={{minHeight: 64}}>
            {image ? <img src={image} className='circle'/> : null}
            <span className='title'>{post.title}</span>
          </li>)

          return memo
        }, [])}
      </ul>
    )
  }
}

Deals.propTypes = {
  deals: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired
  }).isRequired).isRequired,
  dispatch: PropTypes.func.isRequired
}

function mapStateToProps (state) {
  return {}
}

export default connect(mapStateToProps)(Deals)
