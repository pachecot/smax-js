// default to uppercase
require(__dirname).test({
  xml: '<span class="test" hello="world"></span>',
  expect: [
    ['opentag', {
      name: 'span',
      attributes: [{ name: 'class', value: 'test' }, { name: 'hello', value: 'world' }],
      isSelfClosing: false
    }],
    ['closetag', 'span']
  ],
  strict: false,
  opt: {}
})

// lowercase option : lowercase tag/attribute names
require(__dirname).test({
  xml: '<span class="test" hello="world"></span>',
  expect: [
    ['opentag', {
      name: 'span',
      attributes: [{ name: 'class', value: 'test' }, { name: 'hello', value: 'world' }],
      isSelfClosing: false
    }],
    ['closetag', 'span']
  ],
  strict: false,
  opt: { lowercase: true }
})

// backward compatibility with old lowercasetags opt
require(__dirname).test({
  xml: '<span class="test" hello="world"></span>',
  expect: [
    ['opentag', {
      name: 'span',
      attributes: [{ name: 'class', value: 'test' }, { name: 'hello', value: 'world' }],
      isSelfClosing: false
    }],
    ['closetag', 'span']
  ],
  strict: false,
  opt: { lowercasetags: true }
})
