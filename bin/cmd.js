#!/usr/bin/env node
var snpm = require('smart-private-npm')
  , url = require('url')
  , path = require('path')
  , follow = require('follow')
  , log = require('npmlog')
  , nopt = require('nopt')
  , defaultConfig = require('../config/config')
  , pkg = require('../package')
  , createServers = require('create-servers')
  , knownOpts = { private: String
                , registry: String
                , loglevel: ['verbose', 'info', 'quiet']
                , public: String
                , config: path
                , exclude: [Array]
                , help: Boolean
                , version: Boolean
                }
  , shortHand = { priv: ['--private']
                , pub: ['--public']
                , c: ['--config']
                , e: ['--exclude']
                , h: ['--help']
                , v: ['--version']
                , l: ['--loglevel']
                , verbose: ['--loglevel', 'verbose']
                , q: ['--loglevel', 'quiet']
                , r: ['--registry']
                }
  , parsed = nopt(knownOpts, shortHand)

log.heading = 'pnum'

process.on('uncaughException', function(err) {
  log.error('[uncaught exception]', e)
})

if (parsed.loglevel) log.level = parsed.loglevel

if (parsed.version) {
  console.log('pnum', 'v'+pkg.version)
  return
}

if (parsed.help) {
  usage(0)
  return
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

config.http = config.http || defaultConfig.http
config.https = config.https || null

config.exclude = parsed.exclude ||
                 config.exclude ||
                 defaultConfig.exclude ||
                 []

log.verbose('[config]', config)

var opts = {
  rewrites: snpm.rewrites,
  proxy: {
    npm: url.parse(config.public),
    policy: {
      npm: url.parse(config.private),
      private: {},
      blacklist: {},
      transparent: false,
      log: log
    },
    log: log
  },
  http: config.http,
  https: config.https,
  log: log
}

if (config.blacklist) {
  opts.proxy.policy.blacklist = config.blacklist
}

if (config.whitelist) {
  opts.proxy.policy.whitelist = config.whitelist
}

var feed = new follow.Feed({})
feed.db = config.registry || 'http://localhost:5984/registry'
feed.filter = function(doc, req) {
  return !~config.exclude.indexOf(doc._id)
}

feed.on('change', function(change) {
  if (change.hasOwnProperty('deleted') && change.deleted) {
    rmPackage(change.id)
  } else {
    addPackage(change.id)
  }
})

feed.on('error', function(err) {
  log.error('[follow]', err)
  process.exit(1)
})

var router = snpm.createRouter({
    rewrites: opts.rewrites
  , proxy: new snpm.Proxy(opts.proxy)
  , log: opts.log
})

createServers({
    http: opts.http
  , https: opts.https
  , handler: router.dispatch.bind(router)
}, function(err, servers) {
  if (err) {
    log.error('[create server]', 'error starting private npm', err)
    log.error('[create server]', 'servers: %j', servers)
    process.exit(1)
  }
  log.info('[create server]', 'private npm running on', Object.keys(servers))
  feed.follow()
})

function addPackage(pkg) {
  log.verbose('[package]', 'add', pkg)
  router.proxy.policy.private[pkg] = 1
}

function rmPackage(pkg) {
  log.verbose('[package]', 'rm', pkg)
  delete router.proxy.policy.private[pkg]
}

function usage(code) {
  var rs = fs.createReadStream(__dirname + '/usage.txt')
  rs.pipe(process.stdout)
  rs.on('close', function() {
    if (code) process.exit(code)
  })
}
