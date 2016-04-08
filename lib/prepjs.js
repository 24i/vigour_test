'use strict'

var path = require('path')
var Stream = require('stream')

var browserify = require('browserify')
var _template = require('lodash.template')

var fs = require('vigour-fs-promised')

module.exports = exports = function prepJS () {
  return fs.readFileAsync(path.join(__dirname, 'js.template'), 'utf8')
    .then((contents) => {
      var jsTemplate = _template(contents)
      var requireFiles = this.getRequireFiles().map(function (item) {
        return `require('${item}')`
      }).join(';')
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
