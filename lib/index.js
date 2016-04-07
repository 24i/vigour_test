'use strict'

var Config = require('vigour-config')

var os = require('os')
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
  if (this.config.url.val) {
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
              return nightmare.evaluateAsync(poller, this.config.timeout.val)
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
  } else {
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
            .evaluateAsync(poller, this.config.timeout.val)
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
}

function poller (timeout) {
  return new Promise(function (resolve, reject) {
    var startTime = Date.now()
    var intervalID = setInterval(function () {
      if (window.done) {
        clearInterval(intervalID)
        resolve({ logs: window.logs, status: window.done })
      }
      if (Date.now() > startTime + timeout) {
        clearInterval(intervalID)
        resolve({ logs: window.logs, status: 'timeout' })
      }
    }, 200)
  })
}

Test.prototype.prepJS = function prepJS () {
  return fs.readFileAsync(path.join(__dirname, 'js.template'), 'utf8')
    .then((contents) => {
      var jsTemplate = _template(contents)
      var requireFiles = this.getRequireFiles()
      var js = jsTemplate({ requires: requireFiles })
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
          resolve(total)
        })
      })
    })
}

Test.prototype.getRequireFiles = function () {
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
  return requireFiles
}
