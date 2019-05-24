// split high-order numeric attributes into surrogate pairs
require(__dirname).test({
  xml: '<a>&#x1f525;</a>',
  expect: [
    ['opentag', { name: 'a', id: 0, attributes: [], isSelfClosing: false }],
    ['text', '\ud83d\udd25'],
    ['closetag', { name: 'a', id: 0 }]
  ],
  strict: false,
  opt: {}
})
