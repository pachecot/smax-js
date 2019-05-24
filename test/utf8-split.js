var tap = require('tap')
var { PassThrough } = require('stream')
var sax = require('../lib/index')
var saxStream = sax.createStream()

var b = Buffer.from('误')

saxStream.on('data', function (action) {
  if (action.type === sax.MessageType.text) {
    tap.equal(action.payload, b.toString())
  }
})

var encStream = new PassThrough()
encStream.setEncoding('utf8')
encStream.pipe(saxStream)

encStream.write(Buffer.from('<test><a>'))
encStream.write(b.slice(0, 1))
encStream.write(b.slice(1))
encStream.write(Buffer.from('</a><b>'))
encStream.write(b.slice(0, 2))
encStream.write(b.slice(2))
encStream.write(Buffer.from('</b><c>'))
encStream.write(b)
encStream.write(Buffer.from('</c>'))
encStream.write(Buffer.concat([Buffer.from('<d>'), b.slice(0, 1)]))
encStream.end(Buffer.concat([b.slice(1), Buffer.from('</d></test>')]))

var saxStream2 = require('../lib/index').createStream({ lenient: true})

saxStream2.on('data', function (action) {
  if (action.type === sax.MessageType.text) {
    tap.equal(action.payload, '�')
  }
})

saxStream2.write(Buffer.from('<root>'))
saxStream2.write(Buffer.from('<e>'))
saxStream2.write(Buffer.from([0xC0]))
saxStream2.write(Buffer.from('</e>'))
saxStream2.write(Buffer.concat([Buffer.from('<f>'), b.slice(0, 1)]))
saxStream2.write(Buffer.from('</root>'))
saxStream2.end()
