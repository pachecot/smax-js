require(__dirname).test({
  expect: [
    ['opentag', { 'name': 'r', 'id': 0, 'attributes': [], 'isSelfClosing': false }],
    ['opencdata', undefined],
    ['cdata', ' this is character data  '],
    ['closecdata', undefined],
    ['closetag', { 'name': 'r', 'id': 0 }]
  ]
}).write('<r><![CDATA[ this is ').write('character data  ').write(']]></r>').close()
