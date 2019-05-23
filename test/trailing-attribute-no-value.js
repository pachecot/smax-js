require(__dirname).test({
  xml: '<root attrib>',
  expect: [
    ['opentagstart', 'root'],
    ['attribute', { name: 'attrib', value: 'attrib' }],
    ['opentag', { name: 'root', attributes: { 'attrib': 'attrib' }, isSelfClosing: false }]
  ],
  opt: { trim: true }
})
