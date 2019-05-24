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
    ['opentag', {
      'name': 'root',
      'id': 0,
      'attributes': [],
      'isSelfClosing': false
    }],
    ['opentag', {
      'name': 'child',
      'id': 1,
      'attributes': [],
      'isSelfClosing': false
    }],
    ['opentag', {
      'name': 'haha',
      'id': 2,
      'attributes': [],
      'isSelfClosing': true
    }],
    ['closetag', { 'name': 'haha', 'id': 2 }],
    ['closetag', { 'name': 'child', 'id': 1 }],
    ['opentag', {
      'name': 'monkey',
      'id': 3,
      'attributes': [],
      'isSelfClosing': false
    }],
    ['text', '=(|)'],
    ['closetag', { 'name': 'monkey', 'id': 3 }],
    ['closetag', { 'name': 'root', 'id': 0 }],
    ['end'],
    ['ready']
  ],
  strict: false,
  opt: {}
})
