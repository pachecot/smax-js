require(__dirname).test({
  xml: "<xml:root xmlns:xml='ERROR'/>",
  expect: [
    [
      'error',
      'xml: prefix must be bound to http://www.w3.org/XML/1998/namespace\n' +
      'Actual: ERROR\n' +
      "Line: 0\nColumn: 27\nChar: '"
    ],
    [
      'opentag',
      {
        name: 'xml:root',
        uri: 'http://www.w3.org/XML/1998/namespace',
        prefix: 'xml',
        local: 'root',
        attributes: [
          {
            name: 'xmlns:xml',
            local: 'xml',
            prefix: 'xmlns',
            uri: 'http://www.w3.org/2000/xmlns/',
            value: 'ERROR'
          }
        ],
        ns: {},
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      'xml:root'
    ]
  ],
  strict: true,
  opt: { xmlns: true }
})
