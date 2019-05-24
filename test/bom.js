// BOM at the very begining of the stream should be ignored
require(__dirname).test({
  xml: '\uFEFF<P></P>',
  expect: [
    ['opentag', { 'name': 'P', id: 0, attributes: [], isSelfClosing: false }],
    ['closetag', { 'name': 'P', id: 0 }]
  ]
})

// In all other places it should be consumed
require(__dirname).test({
  xml: '\uFEFF<P BOM="\uFEFF">\uFEFFStarts and ends with BOM\uFEFF</P>',
  expect: [
    ['opentag', { 'name': 'P', id: 0, attributes: [{ name: 'BOM', value: '\uFEFF' }], isSelfClosing: false }],
    ['text', '\uFEFFStarts and ends with BOM\uFEFF'],
    ['closetag', { 'name': 'P', id: 0 }]
  ]
})

// BOM after a whitespace is an error
require(__dirname).test({
  xml: ' \uFEFF<P></P>',
  expect: [
    ['error', 'Non-whitespace before first tag.\nLine: 0\nColumn: 2\nChar: \uFEFF'],
    ['text', '\uFEFF'],
    ['opentag', { 'name': 'P', id: 0, attributes: [], isSelfClosing: false }],
    ['closetag', { 'name': 'P', id: 0 }]
  ],
  strict: true
})

// There is only one BOM allowed at the start
require(__dirname).test({
  xml: '\uFEFF\uFEFF<P></P>',
  expect: [
    ['error', 'Non-whitespace before first tag.\nLine: 0\nColumn: 2\nChar: \uFEFF'],
    ['text', '\uFEFF'],
    ['opentag', { 'name': 'P', id: 0, attributes: [], isSelfClosing: false }],
    ['closetag', { 'name': 'P', id: 0 }]
  ],
  strict: true
})
