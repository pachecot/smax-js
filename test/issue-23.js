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
    ['opentag', { name: 'compileClassesResponse', attributes: {}, isSelfClosing: false }],
    ['opentag', { name: 'result', attributes: {}, isSelfClosing: false }],
    ['opentag', { name: 'bodyCrc', attributes: {}, isSelfClosing: false }],
    ['text', '653724009'],
    ['closetag', 'bodyCrc'],
    ['opentag', { name: 'column', attributes: {}, isSelfClosing: false }],
    ['text', '-1'],
    ['closetag', 'column'],
    ['opentag', { name: 'id', attributes: {}, isSelfClosing: false }],
    ['text', '01pG0000002KoSUIA0'],
    ['closetag', 'id'],
    ['opentag', { name: 'line', attributes: {}, isSelfClosing: false }],
    ['text', '-1'],
    ['closetag', 'line'],
    ['opentag', { name: 'name', attributes: {}, isSelfClosing: false }],
    ['text', 'CalendarController'],
    ['closetag', 'name'],
    ['opentag', { name: 'success', attributes: {}, isSelfClosing: false }],
    ['text', 'true'],
    ['closetag', 'success'],
    ['closetag', 'result'],
    ['closetag', 'compileClassesResponse']
  ],
  strict: false,
  opt: {}
})
