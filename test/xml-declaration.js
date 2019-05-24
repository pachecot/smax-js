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
        attributes: [],
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      'table'
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
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'tr',
        attributes: [],
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'td',
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
      'td'
    ],
    [
      'opentag',
      {
        name: 'td',
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
      'td'
    ],
    [
      'closetag',
      'tr'
    ],
    [
      'closetag',
      'table'
    ]
  ],
  strict: true,
  opt: {}
})
