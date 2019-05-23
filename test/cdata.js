require(__dirname).test({
  xml: '<r><![CDATA[ this is character data  ]]></r>',
  expect: [
    ['opentagstart', 'r'],
    ['opentag', { 'name': 'r', 'attributes': {}, 'isSelfClosing': false }],
    ['opencdata', undefined],
    ['cdata', ' this is character data  '],
    ['closecdata', undefined],
    ['closetag', 'r']
  ]
})
