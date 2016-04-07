'use strict'

var Config = require('vigour-config')

var path = require('path')
var http = require('http')
var Stream = require('stream')
var fs = require('vigour-fs-promised')
var _template = require('lodash.template')
var browserify = require('browserify')
var Nightmare = require('nightmare')
require('nightmare-evaluate-async')(Nightmare)
var getPort = require('get-port')

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
  var htmlTemplate

  return Promise.all([
    fs.readFileAsync(path.join(__dirname, 'html.template'), 'utf8'),
    fs.readFileAsync(path.join(__dirname, 'js.template'), 'utf8')
  ])
    .then((contents) => {
      htmlTemplate = _template(contents[0])
      var jsTemplate = _template(contents[1])
      var requireFiles
      if (this.config.files.val) {
        requireFiles = `require('${path.resolve(this.config.files.val)}')`
      } else {
        let serialized = this.config.files.serialize()
        let arr = []
        for (let key in serialized) {
          arr[key] = serialized[key]
        }
        requireFiles = arr.map(function (item) {
          return `require('${path.resolve(item)}')`
        }).join(';')
      }
      var js = jsTemplate({ requires: requireFiles })
      return js
    })
    .then((js) => {
      return new Promise((resolve, reject) => {
        var st = new Stream.Readable()
        st.push(js, 'utf8')
        st.push(null)
        var b = browserify(st).bundle()
        b.on('error', console.error)
        var total = ''
        b.on('data', (chunk) => {
          total += chunk.toString()
        })
        b.on('end', () => {
          this.html = htmlTemplate({ js: total, timeout: this.config.timeout.val })
          resolve()
        })
      })
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
          .evaluateAsync(poller)
          .then((val) => {
            if (!this.config.quiet.val) {
              console.log(val.logs)
            }
            nightmare.end(() => {
              // console.log('nightmare teminated')
              this.server.close(() => {
                // console.log('Server closed')
                resolve(val.status)
              })
            })
          })
      })
    })
}

function poller () {
  return new Promise(function (resolve, reject) {
    var startTime = Date.now()
    setInterval(function () {
      if (window.done) {
        resolve({ logs: window.logs, status: window.done })
      }
      if (Date.now() > startTime + window.timeout) {
        resolve({ logs: window.logs, status: 'timeout' })
      }
    }, 200)
  })
}
