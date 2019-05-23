require(__dirname).test({
  strict: true,
  opt: { xmlns: true },
  expect: [
    [
      'error',
      'Unbound namespace prefix: "unbound"\nLine: 0\nColumn: 28\nChar: >'
    ],
    [
      'opentag',
      {
        name: 'root',
        uri: '',
        prefix: '',
        local: 'root',
        attributes: [
          {
            name: 'unbound:attr',
            value: 'value',
            uri: 'unbound',
            prefix: 'unbound',
            local: 'attr'
          }
        ],
        ns: {},
        isSelfClosing: true
      }
    ],
    [
      'closetag',
      'root'
    ]
  ]
}).write("<root unbound:attr='value'/>")
