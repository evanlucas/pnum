#!/usr/bin/env node

/**
 * Module dependencies
 */
var snpm = require('smart-private-npm')
  , url = require('url')
  , path = require('path')
  , couch = require('couchpkgs')
  , defaultConfig = require('../config/config')
  , pkg = require('../package')
  , log = require('npmlog')
  , nopt = require('nopt')
  , knownOpts = { private: String
                , loglevel: ['verbose', 'info', 'quiet']
                , 'private-vhost': String
                , public: String
                , config: path
                , exclude: [String, Array]
                , help: Boolean
                , version: Boolean
                }
  , shortHand = { priv: ['--private']
                , pub: ['--public']
                , c: ['--config']
                , e: ['--exclude']
                , h: ['--help']
                , H: ['--help']
                , v: ['--version']
                , verbose: ['--loglevel', 'verbose']
                , q: ['--loglevel', 'quiet']
                }
  , parsed = nopt(knownOpts, shortHand)

log.heading = 'pnum'

if (parsed.loglevel)
  log.level = parsed.loglevel

if (parsed.version) {
  console.log('pnum', 'v'+pkg.version)
  process.exit()
}

if (parsed.help) {
  return help()
}

var config = parsed.config
            ? require(parsed.config)
            : {}

config.private = parsed.private ||
                 config.private ||
                 defaultConfig.private

config.public = parsed.public ||
                config.public ||
                defaultConfig.public

config.http = config.http || 8080
config.https = config.https || null

config.exclude = parsed.exclude ||
                 config.exclude ||
                 []

log.verbose('config', config)

var opts = {
  rewrites: snpm.rewrites,
  proxy: {
    npm: url.parse(config.public),
    policy: {
      npm: url.parse(config.private),
      private: {},
      blacklist: {},
      //whitelist: {},
      transparent: false
    }
  },
  http: config.http,
  https: config.https
}

if (config.blacklist) {
  opts.proxy.policy.blacklist = config.blacklist
}

if (config.whitelist) {
  opts.proxy.policy.whitelist = config.whitelist
}

// fetch list of all packages from private registry
// filtering the design docs
couch.getPkgs({
  registry: config.private,
  filter: config.filter
}, function(err, pkgs) {
  if (err) {
    log.error('[error]', 'error fetching private modules', err)
    process.exit(1)
  }
  var private = {}
    , len = pkgs.length

  for (var i=0; i<len; i++) {
    var pkg = pkgs[i]
    private[pkg] = 1
  }

  config.exclude.forEach(function(e) {
    log.verbose('excluding package:', e)
    if (private.hasOwnProperty(e))
      delete private[e]
  })

  log.verbose('loaded private packages', private)

  opts.proxy.policy.private = private
  snpm.createServer(opts, function(err, servers) {
    if (err) {
      log.error('snpm.createServer', 'error starting private npm', err)
      log.error('snpm.createServer', 'servers: %j', servers)
      return process.exit(1)
    }
    log.info('snpm.createServer', 'private npm running on',
      Object.keys(servers))
  })
})

function help() {
  console.log()
  console.log(' Usage: pnum [options]')
  console.log()
  console.log(' Where [options] can be')
  console.log('   --private <url>           set your private registry')
  console.log('   --public <url>            set the public registry url')
  console.log('   --config <path>           set the path to your config file')
  console.log('   --exclude <pkg>           exclude _pkg_ from being private')
  console.log('   --help                    show help and usage')
  console.log('   --version                 show version information')
  console.log()
  console.log(' The following aliases are also available')
  console.log('   --priv    =>   --private')
  console.log('   --pub     =>   --public')
  console.log('   -c        =>   --config')
  console.log('   -e        =>   --exclude')
  console.log('   -h        =>   --help')
  console.log('   -v        =>   --version')
  console.log()
  process.exit(1)
}
