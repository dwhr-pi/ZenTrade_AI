var _ = require('lodash')
var path = require('path')
var minimist = require('minimist')
var version = require('./package.json').version
var EventEmitter = require('events')

module.exports = function (cb) {
  var zenbot = { version }
  var args = minimist(process.argv.slice(3))
  var conf = {}
  var config = {}
  var overrides = {}

  module.exports.debug = args.debug

  // 1. load conf overrides file if present
  if(!_.isUndefined(args.conf)){
    try {
      overrides = require(path.resolve(process.cwd(), args.conf))
    } catch (err) {
      console.error(err + ', failed to load conf overrides file!')
    }
  }

  // 2. load conf.js if present
  try {
    conf = require('./conf')
  } catch (err) {
    if (err && err.code !== 'MODULE_NOT_FOUND') {
      console.error(err + ', falling back to conf-sample')
    }
  }

  // 3. Load conf-sample.js and merge
  var defaults = require('./conf-sample')
  _.defaultsDeep(config, overrides, conf, defaults)
  zenbot.conf = config

  var eventBus = new EventEmitter()
  zenbot.conf.eventBus = eventBus

  if (zenbot.conf.db && zenbot.conf.db.type && ['mongo', 'csv', 'sql'].indexOf(zenbot.conf.db.type) === -1) {
    console.error('WARNING: unknown db.type "' + zenbot.conf.db.type + '". falling back to mongo configuration.')
  }

  var authStr = '', authMechanism, connectionString

  if (zenbot.conf.db && zenbot.conf.db.type === 'csv') {
    var csvConnectionManager = require('./lib/db/csv-connection-manager')(zenbot.conf)
    csvConnectionManager.init()
      .then(function (csvManager) {
        _.set(zenbot, 'conf.db.csv', csvManager)
        cb(null, zenbot)
      })
      .catch(function (err) {
        console.error('WARNING: CSV Database Connection Error: ', err)
        cb(null, zenbot)
      })
    return
  }

  if (zenbot.conf.db && zenbot.conf.db.type === 'sql') {
    var sqlConnectionManager = require('./lib/db/sql-connection-manager')(zenbot.conf)
    sqlConnectionManager.init()
      .then(function (sqlManager) {
        _.set(zenbot, 'conf.db.sql', sqlManager)
        cb(null, zenbot)
      })
      .catch(function (err) {
        console.error('WARNING: SQL Database Connection Error: ', err)
        console.error('WARNING: without SQL some features (such as backfilling/simulation) may be disabled.')
        cb(null, zenbot)
      })
    return
  }

  if(zenbot.conf.mongo.username){
    authStr = encodeURIComponent(zenbot.conf.mongo.username)

    if(zenbot.conf.mongo.password) authStr += ':' + encodeURIComponent(zenbot.conf.mongo.password)

    authStr += '@'

    // authMechanism could be a conf.js parameter to support more mongodb authentication methods
    authMechanism = zenbot.conf.mongo.authMechanism || 'DEFAULT'
  }

  if (zenbot.conf.mongo.connectionString) {
    connectionString = zenbot.conf.mongo.connectionString
  } else {
    connectionString = 'mongodb://' + authStr + zenbot.conf.mongo.host + ':' + zenbot.conf.mongo.port + '/' + zenbot.conf.mongo.db + '?' +
      (zenbot.conf.mongo.replicaSet ? '&replicaSet=' + zenbot.conf.mongo.replicaSet : '' ) +
      (authMechanism ? '&authMechanism=' + authMechanism : '' )
  }

  require('mongodb').MongoClient.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
    if (err) {
      console.error('WARNING: MongoDB Connection Error: ', err)
      console.error('WARNING: without MongoDB some features (such as backfilling/simulation) may be disabled.')
      console.error('Attempted authentication string: ' + connectionString)
      cb(null, zenbot)
      return
    }
    var db = client.db(zenbot.conf.mongo.db)
    _.set(zenbot, 'conf.db.mongo', db)
    cb(null, zenbot)
  })
}
