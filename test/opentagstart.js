require(__dirname).test({
  xml: "<root length='12345'></root>",
  expect: [
    [
      'opentag',
      {
        name: 'root',
        id: 0,
        prefix: '',
        local: 'root',
        uri: '',
        attributes: [
          {
            name: 'length',
            value: '12345',
            prefix: '',
            local: 'length',
            uri: ''
          }
        ],
        ns: {},
        isSelfClosing: false
      }
    ],
    [
      'closetag',
      {
        name: 'root',
        id: 0
      }
    ]
  ],
  strict: true,
  opt: {
    xmlns: true
  }
})

require(__dirname).test({
  xml: "<root length='12345'></root>",
  expect: [
    [
      'opentag',
      {
        name: 'root',
        id: 0,
        attributes: [
          {
            name: 'length',
            value: '12345'
          }
        ],
        isSelfClosing: false
      }
    ],
    [
      'closetag',
      {
        name: 'root',
        id: 0
      }
    ]
  ],
  strict: true
})
