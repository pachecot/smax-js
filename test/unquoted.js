// unquoted attributes should be ok in non-strict mode
// https://github.com/isaacs/sax-js/issues/31
require(__dirname).test({
  xml: '<span class=test hello=world></span>',
  expect: [
    [
      'opentag',
      {
        name: 'span',
        id: 0,
        attributes: [
          { name: 'class', value: 'test' },
          { name: 'hello', value: 'world' }
        ],
        isSelfClosing: false
      }
    ],
    [
      'closetag',
      {
        name: 'span',
        id: 0
      }
    ]
  ],
  strict: false,
  opt: {}
})
