// unquoted attributes should be ok in non-strict mode
// https://github.com/isaacs/sax-js/issues/31
require(__dirname).test({
  xml: '<span class=test hello=world></span>',
  expect: [
    [
      'opentag',
      {
        name: 'span',
        attributes: {
          class: 'test',
          hello: 'world'
        },
        isSelfClosing: false
      }
    ],
    [
      'closetag',
      'span'
    ]
  ],
  strict: false,
  opt: {}
})
