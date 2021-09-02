const crypto = require('crypto')

/**
 * Generate a sha 256 hash of a string
 * @param {string|number} string
 * @returns {string}
 */
/* istanbul ignore next */
function hash (string) {
  if (string == undefined) return // eslint-disable-line
  if (typeof string === 'number') string = string.toString()

  const hash = crypto.createHash('sha256')
  hash.update(string)
  return hash.digest('hex')
}

module.exports = hash