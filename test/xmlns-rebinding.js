require(__dirname).test({
  xml: '<root xmlns:x="x1" xmlns:y="y1" x:a="x1" y:a="y1">' +
    '<rebind xmlns:x="x2">' +
    '<check x:a="x2" y:a="y1"/>' +
    '</rebind>' +
    '<check x:a="x1" y:a="y1"/>' +
    '</root>',
  expect: [
    [
      'opentag',
      {
        name: 'root',
        id: 0,
        uri: '',
        prefix: '',
        local: 'root',
        attributes: [
          {
            name: 'xmlns:x',
            value: 'x1',
            uri: 'http://www.w3.org/2000/xmlns/',
            prefix: 'xmlns',
            local: 'x'
          },
          {
            name: 'xmlns:y',
            value: 'y1',
            uri: 'http://www.w3.org/2000/xmlns/',
            prefix: 'xmlns',
            local: 'y'
          },
          {
            name: 'x:a',
            value: 'x1',
            uri: 'x1',
            prefix: 'x',
            local: 'a'
          },
          {
            name: 'y:a',
            value: 'y1',
            uri: 'y1',
            prefix: 'y',
            local: 'a'
          }
        ],
        ns: {
          x: 'x1',
          y: 'y1'
        },
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'rebind',
        id: 1,
        uri: '',
        prefix: '',
        local: 'rebind',
        attributes: [
          {
            name: 'xmlns:x',
            value: 'x2',
            uri: 'http://www.w3.org/2000/xmlns/',
            prefix: 'xmlns',
            local: 'x'
          }
        ],
        ns: {
          x: 'x2'
        },
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'check',
        id: 2,
        uri: '',
        prefix: '',
        local: 'check',
        attributes: [
          {
            name: 'x:a',
            value: 'x2',
            uri: 'x2',
            prefix: 'x',
            local: 'a'
          },
          {
            name: 'y:a',
            value: 'y1',
            uri: 'y1',
            prefix: 'y',
            local: 'a'
          }
        ],
        ns: {
          x: 'x2'
        },
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'check',
        id: 2
      }
    ],
    [
      'closetag',
      {
        name: 'rebind',
        id: 1
      }
    ],
    [
      'opentag',
      {
        name: 'check',
        id: 3,
        uri: '',
        prefix: '',
        local: 'check',
        attributes: [
          {
            name: 'x:a',
            value: 'x1',
            uri: 'x1',
            prefix: 'x',
            local: 'a'
          },
          {
            name: 'y:a',
            value: 'y1',
            uri: 'y1',
            prefix: 'y',
            local: 'a'
          }
        ],
        ns: {
          x: 'x1',
          y: 'y1'
        },
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'check',
        id: 3
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
