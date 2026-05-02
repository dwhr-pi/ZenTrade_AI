var fs = require('fs')
var path = require('path')

module.exports = function (conf) {
  var dataDir = conf.db.csv.dataDir
  var collections = ['trades', 'resume_markers', 'balances', 'sessions', 'periods', 'my_trades', 'sim_results']
  var cache = {}

  function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true })
  }

  function getCollectionFile(collection) {
    return path.join(dataDir, collection + '.json')
  }

  function loadCollection(collection) {
    var file = getCollectionFile(collection)
    if (!fs.existsSync(file)) {
      cache[collection] = []
      fs.writeFileSync(file, '[]')
      return
    }

    try {
      var content = fs.readFileSync(file, 'utf8')
      var parsed = JSON.parse(content)
      cache[collection] = Array.isArray(parsed) ? parsed : []
    } catch (err) {
      cache[collection] = []
    }

    cache[collection] = cache[collection].map(function (doc, idx) {
      if (typeof doc._natural !== 'number') doc._natural = idx
      return doc
    })
  }

  return {
    dataDir: dataDir,
    cache: cache,

    init: function () {
      ensureDir(dataDir)
      collections.forEach(function (collection) {
        loadCollection(collection)
      })

      if (conf.db.csv.syncInterval > 0) {
        setInterval(this.syncAll.bind(this), conf.db.csv.syncInterval)
      }

      return Promise.resolve(this)
    },

    syncCollection: function (collection) {
      var file = getCollectionFile(collection)
      fs.writeFileSync(file, JSON.stringify(cache[collection] || [], null, 2))
      return Promise.resolve()
    },

    syncAll: function () {
      var self = this
      return Promise.all(collections.map(function (collection) {
        return self.syncCollection(collection)
      }))
    }
  }
}
