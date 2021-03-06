var iExpect = []
var myAttributes = []
var ENTITIES = {}

// generates xml like test0="&control;"
var entitiesToTest = {
  // 'ENTITY_NAME': IS_VALID || [invalidCharPos, invalidChar],
  'control0': true, // This is a vanilla control.
  // entityStart
  '_uscore': true,
  '#hash': true,
  ':colon': true,
  '-bad': [0, '-'],
  '.bad': [0, '.'],
  // general entity
  'u_score': true,
  'd-ash': true,
  'd.ot': true,
  'all:_#-.': true
}

var xmlStart = '<a test="&amp;" '
var xmlEnd = '/>'

myAttributes.push({ name: 'test', value: '&' })

var entI = 0

for (var entity in entitiesToTest) {
  var attribName = 'test' + entI
  var attribValue = 'Testing ' + entity

  // add the first part to use in calculation below
  xmlStart += attribName + '="' + '&'

  if (typeof entitiesToTest[entity] === 'object') {
    iExpect.push([
      'error',
      'Invalid character in entity name\nLine: 0\nColumn: ' +
      (xmlStart.length + entitiesToTest[entity][0] + 1) +
      '\nChar: ' + entitiesToTest[entity][1]
    ])
    myAttributes.push({ name: attribName, value: '&' + entity + ';' })
  } else {
    ENTITIES[entity] = attribValue
    myAttributes.push({ name: attribName, value: attribValue })
  }

  xmlStart += entity + ';" '
  entI++
}

iExpect.push([
  'opentag',
  {
    name: 'a',
    id: 0,
    attributes: myAttributes,
    isSelfClosing: true
  }
])
iExpect.push(['closetag', { name: 'a', id: 0 }])

var parser = require(__dirname).test({
  strict: true,
  expect: iExpect
})

for (entity in entitiesToTest) {
  parser.ENTITIES[entity] = ENTITIES[entity]
}

parser.write(xmlStart + xmlEnd).close()
