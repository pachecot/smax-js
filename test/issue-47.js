// https://github.com/isaacs/sax-js/issues/47
require(__dirname).test({
  xml: '<a href="query.svc?x=1&y=2&z=3"/>',
  expect: [
    ['opentag', { name: 'a', id: 0, attributes: [{ name: 'href', value: 'query.svc?x=1&y=2&z=3' }], isSelfClosing: true }],
    ['closetag', { name: 'a', id: 0 }]
  ],
  opt: {}
})
