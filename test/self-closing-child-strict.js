require(__dirname).test({
  xml: '<root>' +
    '<child>' +
    '<haha />' +
    '</child>' +
    '<monkey>' +
    '=(|)' +
    '</monkey>' +
    '</root>',
  expect: [
    ['opentagstart', 'root'],
    ['opentag', {
      'name': 'root',
      'attributes': {},
      'isSelfClosing': false
    }],
    ['opentagstart', 'child'],
    ['opentag', {
      'name': 'child',
      'attributes': {},
      'isSelfClosing': false
    }],
    ['opentagstart', 'haha'],
    ['opentag', {
      'name': 'haha',
      'attributes': {},
      'isSelfClosing': true
    }],
    ['closetag', 'haha'],
    ['closetag', 'child'],
    ['opentagstart', 'monkey'],
    ['opentag', {
      'name': 'monkey',
      'attributes': {},
      'isSelfClosing': false
    }],
    ['text', '=(|)'],
    ['closetag', 'monkey'],
    ['closetag', 'root'],
    ['end'],
    ['ready']
  ],
  strict: true,
  opt: {}
})
