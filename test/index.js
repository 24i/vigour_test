'use strict'

var path = require('path')
var test = require('tape')
var Vtest = require('../')

test('can run simple tape tests in the browser', function (t) {
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

test('can run multiple files in the browser', function (t) {
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

test('can execute tests against a live url', function (t) {
  t.plan(1)
  var options = {
    url: 'http://perdu.com/',
    files: path.join(__dirname, 'files', 'simple.js'),
    quiet: true
  }
  var vtest = new Vtest(options)
  vtest.start()
    .then((status) => {
      t.equal(status, 'pass', 'Tests pass')
    })
})
