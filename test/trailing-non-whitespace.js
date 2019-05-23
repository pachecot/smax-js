require(__dirname).test({
  xml: '<span>Welcome,</span> to monkey land',
  expect: [
    ['opentagstart', 'span'],
    ['opentag', {
      'name': 'span',
      'attributes': {},
      isSelfClosing: false
    }],
    ['text', 'Welcome,'],
    ['closetag', 'span'],
    ['text', ' to monkey land'],
    ['end'],
    ['ready']
  ],
  strict: false,
  opt: {}
})
