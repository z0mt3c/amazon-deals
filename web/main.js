// main.js
let React = require('react')
let ReactDOM = require('react-dom')
let AppBar = require('material-ui/lib/app-bar')
let Toolbar = require('material-ui/lib/toolbar/toolbar')
let TextField = require('material-ui/lib/text-field')
let Dialog = require('material-ui/lib/dialog')
let GridList = require('material-ui/lib/grid-list/grid-list')
let GridTile = require('material-ui/lib/grid-list/grid-tile')
let IconButton = require('material-ui/lib/icon-button')
let FlatButton = require('material-ui/lib/flat-button')
require('react-tap-event-plugin')()
let superagent = require('superagent')
let LazyLoad = require('react-lazy-load')
let _ = require('lodash')
let Time = require('react-time')
let LineChart = require('react-chartjs').Line

let search = _.throttle(function (query, next) {
  superagent.get('api/deals')
    .query({ q: query })
    .set('Accept', 'application/json')
    .end(next)
}, 300, { leading: false, trailing: true })

var History = React.createClass({
  getInitialState() {
    return {
      query: '',
      windowWidth: window.innerWidth,
      message: 'Suchbegriff eingeben (mindestens 3 Zeichen)',
      dataList: [],
      dataItem: null
    }
  },

  handleResize(e) {
    this.setState({windowWidth: window.innerWidth})
  },

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },

  search(event) {
    var query = event.target.value
    this.setState({ query: query })

    if (query.length >= 3) {
      search(query, function (err, res) {
        var result = res.body || []
        this.setState({ dataList: result, message: result.length === 0 ? 'Keine Treffer' : null })
      }.bind(this))
    } else {
      this.setState({ dataList: [], message: 'Suchbegriff eingeben (mindestens 3 Zeichen)' })
    }
  },

  renderDialog() {
    var item = this.state.dataItem

    if (!item) {
      return null
    }

    let customActions = [
      <FlatButton
        key='close'
        label='Close'
        primary={true}
        onTouchTap={this.handleDialogClose} />
    ]

    let chartOptions = {
      scaleBeginAtZero: true,
      scaleShowGridLines: true,
      scaleGridLineColor: 'rgba(0,0,0,.05)',
      scaleGridLineWidth: 1,
      scaleShowHorizontalLines: true,
      scaleShowVerticalLines: true,
      barShowStroke: true,
      barStrokeWidth: 2,
      barValueSpacing: 5,
      barDatasetSpacing: 1,
      legendTemplate: '<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
    }

    let chartData = {
      labels: _.map(item.prices, function (price) { return price.found || 'Unbekannt' }),
      datasets: [{
          label: 'Deal-Preis',
          fillColor: 'rgba(220,220,220,0.2)',
          strokeColor: 'rgba(220,220,220,1)',
          pointColor: 'rgba(220,220,220,1)',
          pointStrokeColor: '#fff',
          pointHighlightFill: '#fff',
          pointHighlightStroke: 'rgba(220,220,220,1)',
          data: _.map(item.prices, function (price) { return price.dealPrice || '?' })
        },
        {
          label: 'Normalpreis',
          fillColor: 'rgba(151,187,205,0.2)',
          strokeColor: 'rgba(151,187,205,1)',
          pointColor: 'rgba(151,187,205,1)',
          pointStrokeColor: '#fff',
          pointHighlightFill: '#fff',
          pointHighlightStroke: 'rgba(151,187,205,1)',
          data: _.map(item.prices, function (price) { return price.currentPrice || '?' })
        }]
    }

    return (<Dialog
        title={this.state.dataItem ? this.state.dataItem.title : 'Nothing'}
        actions={customActions}
        autoDetectWindowHeight={true}
        autoScrollBodyContent={true}
        open={this.state.dataItem != null}
        onRequestClose={this._handleRequestClose}>
        <div style={{minHeight: '300'}}>
          Show price development (todo: diagram)
          <LineChart data={chartData} options={chartOptions} width='600' height='250'/>
          <ul>
            {item.prices.map(price => <li key={price.dealID}>{price.found != null ? <Time value={price.found} format='DD.MM.YYYY HH:mm'/> : null} <b><strike>{price.currentPrice} {price.currencyCode}</strike> {price.dealPrice} {price.currencyCode}</b></li>)}
          </ul>
        </div>
      </Dialog>)
  },

  onItemClicked(item) {
    this.setState({ dataItem: item })
  },

  handleDialogClose() {
    this.setState({ dataItem: null })
  },

  render() {
    var message = null

    if (this.state.message) {
      message = <div style={{ padding: 50, textAlign: 'center'}}>
                  {this.state.message}
                </div>
    }

    var self = this
    return (<div>
              <Toolbar>
                  <TextField hintText='Begriff / Artikelnummer eingeben' value={this.state.query} onChange={this.search} fullWidth={true}/>
              </Toolbar>
              {message}
              <GridList cellHeight={350} style={{width: '100%', overflowY: 'auto'}} cols={Math.floor(this.state.windowWidth/420)+1}>
                {this.state.dataList.map(function(item) {
                  var itemClicked = self.onItemClicked.bind(self, item)
                  return <GridTile key={item._id} title={item.title}
                    onClick={itemClicked}
                    subtitle={item.prices.map(price => <div key={price.dealID}><b><strike>{price.currentPrice} {price.currencyCode}</strike> {price.dealPrice} {price.currencyCode}</b></div>)} 
                    actionIcon={<IconButton iconClassName='muidocs-icon-custom-github' tooltip='GitHub'></IconButton>}>
                       <LazyLoad>
                         <img src={item.primaryImage} width='100%' />
                       </LazyLoad>
                  </GridTile>})}
              </GridList>
              {this.renderDialog()}
            </div>)
  }
})

ReactDOM.render(
  <div>
    <AppBar title='Amazon Blitzangebote' />
    <History/>
  </div>,
  document.getElementById('example')
)
