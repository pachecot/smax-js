require(__dirname).test({
  xml: '<r>&#NaN;</r>',
  expect: [
    ['opentag', { 'name': 'r', attributes: {}, isSelfClosing: false }],
    ['text', '&#NaN;'],
    ['closetag', 'r']
  ]
})
