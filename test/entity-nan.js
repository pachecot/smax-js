require(__dirname).test({
  xml: '<r>&#NaN;</r>',
  expect: [
    ['opentagstart', { 'name': 'r', attributes: {} }],
    ['opentag', { 'name': 'r', attributes: {}, isSelfClosing: false }],
    ['text', '&#NaN;'],
    ['closetag', 'r']
  ]
})
