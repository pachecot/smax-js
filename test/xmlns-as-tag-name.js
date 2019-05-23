require(__dirname).test({
  xml: '<xmlns/>',
  expect: [
    [
      'opentagstart',
      'xmlns'
    ],
    [
      'opentag',
      {
        name: 'xmlns',
        uri: '',
        prefix: '',
        local: 'xmlns',
        attributes: {},
        ns: {},
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      'xmlns'
    ]
  ],
  strict: true,
  opt: {
    xmlns: true
  }
})
