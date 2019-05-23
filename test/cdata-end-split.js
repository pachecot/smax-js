require(__dirname).test({
  expect: [
    ['opentag', { 'name': 'r', 'attributes': [], 'isSelfClosing': false }],
    ['opencdata', undefined],
    ['cdata', ' this is '],
    ['closecdata', undefined],
    ['closetag', 'r']
  ]
})
  .write('<r><![CDATA[ this is ]')
  .write(']>')
  .write('</r>')
  .close()
