// unquoted attributes should be ok in non-strict mode
// https://github.com/isaacs/sax-js/issues/31
require(__dirname).test({
  xml: '<span class=test hello=world></span>',
  expect: [
    [
      'opentagstart',
      {
        name: 'span',
        attributes: {}
      }
    ],
    [
      'attribute',
      {
        name: 'class',
        value: 'test'
      }
    ],
    [
      'attribute',
      {
        name: 'hello',
        value: 'world'
      }
    ],
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
