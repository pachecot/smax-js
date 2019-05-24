var xmlnsAttr = {
  name: 'xmlns',
  value: 'http://foo',
  prefix: 'xmlns',
  local: '',
  uri: 'http://www.w3.org/2000/xmlns/'
}

var attrAttr = {
  name: 'attr',
  value: 'bar',
  prefix: '',
  local: 'attr',
  uri: ''
}

require(__dirname).test({
  xml: "<elm xmlns='http://foo' attr='bar'/>",
  expect: [
    [
      'opentag',
      {
        name: 'elm',
        id: 0,
        prefix: '',
        local: 'elm',
        uri: 'http://foo',
        ns: { '': 'http://foo' },
        attributes: [
          xmlnsAttr,
          attrAttr
        ],
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      {
        name: 'elm',
        id: 0
      }
    ]
  ],
  strict: true,
  opt: {
    xmlns: true
  }
})
