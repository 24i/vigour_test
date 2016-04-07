'use strict'

var path = require('path')
var test = require('tape')
var Vtest = require('../')

test('can run simple tape tests', function (t) {
  t.plan(1)
  var options = {
    files: path.join(__dirname, 'files', 'simple.js'),
    quiet: true
  }
  var vtest = new Vtest(options)
  vtest.start()
    .then((status) => {
      t.equal(status, 'pass', 'Tests pass')
    })
})

test('can require multiple files', function (t) {
  t.plan(1)
  var options = {
    files: [path.join(__dirname, 'files', 'presimple.js'), path.join(__dirname, 'files', 'simple.js')],
    quiet: true
  }
  var vtest = new Vtest(options)
  vtest.start()
    .then((status) => {
      t.equal(status, 'pass', 'Tests pass')
    })
})
