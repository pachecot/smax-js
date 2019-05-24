var parser = require(__dirname).test({
  expect: [
    ['opentag', { 'name': 'T', id: 0, attributes: [], isSelfClosing: false }],
    ['text', 'flush'],
    ['text', 'rest'],
    ['closetag', { 'name': 'T', id: 0 }]
  ]
})

parser.write('<T>flush')
parser.flush()
parser.write('rest</T>')
parser.close()
