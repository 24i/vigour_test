'use strict'

var path = require('path')
var http = require('http')

var _template = require('lodash.template')
var getPort = require('get-port')
var Nightmare = require('nightmare')
require('nightmare-evaluate-async')(Nightmare)

var fs = require('vigour-fs-promised')

module.exports = exports = function runInBrowser () {
  var htmlTemplate

  return Promise.all([
    fs.readFileAsync(path.join(__dirname, 'html.template'), 'utf8'),
    this.prepJS()
  ])
    .then((contents) => {
      htmlTemplate = _template(contents[0])
      var js = contents[1]
      this.html = htmlTemplate({ js: js })
    })
    .then(() => {
      return getPort()
    })
    .then((port) => {
      this.port = port
      return new Promise((resolve, reject) => {
        this.server = http.createServer((req, res) => {
          res.setHeader('content-type', 'text/html')
          res.statusCode = 200
          res.write(this.html)
          res.end()
        }).listen(this.port, resolve)
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        // console.log('Listening on port ' + this.port)
        if (!this.config.quiet.val) {
          console.log('RUNNING IN NIGHTMARE:')
        }
        var nightmare = Nightmare()
        nightmare
          .goto('http://localhost:' + this.port)
          .evaluateAsync(this.poller, this.config.timeout.val)
          .then((val) => {
            if (!this.config.quiet.val) {
              console.log(val.logs)
            }
            nightmare.end(() => {
              // console.log('nightmare terminated')
              this.server.close(() => {
                // console.log('Server closed')
                resolve(val.status)
              })
            })
          })
      })
    })
}
