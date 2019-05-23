// stray ending tags should just be ignored in non-strict mode.
// https://github.com/isaacs/sax-js/issues/32
require(__dirname).test({
  xml: '<a><b></c></b></a>',
  expect: [
    [
      'opentag',
      {
        name: 'a',
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'b',
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'text',
      '</c>'
    ],
    [
      'closetag',
      'b'
    ],
    [
      'closetag',
      'a'
    ]
  ],
  strict: false,
  opt: {}
})
