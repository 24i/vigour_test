'use strict'

var path = require('path')
var fs = require('vigour-fs-promised')
var spawn = require('vigour-spawn')

module.exports = exports = function runInNode () {
  var tmpFilePath
  var requireFiles = this.getRequireFiles()
  requireFiles.unshift(path.resolve(__dirname, './before.js'))
  requireFiles.push(path.resolve(__dirname, './after.js'))
  this.requireFiles = requireFiles
  // console.log('requireFiles', this.requireFiles)
  var contents = this.requireFiles.map((item) => {
    return `require('${item}')`
  }).join(';')
  tmpFilePath = path.join(process.cwd(), 'vtestRunInNode_' + ('' + Math.random()).slice(2) + '.js')
  // console.log('tmpFilePath', tmpFilePath)
  // console.log('contents', contents)
  return fs.writeFileAsync(tmpFilePath, contents, 'utf8')
    .then(() => {
      return spawn('node ' + tmpFilePath, { getOutput: true, quiet: true })
    })
    .then((val) => {
      console.log(val)
      return fs.removeAsync(tmpFilePath)
        .then(() => {
          if (val.match(/# ok\s*$/)) {
            // console.log('pass!')
            return 'pass'
          } else {
            // console.log('fail!')
            return 'fail'
          }
        })
    })
}
