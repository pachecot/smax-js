var tap = require('tap')
var saxStream = require('../lib/index').createStream()
tap.doesNotThrow(function () {
  saxStream.end()
})
