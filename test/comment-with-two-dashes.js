require(__dirname).test({
  xml: '<!-- stand alone -- comment -->',
  expect: [
    [
      'comment',
      ' stand alone -- comment '
    ]
  ],
  strict: false,
  opt: {}
})

require(__dirname).test({
  xml: '<!-- stand alone -- comment -->',
  expect: [
    [
      'error',
      'Malformed comment\nLine: 0\nColumn: 20\nChar:  '
    ],
    [
      'comment',
      ' stand alone -- comment '
    ]
  ],
  strict: true,
  opt: {}
})
