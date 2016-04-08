'use strict'

var Config = require('vigour-config')

var path = require('path')

module.exports = exports = Test

function Test (config) {
  if (!(config instanceof Config)) {
    config = new Config(config)
  }
  if (!config.files.val) {
    if (!config.files[0]) {
      config.files.set(path.join(process.cwd(), 'test'))
    }
  }
  // console.log('CONFIG', config)
  this.config = config
}

Test.prototype.start = function start () {
  if (this.config.url.val) {
    return this.runAgainstUrl()
  } else {
    return this.runInBrowser()
  }
}

Test.prototype.runInNode = require('./runinnode')

Test.prototype.runAgainstUrl = require('./runagainsturl')

Test.prototype.runInBrowser = require('./runinbrowser')

Test.prototype.poller = require('./poller')

Test.prototype.prepJS = require('./prepjs')

Test.prototype.getRequireFiles = require('./getrequirefiles')
