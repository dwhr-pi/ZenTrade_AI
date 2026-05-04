var fs = require('fs')
var path = require('path')
var sqlite = require('node:sqlite')

module.exports = function (conf) {
  var sqlConf = conf.db && conf.db.sql ? conf.db.sql : {}
  var collections = ['trades', 'resume_markers', 'balances', 'sessions', 'periods', 'my_trades', 'sim_results']
  var dialect = (sqlConf.dialect || 'sqlite').toLowerCase()
  var directory = sqlConf.directory || './data/sql'
  var storage = sqlConf.storage || path.join(directory, 'zenbot.sqlite')
  var db = null

  function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true })
  }

  function ensureSqliteSupported() {
    if (dialect !== 'sqlite') {
      throw new Error(
        'SQL dialect "' + dialect + '" is not active yet. ' +
        'Current core support is limited to sqlite so the SQL backtest path can run without an external server.'
      )
    }
  }

  function ensureCollectionSchema(collection) {
    db.exec(
      'CREATE TABLE IF NOT EXISTS "' + collection + '" (' +
        'doc_id TEXT PRIMARY KEY,' +
        'selector TEXT,' +
        'time_value INTEGER,' +
        'to_value INTEGER,' +
        'natural INTEGER NOT NULL UNIQUE,' +
        'doc_json TEXT NOT NULL' +
      ')'
    )
    db.exec('CREATE INDEX IF NOT EXISTS "idx_' + collection + '_selector_time" ON "' + collection + '" (selector, time_value)')
    db.exec('CREATE INDEX IF NOT EXISTS "idx_' + collection + '_selector_to" ON "' + collection + '" (selector, to_value)')
    db.exec('CREATE INDEX IF NOT EXISTS "idx_' + collection + '_natural" ON "' + collection + '" (natural)')
  }

  function normalizeSelector(selector) {
    if (!selector) return null
    if (typeof selector === 'string') return selector
    if (selector.normalized) return selector.normalized
    return null
  }

  return {
    dialect: dialect,
    directory: directory,
    storage: storage,
    collections: collections,

    init: function () {
      ensureSqliteSupported()
      ensureDir(path.dirname(storage))

      db = new sqlite.DatabaseSync(storage)
      db.exec('PRAGMA journal_mode = WAL')
      db.exec('PRAGMA synchronous = NORMAL')

      collections.forEach(function (collection) {
        ensureCollectionSchema(collection)
      })

      this.db = db
      return Promise.resolve(this)
    },

    close: function () {
      if (db) db.close()
      db = null
      this.db = null
    },

    getAllDocuments: function (collection) {
      var stmt = db.prepare('SELECT doc_json FROM "' + collection + '" ORDER BY natural ASC')
      return stmt.all().map(function (row) {
        return JSON.parse(row.doc_json)
      })
    },

    getDocumentById: function (collection, id) {
      var stmt = db.prepare('SELECT doc_json FROM "' + collection + '" WHERE doc_id = ? LIMIT 1')
      var row = stmt.get(id)
      return row ? JSON.parse(row.doc_json) : null
    },

    getNextNatural: function (collection) {
      var stmt = db.prepare('SELECT COALESCE(MAX(natural), -1) + 1 AS next_natural FROM "' + collection + '"')
      return stmt.get().next_natural
    },

    upsertDocument: function (collection, doc) {
      var selector = normalizeSelector(doc.selector)
      var timeValue = typeof doc.time === 'number' ? doc.time : (doc.time ? Number(doc.time) : null)
      var toValue = typeof doc.to === 'number' ? doc.to : (doc.to ? Number(doc.to) : null)
      var stmt = db.prepare(
        'INSERT INTO "' + collection + '" (doc_id, selector, time_value, to_value, natural, doc_json) ' +
        'VALUES (?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT(doc_id) DO UPDATE SET selector = excluded.selector, time_value = excluded.time_value, to_value = excluded.to_value, natural = excluded.natural, doc_json = excluded.doc_json'
      )
      stmt.run(doc._id || doc.id, selector, Number.isFinite(timeValue) ? timeValue : null, Number.isFinite(toValue) ? toValue : null, doc._natural, JSON.stringify(doc))
    },

    bulkUpsertDocuments: function (collection, docs) {
      var self = this
      var nextNatural = self.getNextNatural(collection)
      var stmt = db.prepare(
        'INSERT INTO "' + collection + '" (doc_id, selector, time_value, to_value, natural, doc_json) ' +
        'VALUES (?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT(doc_id) DO UPDATE SET selector = excluded.selector, time_value = excluded.time_value, to_value = excluded.to_value, natural = excluded.natural, doc_json = excluded.doc_json'
      )

      db.exec('BEGIN')
      try {
        docs.forEach(function (doc) {
          var existing = self.getDocumentById(collection, doc._id || doc.id)
          if (typeof doc._natural !== 'number') {
            doc._natural = existing && typeof existing._natural === 'number' ? existing._natural : nextNatural++
          }
          var selector = normalizeSelector(doc.selector)
          var timeValue = typeof doc.time === 'number' ? doc.time : (doc.time ? Number(doc.time) : null)
          var toValue = typeof doc.to === 'number' ? doc.to : (doc.to ? Number(doc.to) : null)
          stmt.run(doc._id || doc.id, selector, Number.isFinite(timeValue) ? timeValue : null, Number.isFinite(toValue) ? toValue : null, doc._natural, JSON.stringify(doc))
        })
        db.exec('COMMIT')
      } catch (err) {
        db.exec('ROLLBACK')
        throw err
      }
    },

    deleteDocumentsByIds: function (collection, ids) {
      if (!ids.length) return
      var placeholders = ids.map(function () { return '?' }).join(', ')
      var stmt = db.prepare('DELETE FROM "' + collection + '" WHERE doc_id IN (' + placeholders + ')')
      stmt.run.apply(stmt, ids)
    }
  }
}
