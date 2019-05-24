// stray ending tags should just be ignored in non-strict mode.
// https://github.com/isaacs/sax-js/issues/32
require(__dirname).test({
  xml: '<a><b></c></b></a>',
  expect: [
    [
      'opentag',
      {
        name: 'a',
        id: 0,
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'b',
        id: 1,
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'text',
      '</c>'
    ],
    [
      'closetag', {
        name: 'b',
        id: 1
      }
    ],
    [
      'closetag', {
        name: 'a',
        id: 0
      }
    ]
  ],
  strict: false,
  opt: {}
})
