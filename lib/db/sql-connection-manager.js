var fs = require('fs')
var path = require('path')

function normalizeSelector(selector) {
  if (!selector) return null
  if (typeof selector === 'string') return selector
  if (typeof selector === 'object' && selector.normalized) return selector.normalized
  try {
    return JSON.stringify(selector)
  } catch (err) {
    return String(selector)
  }
}

module.exports = function (conf) {
  function resolveSqlConfig() {
    var dbConfig = conf.db || {}
    var sqlConfig = Object.assign({}, dbConfig.sql || {})
    sqlConfig.dialect = sqlConfig.dialect || 'sqlite'
    sqlConfig.directory = sqlConfig.directory || './data/sql'
    sqlConfig.storage = sqlConfig.storage || path.join(sqlConfig.directory, 'zenbot.sqlite')
    if (typeof sqlConfig.autoProvision === 'undefined') {
      sqlConfig.autoProvision = true
    }
    return sqlConfig
  }

  function tableName(collectionName) {
    return 'zb_' + String(collectionName).replace(/[^a-zA-Z0-9_]/g, '_')
  }

  function ensureSqliteSupport(sqlConfig) {
    if (sqlConfig.dialect !== 'sqlite') {
      throw new Error('Unsupported SQL dialect "' + sqlConfig.dialect + '". Current core integration supports sqlite only.')
    }

    try {
      return require('node:sqlite')
    } catch (err) {
      throw new Error('SQLite runtime is not available in this Node.js build. Please use Node.js with built-in node:sqlite support or switch to csv.')
    }
  }

  function ensureStorage(sqlConfig) {
    var storagePath = path.resolve(process.cwd(), sqlConfig.storage)
    var storageDir = path.dirname(storagePath)

    if (sqlConfig.autoProvision) {
      fs.mkdirSync(storageDir, { recursive: true })
    } else if (!fs.existsSync(storageDir)) {
      throw new Error('SQL storage directory does not exist: ' + storageDir)
    }

    return storagePath
  }

  async function init() {
    var sqlConfig = resolveSqlConfig()
    var sqlite = ensureSqliteSupport(sqlConfig)
    var storagePath = ensureStorage(sqlConfig)
    var db = new sqlite.DatabaseSync(storagePath)

    function ensureCollection(collectionName) {
      var name = tableName(collectionName)
      db.exec(
        'CREATE TABLE IF NOT EXISTS ' + name + ' (' +
          'doc_id TEXT PRIMARY KEY, ' +
          'selector TEXT, ' +
          'time_value REAL, ' +
          'to_value REAL, ' +
          'natural INTEGER, ' +
          'doc_json TEXT NOT NULL' +
        ')'
      )
      db.exec('CREATE INDEX IF NOT EXISTS ' + name + '_selector_idx ON ' + name + ' (selector)')
      db.exec('CREATE INDEX IF NOT EXISTS ' + name + '_time_idx ON ' + name + ' (time_value)')
      db.exec('CREATE INDEX IF NOT EXISTS ' + name + '_to_idx ON ' + name + ' (to_value)')
      db.exec('CREATE INDEX IF NOT EXISTS ' + name + '_natural_idx ON ' + name + ' (natural)')
      return name
    }

    function getNextNatural(collectionName) {
      var name = ensureCollection(collectionName)
      var row = db.prepare('SELECT COALESCE(MAX(natural), -1) + 1 AS next_natural FROM ' + name).get()
      return row && typeof row.next_natural === 'number' ? row.next_natural : 0
    }

    function serializeDocument(collectionName, doc, naturalOverride) {
      var storedDoc = Object.assign({}, doc)
      var docId = storedDoc._id || storedDoc.id
      if (!docId) {
        throw new Error('SQL collection "' + collectionName + '" requires documents to have _id or id')
      }

      if (!storedDoc._id) storedDoc._id = docId
      if (!storedDoc.id) storedDoc.id = docId
      if (typeof naturalOverride === 'number') {
        storedDoc._natural = naturalOverride
      } else if (typeof storedDoc._natural !== 'number') {
        storedDoc._natural = getNextNatural(collectionName)
      }

      return {
        docId: storedDoc._id,
        selector: normalizeSelector(storedDoc.selector),
        timeValue: typeof storedDoc.time === 'number' ? storedDoc.time : null,
        toValue: typeof storedDoc.to === 'number' ? storedDoc.to : null,
        natural: storedDoc._natural,
        json: JSON.stringify(storedDoc)
      }
    }

    function parseRows(rows) {
      return rows.map(function (row) {
        return JSON.parse(row.doc_json)
      })
    }

    function deleteDocumentsByIds(collectionName, ids) {
      var name = ensureCollection(collectionName)
      if (!ids.length) return 0
      var placeholders = ids.map(function () { return '?' }).join(', ')
      var statement = db.prepare('DELETE FROM ' + name + ' WHERE doc_id IN (' + placeholders + ')')
      var result = statement.run.apply(statement, ids)
      return result.changes || 0
    }

    return {
      config: sqlConfig,
      storagePath: storagePath,
      ensureCollection: ensureCollection,
      loadCollection: function (collectionName) {
        var name = ensureCollection(collectionName)
        return parseRows(db.prepare('SELECT doc_json FROM ' + name + ' ORDER BY natural ASC').all())
      },
      getDocumentById: function (collectionName, id) {
        var name = ensureCollection(collectionName)
        var row = db.prepare('SELECT doc_json FROM ' + name + ' WHERE doc_id = ?').get(id)
        return row ? JSON.parse(row.doc_json) : null
      },
      upsertDocument: function (collectionName, doc) {
        var name = ensureCollection(collectionName)
        var existing = this.getDocumentById(collectionName, doc && (doc._id || doc.id))
        var record = serializeDocument(collectionName, doc, existing && existing._natural)
        db.prepare(
          'INSERT INTO ' + name + ' (doc_id, selector, time_value, to_value, natural, doc_json) ' +
          'VALUES (?, ?, ?, ?, ?, ?) ' +
          'ON CONFLICT(doc_id) DO UPDATE SET selector = excluded.selector, time_value = excluded.time_value, to_value = excluded.to_value, natural = excluded.natural, doc_json = excluded.doc_json'
        ).run(record.docId, record.selector, record.timeValue, record.toValue, record.natural, record.json)
        return JSON.parse(record.json)
      },
      bulkUpsertDocuments: function (collectionName, docs) {
        var name = ensureCollection(collectionName)
        var self = this
        var statement = db.prepare(
          'INSERT INTO ' + name + ' (doc_id, selector, time_value, to_value, natural, doc_json) ' +
          'VALUES (?, ?, ?, ?, ?, ?) ' +
          'ON CONFLICT(doc_id) DO UPDATE SET selector = excluded.selector, time_value = excluded.time_value, to_value = excluded.to_value, natural = excluded.natural, doc_json = excluded.doc_json'
        )
        db.exec('BEGIN')
        try {
          var rows = (docs || []).map(function (doc) {
            var existing = self.getDocumentById(collectionName, doc && (doc._id || doc.id))
            var record = serializeDocument(collectionName, doc, existing && existing._natural)
            statement.run(record.docId, record.selector, record.timeValue, record.toValue, record.natural, record.json)
            return JSON.parse(record.json)
          })
          db.exec('COMMIT')
          return rows
        } catch (err) {
          db.exec('ROLLBACK')
          throw err
        }
      },
      deleteDocumentsByIds: deleteDocumentsByIds
    }
  }

  return {
    init: init
  }
}
