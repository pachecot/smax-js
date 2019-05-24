require(__dirname).test({
  xml: '<root>' +
    '<plain attr="normal" />' +
    '<ns1 xmlns="uri:default">' +
    '<plain attr="normal"/>' +
    '</ns1>' +
    '<ns2 xmlns:a="uri:nsa">' +
    '<plain attr="normal"/>' +
    '<a:ns a:attr="namespaced"/>' +
    '</ns2>' +
    '</root>',
  expect: [
    [
      'opentag',
      {
        name: 'root',
        id: 0,
        prefix: '',
        local: 'root',
        uri: '',
        attributes: [],
        ns: {},
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'plain',
        id: 1,
        prefix: '',
        local: 'plain',
        uri: '',
        attributes: [
          {
            name: 'attr',
            value: 'normal',
            prefix: '',
            local: 'attr',
            uri: ''
          }
        ],
        ns: {},
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'plain',
        id: 1
      }
    ],
    [
      'opentag',
      {
        name: 'ns1',
        id: 2,
        prefix: '',
        local: 'ns1',
        uri: 'uri:default',
        attributes: [
          {
            name: 'xmlns',
            value: 'uri:default',
            prefix: 'xmlns',
            local: '',
            uri: 'http://www.w3.org/2000/xmlns/'
          }
        ],
        ns: {
          '': 'uri:default'
        },
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'plain',
        id: 3,
        prefix: '',
        local: 'plain',
        uri: 'uri:default',
        ns: {
          '': 'uri:default'
        },
        attributes: [
          {
            name: 'attr',
            value: 'normal',
            prefix: '',
            local: 'attr',
            uri: ''
          }
        ],
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'plain',
        id: 3
      }
    ],
    [
      'closetag',
      {
        name: 'ns1',
        id: 2
      }
    ],
    [
      'opentag',
      {
        name: 'ns2',
        id: 4,
        prefix: '',
        local: 'ns2',
        uri: '',
        attributes: [
          {
            name: 'xmlns:a',
            value: 'uri:nsa',
            prefix: 'xmlns',
            local: 'a',
            uri: 'http://www.w3.org/2000/xmlns/'
          }
        ],
        ns: {
          a: 'uri:nsa'
        },
        isSelfClosing: false
      }
    ],
    [
      'opentag',
      {
        name: 'plain',
        id: 5,
        prefix: '',
        local: 'plain',
        uri: '',
        attributes: [
          {
            name: 'attr',
            value: 'normal',
            prefix: '',
            local: 'attr',
            uri: ''
          }
        ],
        ns: {
          a: 'uri:nsa'
        },
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'plain',
        id: 5
      }
    ],
    [
      'opentag',
      {
        name: 'a:ns',
        id: 6,
        prefix: 'a',
        local: 'ns',
        uri: 'uri:nsa',
        attributes: [
          {
            name: 'a:attr',
            value: 'namespaced',
            prefix: 'a',
            local: 'attr',
            uri: 'uri:nsa'
          }
        ],
        ns: { a: 'uri:nsa' },
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'a:ns',
        id: 6
      }
    ],
    [
      'closetag',
      {
        name: 'ns2',
        id: 4
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
