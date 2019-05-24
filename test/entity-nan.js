require(__dirname).test({
  xml: '<r>&#NaN;</r>',
  expect: [
    ['opentag', { 'name': 'r', id: 0, attributes: [], isSelfClosing: false }],
    ['text', '&#NaN;'],
    ['closetag', { 'name': 'r', id: 0 }]
  ]
})
