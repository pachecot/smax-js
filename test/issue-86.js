require(__dirname).test({
  xml: '<root>abc</root>de<f',
  expect: [
    [
      'opentag',
      {
        name: 'root',
        id: 0,
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'text',
      'abc'
    ],
    [
      'closetag',
      {
        name: 'root',
        id: 0
      }
    ],
    [
      'text',
      'de<f'
    ]
  ],
  strict: false,
  opt: {}
})

require(__dirname).test({
  xml: '<root>abc</root>de<f',
  expect: [
    [
      'opentag',
      {
        name: 'root',
        id: 0,
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'text',
      'abc'
    ],
    [
      'closetag',
      {
        name: 'root',
        id: 0
      }
    ],
    [
      'error',
      'Text data outside of root node.\nLine: 0\nColumn: 17\nChar: d'
    ],
    [
      'text',
      'd'
    ],
    [
      'error',
      'Text data outside of root node.\nLine: 0\nColumn: 18\nChar: e'
    ],
    [
      'text',
      'e'
    ],
    [
      'error',
      'Unexpected end\nLine: 0\nColumn: 20\nChar: '
    ]
  ],
  strict: true,
  opt: {}
})
