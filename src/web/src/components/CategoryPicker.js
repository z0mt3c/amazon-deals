import DropDownMenu from 'material-ui/lib/drop-down-menu'
import MenuItem from 'material-ui/lib/menus/menu-item'
import React, { Component, PropTypes } from 'react'

const categories = [{
  'nodeId': 78191031,
  'category': 'Auto & Motorrad'
}, {
  'nodeId': 355007011,
  'category': 'Baby'
}, {
  'nodeId': 80084031,
  'category': 'Baumarkt'
}, {
  'nodeId': 77028031,
  'category': 'Bekleidung'
}, {
  'nodeId': 213083031,
  'category': 'Beleuchtung'
}, {
  'nodeId': 358556031,
  'category': 'Bier, Wein & Spirituosen'
}, {
  'nodeId': 186606,
  'category': 'Bücher'
}, {
  'nodeId': 192416031,
  'category': 'Bürobedarf & Schreibwaren'
}, {
  'nodeId': 340843031,
  'category': 'Computer & Zubehör'
}, {
  'nodeId': 64187031,
  'category': 'Drogerie & Körperpflege'
}, {
  'nodeId': 562066,
  'category': 'Elektronik & Foto'
}, {
  'nodeId': 908823031,
  'category': 'Elektro-Großgeräte'
}, {
  'nodeId': 52044011,
  'category': 'Englische Bücher'
}, {
  'nodeId': 284266,
  'category': 'DVD & Blu-ray'
}, {
  'nodeId': 300992,
  'category': 'Games'
}, {
  'nodeId': 340852031,
  'category': 'Haustier'
}, {
  'nodeId': 10925031,
  'category': 'Garten'
}, {
  'nodeId': 3167641,
  'category': 'Küche & Haushalt'
}, {
  'nodeId': 340846031,
  'category': 'Lebensmittel & Getränke'
}, {
  'nodeId': 77195031,
  'category': 'Musik-Downloads'
}, {
  'nodeId': 255882,
  'category': 'Musik'
}, {
  'nodeId': 340849031,
  'category': 'Musikinstrumente'
}, {
  'nodeId': 84230031,
  'category': 'Parfümerie & Kosmetik'
}, {
  'nodeId': 327472011,
  'category': 'Schmuck'
}, {
  'nodeId': 355006011,
  'category': 'Schuhe & Handtaschen'
}, {
  'nodeId': 301927,
  'category': 'Software'
}, {
  'nodeId': 12950651,
  'category': 'Spielzeug'
}, {
  'nodeId': 16435051,
  'category': 'Sport & Freizeit'
}, {
  'nodeId': 193707031,
  'category': 'Uhren'
}, {
  'nodeId': 1161658,
  'category': 'Zeitschriften'
}, {
  'nodeId': 72921031,
  'category': 'Weiteres'
}, {
  'nodeId': 1661648031,
  'category': 'Apps für Android'
}, {
  'nodeId': 2801528031,
  'category': 'Hörbuch-Download'
}, {
  'nodeId': 950236031,
  'category': 'Software-Downloads'
}, {
  'nodeId': 3010075031,
  'category': 'Amazon Instant Video'
}, {
  'nodeId': 2454118031,
  'category': 'Koffer, Rucksäcke & Taschen '
}]

export default class Picker extends Component {
  render () {
    const { value, onChange } = this.props

    return (
      <DropDownMenu value={value} onChange={(e, i, value) => onChange(value)}>
        <MenuItem value={undefined} primaryText='Alle'/>
        {categories.map(item => <MenuItem key={item.nodeId} value={item.nodeId} primaryText={item.category}/>)}
      </DropDownMenu>
    )
  }
}

Picker.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired
}
