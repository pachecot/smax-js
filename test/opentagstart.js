require(__dirname).test({
  xml: "<root length='12345'></root>",
  expect: [
    [
      'opentag',
      {
        name: 'root',
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
      'root'
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
      'root'
    ]
  ],
  strict: true
})
