'use strict'

var path = require('path')
var test = require('tape')
var Vtest = require('../')

test('can run simple tape tests', function (t) {
  t.plan(1)
  var vtest = new Vtest({
    files: path.join(__dirname, 'files', 'simple.js'),
    quiet: true
  })
  vtest.start()
    .then((status) => {
      t.equal(status, 'pass', 'Tests pass')
    })
})
