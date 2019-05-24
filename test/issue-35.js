// https://github.com/isaacs/sax-js/issues/35
require(__dirname).test({
  xml: '<xml>&#Xd;&#X0d;\n</xml>',
  expect: [
    ['opentag', { name: 'xml', id: 0, attributes: [], isSelfClosing: false }],
    ['text', '\r\r\n'],
    ['closetag', { name: 'xml', id: 0 }]
  ],
  strict: true,
  opt: {}
})
