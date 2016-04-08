'use strict'

var path = require('path')
var os = require('os')

var Nightmare = require('nightmare')
require('nightmare-evaluate-async')(Nightmare)

var fs = require('vigour-fs-promised')

module.exports = exports = function runAgainstUrl () {
  var tmpFilePath
  return this.prepJS()
    .then((contents) => {
      tmpFilePath = path.join(os.tmpdir(), 'vtestInject_' + ('' + Math.random()).slice(2) + '.js')
      // console.log('tmpFilePath', tmpFilePath)
      return fs.writeFileAsync(tmpFilePath, contents, 'utf8')
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        if (!this.config.quiet.val) {
          console.log('RUNNING IN NIGHTMARE:', this.config.url.val)
        }
        var nightmare = Nightmare()
        nightmare
          .goto(this.config.url.val)
          .inject('js', tmpFilePath)
          .then(() => {
            return nightmare.evaluateAsync(this.poller, this.config.timeout.val)
          })
          .then((val) => {
            if (!this.config.quiet.val) {
              console.log(val.logs)
            }
            nightmare.end(() => {
              // console.log('nightmare terminated')
              resolve(fs.removeAsync(tmpFilePath)
                .then(() => {
                  return val.status
                })
              )
            })
          })
      })
    })
}
