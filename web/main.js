// main.js
let React = require('react')
let ReactDOM = require('react-dom')
let AppBar = require('material-ui/lib/app-bar')
let Toolbar = require('material-ui/lib/toolbar/toolbar')
let ToolbarGroup = require('material-ui/lib/toolbar/toolbar-group')
let ToolbarTitle = require('material-ui/lib/toolbar/toolbar-title')
let TextField = require('material-ui/lib/text-field')
let GridList = require('material-ui/lib/grid-list/grid-list')
let GridTile = require('material-ui/lib/grid-list/grid-tile')
let IconButton = require('material-ui/lib/icon-button')
require('react-tap-event-plugin')()
let superagent = require('superagent')
let LazyLoad = require('react-lazy-load')
let _ = require('lodash')

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
      message: null,
      dataList: []
    }
  },
  search(event) {
    var query = event.target.value
    this.setState({ query: query })

    if (query.length >= 3) {
      search(query, function (err, res) {
        this.setState({ dataList: res.body || [] })
      }.bind(this))
    } else {
      this.setState({ dataList: [], message: 'Enter search query (min 3 characters)' })
    }
  },
  render() {
    return (<div>
              <Toolbar>
                <ToolbarGroup key={0} float='left'>
                  <ToolbarTitle text='Search:' />
                  <TextField hintText='Query' value={this.state.query} onChange={this.search} />
                </ToolbarGroup>
              </Toolbar>
              <GridList cellHeight={350} style={{width: '100%', overflowY: 'auto'}}  cols={5}>
                {this.state.dataList.map(item => <GridTile
                 key={item._id}
                 title={item.title}
                 subtitle={item.prices.map(price => <span key={price.dealID}><b><strike>{price.currentPrice} {price.currencyCode}</strike> {price.dealPrice} {price.currencyCode}</b> </span> )}
                 actionIcon={<IconButton iconClassName='muidocs-icon-custom-github' tooltip='GitHub'></IconButton>}>
                 <LazyLoad>
                   <img src={item.primaryImage} width='100%' />
                 </LazyLoad>
               </GridTile>)}
              </GridList>
            </div>)
  }
})

ReactDOM.render(
  <div>
    <AppBar title='Amazon Lighting Dealz' />
    <History/>
  </div>,
  document.getElementById('example')
)
