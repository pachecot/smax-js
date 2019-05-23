// https://github.com/isaacs/sax-js/issues/47
require(__dirname).test({
  xml: '<a href="query.svc?x=1&y=2&z=3"/>',
  expect: [
    ['opentag', { name: 'a', attributes: { href: 'query.svc?x=1&y=2&z=3' }, isSelfClosing: true }],
    ['closetag', 'a']
  ],
  opt: {}
})
