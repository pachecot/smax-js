// https://github.com/isaacs/sax-js/issues/49
require(__dirname).test({
  xml: '<xml><script>hello world</script></xml>',
  expect: [
    ['opentag', { name: 'xml', id: 0, attributes: [], isSelfClosing: false }],
    ['opentag', { name: 'script', id: 1, attributes: [], isSelfClosing: false }],
    ['text', 'hello world'],
    ['closetag', { name: 'script', id: 1 }],
    ['closetag', { name: 'xml', id: 0 }]
  ],
  strict: false,
  opt: { lowercasetags: true, noscript: true }
})

require(__dirname).test({
  xml: '<xml><script><![CDATA[hello world]]></script></xml>',
  expect: [
    ['opentag', { name: 'xml', id: 0, attributes: [], isSelfClosing: false }],
    ['opentag', { name: 'script', id: 1, attributes: [], isSelfClosing: false }],
    ['opencdata', undefined],
    ['cdata', 'hello world'],
    ['closecdata', undefined],
    ['closetag', { name: 'script', id: 1 }],
    ['closetag', { name: 'xml', id: 0 }]
  ],
  strict: false,
  opt: { lowercasetags: true, noscript: true }
})
