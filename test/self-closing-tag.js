require(__dirname).test({
  xml: '<root>   ' +
    '<haha /> ' +
    '<haha/>  ' +
    '<monkey> ' +
    '=(|)     ' +
    '</monkey>' +
    '</root>  ',
  expect: [
    ['opentag', { name: 'root', attributes: {}, isSelfClosing: false }],
    ['opentag', { name: 'haha', attributes: {}, isSelfClosing: true }],
    ['closetag', 'haha'],
    ['opentag', { name: 'haha', attributes: {}, isSelfClosing: true }],
    ['closetag', 'haha'],
    // ["opentag", {name:"HAHA", attributes:{}}],
    // ["closetag", "HAHA"],
    ['opentag', { name: 'monkey', attributes: {}, isSelfClosing: false }],
    ['text', '=(|)'],
    ['closetag', 'monkey'],
    ['closetag', 'root']
  ],
  opt: { trim: true }
})
