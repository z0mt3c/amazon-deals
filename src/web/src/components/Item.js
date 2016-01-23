import _ from 'lodash'
import React, { PropTypes, Component } from 'react'
import OfferChart from './OfferChart'

export default class Item extends Component {
  render () {
    const { item, isFetching } = this.props

    if (item && item._id) {
      const amazonLink = item.egressUrl || `http://www.amazon.de/gp/product/${item._id}`
      const url = `http://anonym.to/?${amazonLink}`
      return (
      <div>
      <h4>{item.title}</h4>
      <h6>ASIN: {item._id}</h6>

      <div className='row'>
        <div className='col l5 m6'>
          <img src={item.primaryImage || item.teaserImage} style={{width: '100%'}}/>
        </div>
        <div className='col l7 m6'>
          <OfferChart offers={item.offers}/>

          <table className='bordered'>
            <thead>
              <tr>
                  <th data-field='dealId'>ID</th>
                  <th data-field='date'>Datum</th>
                  <th data-field='dealPrice'>Deal-Preis</th>
                  <th data-field='currentPrice'>Normal-Preis</th>
              </tr>
            </thead>

            <tbody>
              {_.map(item.offers, offer => <tr key={offer._id}>
                <td>{offer._id}</td>
                <td>{new Date(offer.startsAt).toLocaleString()}</td>
                <td>{offer.minDealPrice || '?'} {offer.currencyCode}</td>
                <td>{offer.minCurrentPrice} {offer.currencyCode}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <br/>
      <a href={url} target='blank' className='waves-effect waves-light btn' style={{float: 'right'}}>Zu Amazon</a>
      <br/><br/>
      </div>
      )
    } else if (isFetching) {
      return (<div className='progress'>
         <div className='indeterminate'></div>
      </div>)
    } else {
      return <div>Not found</div>
    }
  }
}

Item.propTypes = {
  item: PropTypes.object.isRequired,
  isFetching: PropTypes.bool.isRequired
}
