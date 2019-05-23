require(__dirname).test({
  xml: '<root>',
  expect: [
    [
      'opentagstart',
      'root'
    ],
    [
      'opentag',
      {
        name: 'root',
        attributes: {},
        isSelfClosing: false
      }
    ],
    [
      'error',
      'Unclosed root tag\nLine: 0\nColumn: 6\nChar: '
    ]
  ],
  strict: true,
  opt: {}
})
