var sax = require('../')
var xml = '<r>'
var text = ''
for (var i in sax.ENTITIES) {
  xml += '&' + i + ';'
  text += sax.ENTITIES[i]
}
xml += '</r>'
require(__dirname).test({
  xml: xml,
  expect: [
    ['opentagstart', {'name': 'r', attributes: {}}],
    ['opentag', {'name': 'r', attributes: {}, isSelfClosing: false}],
    ['text', text],
    ['closetag', 'r']
  ]
})
