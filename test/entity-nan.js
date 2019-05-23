require(__dirname).test({
  xml: '<r>&#NaN;</r>',
  expect: [
    ['opentagstart', 'r'],
    ['opentag', { 'name': 'r', attributes: {}, isSelfClosing: false }],
    ['text', '&#NaN;'],
    ['closetag', 'r']
  ]
})
