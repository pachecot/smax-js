require(__dirname).test({
  xml: '<root attrib>',
  expect: [
    ['opentag', { name: 'root', attributes: [{ name: 'attrib', value: 'attrib' }], isSelfClosing: false }]
  ],
  opt: { trim: true }
})
