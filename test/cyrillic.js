require(__dirname).test({
  xml: '<Р>тест</Р>',
  expect: [
    ['opentagstart', 'Р'],
    ['opentag', { 'name': 'Р', attributes: {}, isSelfClosing: false }],
    ['text', 'тест'],
    ['closetag', 'Р']
  ]
})
