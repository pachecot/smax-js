require(__dirname).test({
  xml: '<Р>тест</Р>',
  expect: [
    ['opentag', { 'name': 'Р', 'id': 0, attributes: [], isSelfClosing: false }],
    ['text', 'тест'],
    ['closetag', { 'name': 'Р', 'id': 0 }]
  ]
})
