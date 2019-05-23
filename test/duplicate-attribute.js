require(__dirname).test({
  xml: '<span id="hello" id="there"></span>',
  expect: [
    ['opentag', {
      name: 'span',
      attributes: { id: 'hello' },
      isSelfClosing: false
    }],
    ['closetag', 'span']
  ],
  strict: false,
  opt: {}
})
