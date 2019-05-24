require(__dirname).test({
  xml: '<r><![CDATA[ this is character data  ]]></r>',
  expect: [
    ['opentag', { 'name': 'r', 'id': 0, 'attributes': [], 'isSelfClosing': false }],
    ['opencdata', undefined],
    ['cdata', ' this is character data  '],
    ['closecdata', undefined],
    ['closetag', { 'name': 'r', 'id': 0 }]
  ]
})
