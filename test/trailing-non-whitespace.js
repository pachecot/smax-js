require(__dirname).test({
  xml: '<span>Welcome,</span> to monkey land',
  expect: [
    ['opentag', {
      'name': 'span',
      'id': 0,
      'attributes': [],
      isSelfClosing: false
    }],
    ['text', 'Welcome,'],
    ['closetag', {
      'name': 'span',
      'id': 0
    }],
    ['text', ' to monkey land'],
    ['end'],
    ['ready']
  ],
  strict: false,
  opt: {}
})
