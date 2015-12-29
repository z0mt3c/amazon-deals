import URL from 'url'

const chars = [
  {key: /Ã¼/g, value: 'ü'},
  {key: /Ã¤/g, value: 'ä'},
  {key: /Ã¶/g, value: 'ö'},
  {key: /Ã–/g, value: 'Ö'},
  {key: /ÃŸ/g, value: 'ß'},
  {key: /Ã /g, value: 'à'},
  {key: /Ã /g, value: 'à'},
  {key: /Ã¡/g, value: 'á'},
  {key: /Ã¢/g, value: 'â'},
  {key: /Ã£/g, value: 'ã'},
  {key: /Ã¹/g, value: 'ù'},
  {key: /Ãº/g, value: 'ú'},
  {key: /Ã»/g, value: 'û'},
  {key: /Ã™/g, value: 'Ù'},
  {key: /Ãš/g, value: 'Ú'},
  {key: /Ã›/g, value: 'Û'},
  {key: /Ãœ/g, value: 'Ü'},
  {key: /Ã²/g, value: 'ò'},
  {key: /Ã³/g, value: 'ó'},
  {key: /Ã´/g, value: 'ô'},
  {key: /Ã¨/g, value: 'è'},
  {key: /Â®/g, value: '®'},
  {key: /Ã©/g, value: 'é'},
  {key: /Ãª/g, value: 'ê'},
  {key: /Ã«/g, value: 'ë'},
  {key: /Ã€/g, value: 'À'},
  {key: /Ã/g, value: 'Á'},
  {key: /Ã‚/g, value: 'Â'},
  {key: /Ãƒ/g, value: 'Ã'},
  {key: /Ã„/g, value: 'Ä'},
  {key: /Ã…/g, value: 'Å'},
  {key: /Ã‡/g, value: 'Ç'},
  {key: /Ãˆ/g, value: 'È'},
  {key: /Ã‰/g, value: 'É'},
  {key: /ÃŠ/g, value: ''},
  {key: /Ã‹/g, value: 'Ë'},
  {key: /ÃŒ/g, value: 'Ì'},
  {key: /Ã/g, value: 'Í'},
  {key: /ÃŽ/g, value: 'Î'},
  {key: /Ã/g, value: 'Ï'},
  {key: /Ã‘/g, value: 'Ñ'},
  {key: /Ã’/g, value: 'Ò'},
  {key: /Ã“/g, value: 'Ó'},
  {key: /Ã”/g, value: 'Ô'},
  {key: /Ã•/g, value: 'Õ'},
  {key: /Ã˜/g, value: 'Ø'},
  {key: /Ã¥/g, value: 'å'},
  {key: /Ã¦/g, value: 'æ'},
  {key: /Ã§/g, value: 'ç'},
  {key: /Ã¬/g, value: 'ì'},
  {key: /Ã­/g, value: 'í'},
  {key: /Ã®/g, value: 'î'},
  {key: /Ã¯/g, value: 'ï'},
  {key: /Ã°/g, value: 'ð'},
  {key: /Ã±/g, value: 'ñ'},
  {key: /Ãµ/g, value: 'õ'},
  {key: /Ã¸/g, value: 'ø'},
  {key: /Ã½/g, value: 'ý'},
  {key: /Ã¿/g, value: 'ÿ'},
  {key: /â‚¬/g, value: '€'},
  {key: /Â /g, value: ''},
  {key: /Â°/g, value: '°'}
]

export function fixChars (str) {
  if (str != null && /Ã|â|Â/g.test(str)) {
    return chars.reduce((memo, replacer) => memo.replace(replacer.key, replacer.value), str)
  }

  return str
}

export function stripHost (url) {
  return url != null && url !== '' && url.indexOf('http') !== -1 ? URL.parse(url).path : url
}
