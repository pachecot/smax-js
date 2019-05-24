require(__dirname).test({
  xml: '<xmlns/>',
  expect: [
    [
      'opentag',
      {
        name: 'xmlns',
        id: 0,
        uri: '',
        prefix: '',
        local: 'xmlns',
        attributes: [],
        ns: {},
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'xmlns',
        id: 0
      }
    ]
  ],
  strict: true,
  opt: {
    xmlns: true
  }
})
