require(__dirname).test({
  xml: '<root>   ' +
    '<haha /> ' +
    '<haha/>  ' +
    '<monkey> ' +
    '=(|)     ' +
    '</monkey>' +
    '</root>  ',
  expect: [
    ['opentag', { name: 'root', id: 0, attributes: [], isSelfClosing: false }],
    ['opentag', { name: 'haha', id: 1, attributes: [], isSelfClosing: true }],
    ['closetag', { name: 'haha', id: 1 }],
    ['opentag', { name: 'haha', id: 2, attributes: [], isSelfClosing: true }],
    ['closetag', { name: 'haha', id: 2 }],
    // ["opentag", {name:"HAHA", ,id:0attributes:{}}],
    // ["closetag", {name:"HAHA",id:0}],
    ['opentag', { name: 'monkey', id: 3, attributes: [], isSelfClosing: false }],
    ['text', '=(|)'],
    ['closetag', { name: 'monkey', id: 3 }],
    ['closetag', { name: 'root', id: 0 }]
  ],
  opt: { trim: true }
})
