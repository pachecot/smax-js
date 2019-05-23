require(__dirname).test({
  xml: '<span id="hello" id="there"></span>',
  expect: [
    ['opentag', {
      name: 'span',
      attributes: [{ name: 'id', value: 'hello' }, { name: 'id', value: 'there' }],
      isSelfClosing: false
    }],
    ['closetag', 'span']
  ],
  strict: false,
  opt: {}
})
