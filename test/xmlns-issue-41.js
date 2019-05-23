var t = require(__dirname)

// should be the same both ways.
var xmls = [
  '<parent xmlns:a="http://ATTRIBUTE" a:attr="value" />',
  '<parent a:attr="value" xmlns:a="http://ATTRIBUTE" />'
]

var ex1 = [
  [
    'opennamespace',
    {
      prefix: 'a',
      uri: 'http://ATTRIBUTE'
    }
  ],
  [
    'opentag',
    {
      name: 'parent',
      uri: '',
      prefix: '',
      local: 'parent',
      attributes: {
        'a:attr': {
          name: 'a:attr',
          local: 'attr',
          prefix: 'a',
          uri: 'http://ATTRIBUTE',
          value: 'value'
        },
        'xmlns:a': {
          name: 'xmlns:a',
          local: 'a',
          prefix: 'xmlns',
          uri: 'http://www.w3.org/2000/xmlns/',
          value: 'http://ATTRIBUTE'
        }
      },
      ns: {
        a: 'http://ATTRIBUTE'
      },
      isSelfClosing: true
    }
  ],
  [
    'closetag',
    'parent'
  ],
  [
    'closenamespace',
    {
      prefix: 'a',
      uri: 'http://ATTRIBUTE'
    }
  ]
]

// swap the order of elements 2 and 3
var ex2 = ex1.slice(0)
var expected = [ex1, ex2]

xmls.forEach(function (x, i) {
  t.test({
    xml: x,
    expect: expected[i],
    strict: true,
    opt: {
      xmlns: true
    }
  })
})
