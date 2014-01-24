var path = require('path')

/**
 * Basic filters
 */
exports.defaultFilter = [
    '_design/ghost'
  , '_design/scratch'
  , '_design/ui'
  , 'error: forbidden'
]

/**
 * The private registry that we query locally
 *
 * This is used to fetch all of our private modules
 *
 */
exports.private = 'http://localhost:5984'

/**
 * Filtering function
 */
exports.filter = function(f) {
  return (!(~exports.defaultFilter.indexOf(f)))
}

/**
 * Public registry
 */
exports.public = 'https://registry.nodejitsu.com'

/**
 * HTTP Port
 */
exports.http = 8044

/**
 * HTTPS Configuration
 */
exports.https = {
  port: 443,
  root: path.join(__dirname),
  key: 'server.key',
  cert: 'server.crt'
}
