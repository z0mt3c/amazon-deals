import moment from 'moment'
import _ from 'lodash'
import React, { PropTypes, Component } from 'react'
import OfferChart from './OfferChart'

export default class Item extends Component {
  render() {
    const { item } = this.props

    if (item && item._id) {
      const url = `http://anonym.to/?${item.egressUrl}`
      return (
      <div>
      <h2> {item.title} ({item._id})</h2>
      <img src={item.primaryImage || item.teaserImage}/>
      <OfferChart offers={item.offers}/>
      {_.map(item.offers, offer => <div key={offer._id}>{moment(offer.startsAt).format('DD.MM.YYYY HH:mm')} -> {offer.minDealPrice}</div>)}
      <br/>
      <a href={url} target='blank'>Zu Amazon</a>
      </div>
      )
    } else {
      return <div>Not found</div>
    }
  }
}

Item.propTypes = {
  item: PropTypes.object.isRequired
}
