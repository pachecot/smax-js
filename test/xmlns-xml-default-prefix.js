require(__dirname).test({
  xml: '<xml:root/>',
  expect: [
    [
      'opentag',
      {
        name: 'xml:root',
        id: 0,
        uri: 'http://www.w3.org/XML/1998/namespace',
        prefix: 'xml',
        local: 'root',
        attributes: [],
        ns: {},
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'xml:root',
        id: 0
      }
    ]
  ],
  strict: true,
  opt: { xmlns: true }
})
