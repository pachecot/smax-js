require(__dirname).test({
  xml: '<root>   ' +
    '<haha /> ' +
    '<haha/>  ' +
    '<monkey> ' +
    '=(|)     ' +
    '</monkey>' +
    '</root>  ',
  expect: [
    ['opentagstart', 'root'],
    ['opentag', { name: 'root', attributes: {}, isSelfClosing: false }],
    ['opentagstart', 'haha'],
    ['opentag', { name: 'haha', attributes: {}, isSelfClosing: true }],
    ['closetag', 'haha'],
    ['opentagstart', 'haha'],
    ['opentag', { name: 'haha', attributes: {}, isSelfClosing: true }],
    ['closetag', 'haha'],
    // ["opentag", {name:"HAHA", attributes:{}}],
    // ["closetag", "HAHA"],
    ['opentagstart', 'monkey'],
    ['opentag', { name: 'monkey', attributes: {}, isSelfClosing: false }],
    ['text', '=(|)'],
    ['closetag', 'monkey'],
    ['closetag', 'root']
  ],
  opt: { trim: true }
})
