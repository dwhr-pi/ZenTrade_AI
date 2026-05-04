var crypto = require('crypto')
var Readable = require('stream').Readable
var csvAdapter = require('./csv-adapter')

module.exports = function (conf) {
  var sqlManager = conf.db.sql

  function getQueryId(query) {
    if (!query || typeof query !== 'object') return null
    var keys = Object.keys(query)
    if (keys.length !== 1) return null
    if (keys[0] === '_id' || keys[0] === 'id') return query[keys[0]]
    return null
  }

  function cloneDocs(docs) {
    return docs.map(function (doc) {
      return Object.assign({}, doc)
    })
  }

  function resolveCallback(promise, cb) {
    if (typeof cb === 'function') {
      promise.then(function (result) {
        cb(null, result)
      }).catch(function (err) {
        cb(err)
      })
    }
    return promise
  }

  function createCursor(collectionName, query, options) {
    var state = {
      query: query || {},
      sort: (options && options.sort) || null,
      limit: options && options.limit,
      skip: options && options.skip
    }

    function run() {
      var docs = sqlManager.getAllDocuments(collectionName)
      return cloneDocs(csvAdapter.findDocuments(docs, state.query, state))
    }

    return {
      sort: function (sortOptions) {
        state.sort = sortOptions
        return this
      },
      limit: function (limit) {
        state.limit = limit
        return this
      },
      skip: function (skip) {
        state.skip = skip
        return this
      },
      toArray: function (cb) {
        return resolveCallback(Promise.resolve(run()), cb)
      },
      count: function (applySkipLimit, cb) {
        if (typeof applySkipLimit === 'function') {
          cb = applySkipLimit
          applySkipLimit = false
        }

        var promise = Promise.resolve().then(function () {
          if (applySkipLimit) return run().length
          var docs = sqlManager.getAllDocuments(collectionName)
          return csvAdapter.findDocuments(docs, state.query, {}).length
        })

        return resolveCallback(promise, cb)
      },
      stream: function () {
        var stream = Readable.from(run(), { objectMode: true })
        stream.close = function () {
          this.destroy()
        }
        return stream
      }
    }
  }

  function createCollectionInterface(collectionName) {
    return {
      find: function (query, options) {
        return createCursor(collectionName, query, options)
      },

      findOne: function (query, cb) {
        var directId = getQueryId(query)
        var promise = Promise.resolve().then(function () {
          if (directId) return sqlManager.getDocumentById(collectionName, directId)
          return (csvAdapter.findDocuments(sqlManager.getAllDocuments(collectionName), query, { limit: 1 })[0]) || null
        })
        return resolveCallback(promise, cb)
      },

      createIndex: function (spec, options, cb) {
        if (typeof spec === 'function') cb = spec
        else if (typeof options === 'function') cb = options
        return resolveCallback(Promise.resolve(), cb)
      },

      insertOne: function (doc, cb) {
        var insertDoc = Object.assign({}, doc)
        if (!insertDoc.id && !insertDoc._id) {
          insertDoc.id = crypto.randomBytes(8).toString('hex')
        }
        if (!insertDoc._id && insertDoc.id) insertDoc._id = insertDoc.id
        if (typeof insertDoc._natural !== 'number') {
          insertDoc._natural = sqlManager.getNextNatural(collectionName)
        }

        var promise = Promise.resolve().then(function () {
          sqlManager.upsertDocument(collectionName, insertDoc)
          return {
            insertedId: insertDoc._id || insertDoc.id,
            insertedCount: 1,
            result: { ok: 1, n: 1 }
          }
        })

        return resolveCallback(promise, cb)
      },

      insertMany: function (docs, cb) {
        var promise = Promise.resolve().then(function () {
          var insertedIds = []
          var insertDocs = docs.map(function (doc) {
            var insertDoc = Object.assign({}, doc)
            if (!insertDoc.id && !insertDoc._id) {
              insertDoc.id = crypto.randomBytes(8).toString('hex')
            }
            if (!insertDoc._id && insertDoc.id) insertDoc._id = insertDoc.id
            insertedIds.push(insertDoc._id || insertDoc.id)
            return insertDoc
          })
          sqlManager.bulkUpsertDocuments(collectionName, insertDocs)
          return {
            insertedIds: insertedIds,
            insertedCount: docs.length,
            result: { ok: 1, n: docs.length }
          }
        })

        return resolveCallback(promise, cb)
      },

      replaceOne: function (query, replacement, options, cb) {
        options = options || {}
        if (typeof options === 'function') {
          cb = options
          options = {}
        }

        var promise = Promise.resolve().then(function () {
          var directId = getQueryId(query)
          var existing = directId ? sqlManager.getDocumentById(collectionName, directId) : null
          if (!existing && !directId) {
            var docs = sqlManager.getAllDocuments(collectionName)
            existing = csvAdapter.findDocuments(docs, query, { limit: 1 })[0]
          }

          if (existing) {
            var nextDoc = Object.assign({}, replacement)
            nextDoc._natural = existing._natural
            if (!nextDoc._id && nextDoc.id) nextDoc._id = nextDoc.id
            if (!nextDoc.id && nextDoc._id) nextDoc.id = nextDoc._id
            sqlManager.upsertDocument(collectionName, nextDoc)
            return { result: { ok: 1, n: 1 }, matchedCount: 1, modifiedCount: 1 }
          }

          if (options.upsert) {
            return this.insertOne(replacement).then(function () {
              return { result: { ok: 1, n: 1 }, matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }
            })
          }

          return { result: { ok: 1, n: 0 }, matchedCount: 0, modifiedCount: 0 }
        }.bind(this))

        return resolveCallback(promise, cb)
      },

      updateOne: function (query, update, cb) {
        return this.update(query, update, { multi: false }, cb)
      },

      updateMany: function (query, update, cb) {
        return this.update(query, update, { multi: true }, cb)
      },

      update: function (query, update, options, cb) {
        options = options || {}
        if (typeof options === 'function') {
          cb = options
          options = {}
        }

        var promise = Promise.resolve().then(function () {
          var docs = sqlManager.getAllDocuments(collectionName)
          var matches = csvAdapter.findDocuments(docs, query, options.multi ? {} : { limit: 1 })
          var modifiedCount = 0

          matches.forEach(function (match) {
            if (update.$set) {
              Object.assign(match, update.$set)
            }
            sqlManager.upsertDocument(collectionName, match)
            modifiedCount++
          })

          return {
            matchedCount: matches.length,
            modifiedCount: modifiedCount,
            result: { ok: 1, n: modifiedCount }
          }
        })

        return resolveCallback(promise, cb)
      },

      deleteOne: function (query, cb) {
        return this.remove(query, { justOne: true }, cb)
      },

      deleteMany: function (query, cb) {
        return this.remove(query, { justOne: false }, cb)
      },

      remove: function (query, options, cb) {
        options = options || {}
        if (typeof options === 'function') {
          cb = options
          options = {}
        }

        var promise = Promise.resolve().then(function () {
          var docs = sqlManager.getAllDocuments(collectionName)
          var matches = csvAdapter.findDocuments(docs, query, options.justOne ? { limit: 1 } : {})
          var ids = matches.map(function (doc) { return doc._id || doc.id })
          sqlManager.deleteDocumentsByIds(collectionName, ids)
          return {
            deletedCount: matches.length,
            result: { ok: 1, n: matches.length }
          }
        })

        return resolveCallback(promise, cb)
      },

      insert: function (doc, cb) {
        if (Array.isArray(doc)) return this.insertMany(doc, cb)
        return this.insertOne(doc, cb)
      },

      save: function (doc, cb) {
        var id = doc && (doc._id || doc.id)
        if (!id) return this.insertOne(doc, cb)
        return this.replaceOne({ _id: id }, doc, { upsert: true }, cb)
      },

      bulkUpsert: function (docs, cb) {
        var promise = Promise.resolve().then(function () {
          var insertDocs = docs.map(function (doc) {
            var nextDoc = Object.assign({}, doc)
            if (!nextDoc.id && !nextDoc._id) {
              nextDoc.id = crypto.randomBytes(8).toString('hex')
            }
            if (!nextDoc._id && nextDoc.id) nextDoc._id = nextDoc.id
            return nextDoc
          })
          sqlManager.bulkUpsertDocuments(collectionName, insertDocs)
          return {
            insertedCount: insertDocs.length,
            result: { ok: 1, n: insertDocs.length }
          }
        })
        return resolveCallback(promise, cb)
      },

      count: function (query, cb) {
        var promise = Promise.resolve(csvAdapter.findDocuments(sqlManager.getAllDocuments(collectionName), query || {}, {}).length)
        return resolveCallback(promise, cb)
      }
    }
  }

  return {
    getTrades: function () { return createCollectionInterface('trades') },
    getResumeMarkers: function () { return createCollectionInterface('resume_markers') },
    getBalances: function () { return createCollectionInterface('balances') },
    getSessions: function () { return createCollectionInterface('sessions') },
    getPeriods: function () { return createCollectionInterface('periods') },
    getMyTrades: function () { return createCollectionInterface('my_trades') },
    getSimResults: function () { return createCollectionInterface('sim_results') }
  }
}
