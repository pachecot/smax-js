// non-strict: no error
require(__dirname).test({
  xml: '<root attr1="first"attr2="second"/>',
  expect: [
    ['opentag', {
      name: 'root',
      id: 0,
      attributes: [
        { name: 'attr1', value: 'first' },
        { name: 'attr2', value: 'second' }
      ],
      isSelfClosing: true
    }],
    ['closetag', {
      name: 'root',
      id: 0
    }]
  ],
  strict: false,
  opt: { lowercase: true }
})

// strict: should give an error, but still parse
require(__dirname).test({
  xml: '<root attr1="first"attr2="second"/>',
  expect: [
    ['error', 'No whitespace between attributes\nLine: 0\nColumn: 20\nChar: a'],
    ['opentag', {
      name: 'root',
      id: 0,
      attributes: [
        { name: 'attr1', value: 'first' },
        { name: 'attr2', value: 'second' }
      ],
      isSelfClosing: true
    }],
    ['closetag', {
      name: 'root',
      id: 0
    }]
  ],
  strict: true,
  opt: {}
}
)

// strict: other cases should still pass
require(__dirname).test({
  xml: '<root attr1="first" attr2="second"/>',
  expect: [
    ['opentag', {
      name: 'root',
      id: 0,
      attributes: [
        { name: 'attr1', value: 'first' },
        { name: 'attr2', value: 'second' }],
      isSelfClosing: true
    }],
    ['closetag', {
      name: 'root',
      id: 0
    }]
  ],
  strict: true,
  opt: {}
})

// strict: other cases should still pass
require(__dirname).test({
  xml: '<root attr1="first"\nattr2="second"/>',
  expect: [
    ['opentag', {
      name: 'root',
      id: 0,
      attributes: [
        { name: 'attr1', value: 'first' },
        { name: 'attr2', value: 'second' }
      ],
      isSelfClosing: true
    }],
    ['closetag', {
      name: 'root',
      id: 0
    }]
  ],
  strict: true,
  opt: {}
})

// strict: other cases should still pass
require(__dirname).test({
  xml: '<root attr1="first"  attr2="second"/>',
  expect: [
    ['opentag', {
      name: 'root',
      id: 0,
      attributes: [
        { name: 'attr1', value: 'first' },
        { name: 'attr2', value: 'second' }],
      isSelfClosing: true
    }],
    ['closetag', {
      name: 'root',
      id: 0
    }]
  ],
  strict: true,
  opt: {}
})
