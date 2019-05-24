require(__dirname).test({
  xml: '<r>&rfloor; ' +
    '&spades; &copy; &rarr; &amp; ' +
    '&lt; < <  <   < &gt; &real; &weierp; &euro;</r>',
  expect: [
    ['opentag', { 'name': 'r', id: 0, attributes: [], isSelfClosing: false }],
    ['text', '⌋ ♠ © → & < < <  <   < > ℜ ℘ €'],
    ['closetag', { 'name': 'r', id: 0 }]
  ]
})
