'use strict'

var path = require('path')

module.exports = exports = function () {
  if (this.requireFiles) {
    return this.requireFiles
  } else {
    var requireFiles = []
    if (this.config.files.val) {
      requireFiles.push(path.resolve(this.config.files.val))
    } else {
      let serialized = this.config.files.serialize()
      for (let key in serialized) {
        requireFiles[key] = path.resolve(serialized[key])
      }
    }
    this.requireFiles = requireFiles
    return this.requireFiles
  }
}
