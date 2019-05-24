// https://github.com/isaacs/sax-js/issues/49
require(__dirname).test({
  xml: '<?has unbalanced "quotes?><xml>body</xml>',
  expect: [
    ['processinginstruction', { name: 'has', body: 'unbalanced "quotes' }],
    ['opentag', { name: 'xml', id: 0, attributes: [], isSelfClosing: false }],
    ['text', 'body'],
    ['closetag', { name: 'xml', id: 0 }]
  ],
  strict: false,
  opt: { lowercasetags: true, noscript: true }
})
