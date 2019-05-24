require(__dirname).test({
  xml: `<?xml version="1.0" encoding="UTF-8" ?>

<table />`,
  expect: [
    [
      'xmldeclaration',
      {
        version: '1.0',
        encoding: 'UTF-8'
      }
    ],
    [
      'text',
      '\n\n'
    ],
    [
      'opentag',
      {
        name: 'table',
        id: 0,
        attributes: [],
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'table',
        id: 0
      }
    ]
  ],
  strict: true,
  opt: {}
})

require(__dirname).test({
  xml: `<?xml version="1.0" encoding="UTF-8" ?>

<table><tr><td>Apples</td><td>Bananas</td></tr></table>`,
  expect: [
    [
      'xmldeclaration',
      {
        version: '1.0',
        encoding: 'UTF-8'
      }
    ],
    [
      'text',
      '\n\n'
    ],
    [
      'opentag',
      {
        name: 'table',
        id: 0,
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'tr',
        id: 1,
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'td',
        id: 2,
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'text',
      'Apples'
    ],
    [
      'closetag',
      {
        name: 'td',
        id: 2
      }
    ],
    [
      'opentag',
      {
        name: 'td',
        id: 3,
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'text',
      'Bananas'
    ],
    [
      'closetag',
      {
        name: 'td',
        id: 3
      }
    ],
    [
      'closetag',
      {
        name: 'tr',
        id: 1
      }
    ],
    [
      'closetag',
      {
        name: 'table',
        id: 0
      }
    ]
  ],
  strict: true,
  opt: {}
})
