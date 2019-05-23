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
    ['opentagstart', 'compileClassesResponse'],
    ['opentag', { name: 'compileClassesResponse', attributes: {}, isSelfClosing: false }],
    ['opentagstart', 'result'],
    ['opentag', { name: 'result', attributes: {}, isSelfClosing: false }],
    ['opentagstart', 'bodyCrc'],
    ['opentag', { name: 'bodyCrc', attributes: {}, isSelfClosing: false }],
    ['text', '653724009'],
    ['closetag', 'bodyCrc'],
    ['opentagstart', 'column'],
    ['opentag', { name: 'column', attributes: {}, isSelfClosing: false }],
    ['text', '-1'],
    ['closetag', 'column'],
    ['opentagstart', 'id'],
    ['opentag', { name: 'id', attributes: {}, isSelfClosing: false }],
    ['text', '01pG0000002KoSUIA0'],
    ['closetag', 'id'],
    ['opentagstart', 'line'],
    ['opentag', { name: 'line', attributes: {}, isSelfClosing: false }],
    ['text', '-1'],
    ['closetag', 'line'],
    ['opentagstart', 'name'],
    ['opentag', { name: 'name', attributes: {}, isSelfClosing: false }],
    ['text', 'CalendarController'],
    ['closetag', 'name'],
    ['opentagstart', 'success'],
    ['opentag', { name: 'success', attributes: {}, isSelfClosing: false }],
    ['text', 'true'],
    ['closetag', 'success'],
    ['closetag', 'result'],
    ['closetag', 'compileClassesResponse']
  ],
  strict: false,
  opt: {}
})
