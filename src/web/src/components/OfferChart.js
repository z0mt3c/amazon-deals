import moment from 'moment'
import _ from 'lodash'
import React, { PropTypes, Component } from 'react'
import { Line } from 'react-chartjs'

const chartOptions = {
  scaleBeginAtZero: true,
  scaleShowGridLines: true,
  scaleGridLineColor: 'rgba(0,0,0,.05)',
  scaleGridLineWidth: 1,
  scaleShowHorizontalLines: true,
  scaleShowVerticalLines: true,
  barShowStroke: true,
  barStrokeWidth: 2,
  barValueSpacing: 5,
  barDatasetSpacing: 1
}

export default class OfferChart extends Component {
  render () {
    const { offers } = this.props

    let chartData = {
      labels: _.map(offers, offer => moment(offer.startsAt).format('DD.MM.YYYY')),
      datasets: [{
        label: 'Normalpreis',
        fillColor: 'rgba(151,187,205,0.2)',
        strokeColor: 'rgba(151,187,205,1)',
        pointColor: 'rgba(151,187,205,1)',
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(151,187,205,1)',
        data: _.map(offers, offer => offer.minCurrentPrice || '?')
      }, {
        label: 'Deal-Preis',
        fillColor: 'rgba(220,220,220,0.2)',
        strokeColor: 'rgba(220,220,220,1)',
        pointColor: 'rgba(220,220,220,1)',
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(220,220,220,1)',
        data: _.map(offers, offer => offer.minDealPrice || '?')
      }]
    }

    var width = window.innerWidth - 20
    var height = Math.min(width * (9 / 16), 400)
    console.log(width, height)
    return <div><Line data={chartData} options={chartOptions} width={width} height={height}/></div>
  }
}

OfferChart.propTypes = {
  offers: PropTypes.array.isRequired
}
