'use strict'

module.exports = exports = function poller (timeout) {
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
