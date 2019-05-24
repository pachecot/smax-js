require(__dirname).test({
  opt: { strictEntities: true },
  xml: '<r>&rfloor; ' +
    '&spades; &copy; &rarr; &amp; ' +
    '&lt; < <  <   < &gt; &real; &weierp; &euro;</r>',
  expect: [
    ['opentag', { 'name': 'r', 'id': 0, attributes: [], isSelfClosing: false }],
    ['text', '&rfloor; &spades; &copy; &rarr; & < < <  <   < > &real; &weierp; &euro;'],
    ['closetag', { 'name': 'r', 'id': 0 }]
  ]
})
