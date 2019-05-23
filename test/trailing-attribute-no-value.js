require(__dirname).test({
  xml: '<root attrib>',
  expect: [
    ['opentag', { name: 'root', attributes: { 'attrib': 'attrib' }, isSelfClosing: false }]
  ],
  opt: { trim: true }
})
