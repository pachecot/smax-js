require(__dirname).test({
  xml: '<span id="hello" id="there"></span>',
  expect: [
    ['opentag', {
      name: 'span',
      id: 0,
      attributes: [{ name: 'id', value: 'hello' }, { name: 'id', value: 'there' }],
      isSelfClosing: false
    }],
    ['closetag', {
      name: 'span',
      id: 0
    }]
  ],
  strict: false,
  opt: {}
})
