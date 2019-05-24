require(__dirname).test({
  xml: '<root attrib>',
  expect: [
    ['opentag', { name: 'root', id: 0, attributes: [{ name: 'attrib', value: 'attrib' }], isSelfClosing: false }]
  ],
  opt: { trim: true }
})
