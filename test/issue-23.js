require(__dirname).test({
  xml: '<compileClassesResponse>' +
    '<result>' +
    '<bodyCrc>653724009</bodyCrc>' +
    '<column>-1</column>' +
    '<id>01pG0000002KoSUIA0</id>' +
    '<line>-1</line>' +
    '<name>CalendarController</name>' +
    '<success>true</success>' +
    '</result>' +
    '</compileClassesResponse>',
  expect: [
    ['opentag', { name: 'compileClassesResponse', id: 0, attributes: [], isSelfClosing: false }],
    ['opentag', { name: 'result', id: 1, attributes: [], isSelfClosing: false }],
    ['opentag', { name: 'bodyCrc', id: 2, attributes: [], isSelfClosing: false }],
    ['text', '653724009'],
    ['closetag', { name: 'bodyCrc', id: 2 }],
    ['opentag', { name: 'column', id: 3, attributes: [], isSelfClosing: false }],
    ['text', '-1'],
    ['closetag', { name: 'column', id: 3 }],
    ['opentag', { name: 'id', id: 4, attributes: [], isSelfClosing: false }],
    ['text', '01pG0000002KoSUIA0'],
    ['closetag', { name: 'id', id: 4 }],
    ['opentag', { name: 'line', id: 5, attributes: [], isSelfClosing: false }],
    ['text', '-1'],
    ['closetag', { name: 'line', id: 5 }],
    ['opentag', { name: 'name', id: 6, attributes: [], isSelfClosing: false }],
    ['text', 'CalendarController'],
    ['closetag', { name: 'name', id: 6 }],
    ['opentag', { name: 'success', id: 7, attributes: [], isSelfClosing: false }],
    ['text', 'true'],
    ['closetag', { name: 'success', id: 7 }],
    ['closetag', { name: 'result', id: 1 }],
    ['closetag', { name: 'compileClassesResponse', id: 0 }]
  ],
  strict: false,
  opt: {}
})
