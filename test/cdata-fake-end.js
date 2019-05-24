var p = require(__dirname).test({
  expect: [
    ['opentag', { 'name': 'r', 'id': 0, 'attributes': [], 'isSelfClosing': false }],
    ['opencdata', undefined],
    ['cdata', '[[[[[[[[]]]]]]]]'],
    ['closecdata', undefined],
    ['closetag', { 'name': 'r', 'id': 0 }]
  ]
})
var x = '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>'
for (var i = 0; i < x.length; i++) {
  p.write(x.charAt(i))
}
p.close()

var p2 = require(__dirname).test({
  expect: [
    ['opentag', { 'name': 'r', 'id': 0, 'attributes': [], 'isSelfClosing': false }],
    ['opencdata', undefined],
    ['cdata', '[[[[[[[[]]]]]]]]'],
    ['closecdata', undefined],
    ['closetag', { 'name': 'r', 'id': 0 }]
  ]
})
x = '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>'
p2.write(x).close()
