require(__dirname).test({
  opt: { strictEntities: true },
  xml: '<r>&rfloor; ' +
    '&spades; &copy; &rarr; &amp; ' +
    '&lt; < <  <   < &gt; &real; &weierp; &euro;</r>',
  expect: [
    ['opentagstart', {'name': 'r', attributes: {}}],
    ['opentag', {'name': 'r', attributes: {}, isSelfClosing: false}],
    ['text', '&rfloor; &spades; &copy; &rarr; & < < <  <   < > &real; &weierp; &euro;'],
    ['closetag', 'r']
  ]
})
