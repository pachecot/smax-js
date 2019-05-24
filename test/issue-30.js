// https://github.com/isaacs/sax-js/issues/33
require(__dirname).test({
  xml: '<xml>\n' +
    '<!-- \n' +
    '  comment with a single dash- in it\n' +
    '-->\n' +
    '<data/>\n' +
    '</xml>',
  expect: [
    ['opentag', { name: 'xml', id: 0, attributes: [], isSelfClosing: false }],
    ['text', '\n'],
    ['comment', ' \n  comment with a single dash- in it\n'],
    ['text', '\n'],
    ['opentag', { name: 'data', id: 1, attributes: [], isSelfClosing: true }],
    ['closetag', { name: 'data', id: 1 }],
    ['text', '\n'],
    ['closetag', { name: 'xml', id: 0 }]
  ],
  strict: true,
  opt: {}
})
