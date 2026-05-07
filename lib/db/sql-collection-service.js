var crypto = require('crypto')
var Readable = require('stream').Readable
var csvAdapter = require('./csv-adapter')

module.exports = function (conf) {
  var sqlManager = conf.db.sql

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
      var docs = sqlManager.loadCollection(collectionName)
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
          if (applySkipLimit) {
            return run().length
          }
          return csvAdapter.findDocuments(sqlManager.loadCollection(collectionName), state.query, {}).length
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

  function nextNatural(collectionName) {
    return sqlManager.loadCollection(collectionName).length
  }

  function createCollectionInterface(collectionName) {
    return {
      find: function (query, options) {
        return createCursor(collectionName, query, options)
      },

      findOne: function (query, cb) {
        var promise
        if (query && query._id && Object.keys(query).length === 1) {
          promise = Promise.resolve(sqlManager.getDocumentById(collectionName, query._id))
        } else {
          promise = Promise.resolve((csvAdapter.findDocuments(sqlManager.loadCollection(collectionName), query, { limit: 1 })[0]) || null)
        }
        return resolveCallback(promise, cb)
      },

      createIndex: function (spec, options, cb) {
        if (typeof spec === 'function') cb = spec
        else if (typeof options === 'function') cb = options
        sqlManager.ensureCollection(collectionName)
        return resolveCallback(Promise.resolve(), cb)
      },

      insertOne: function (doc, cb) {
        var insertDoc = Object.assign({}, doc)
        if (!insertDoc.id && !insertDoc._id) {
          insertDoc.id = crypto.randomBytes(8).toString('hex')
        }
        if (!insertDoc._id && insertDoc.id) {
          insertDoc._id = insertDoc.id
        }
        insertDoc._natural = nextNatural(collectionName)
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
        var startNatural = nextNatural(collectionName)
        var inserts = (docs || []).map(function (doc, index) {
          var insertDoc = Object.assign({}, doc)
          if (!insertDoc.id && !insertDoc._id) {
            insertDoc.id = crypto.randomBytes(8).toString('hex')
          }
          if (!insertDoc._id && insertDoc.id) {
            insertDoc._id = insertDoc.id
          }
          insertDoc._natural = startNatural + index
          return insertDoc
        })

        var promise = Promise.resolve().then(function () {
          sqlManager.bulkUpsertDocuments(collectionName, inserts)
          return {
            insertedCount: inserts.length,
            insertedIds: inserts.map(function (doc) { return doc._id || doc.id }),
            result: { ok: 1, n: inserts.length }
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
          var existing
          if (query && query._id && Object.keys(query).length === 1) {
            existing = sqlManager.getDocumentById(collectionName, query._id)
          } else {
            existing = (csvAdapter.findDocuments(sqlManager.loadCollection(collectionName), query, { limit: 1 })[0]) || null
          }

          if (!existing && !options.upsert) {
            return {
              matchedCount: 0,
              modifiedCount: 0,
              upsertedCount: 0,
              result: { ok: 1, n: 0 }
            }
          }

          var nextDoc = Object.assign({}, replacement)
          if (!nextDoc._id && !nextDoc.id) {
            nextDoc._id = query && query._id ? query._id : crypto.randomBytes(8).toString('hex')
          }
          if (!nextDoc.id && nextDoc._id) nextDoc.id = nextDoc._id
          if (!nextDoc._id && nextDoc.id) nextDoc._id = nextDoc.id
          if (existing && typeof existing._natural === 'number' && typeof nextDoc._natural !== 'number') {
            nextDoc._natural = existing._natural
          }

          sqlManager.upsertDocument(collectionName, nextDoc)
          return {
            matchedCount: existing ? 1 : 0,
            modifiedCount: 1,
            upsertedCount: existing ? 0 : 1,
            result: { ok: 1, n: 1 }
          }
        })

        return resolveCallback(promise, cb)
      },

      bulkUpsert: function (docs, cb) {
        var promise = Promise.resolve().then(function () {
          sqlManager.bulkUpsertDocuments(collectionName, docs || [])
          return {
            insertedCount: (docs || []).length,
            modifiedCount: (docs || []).length,
            result: { ok: 1, n: (docs || []).length }
          }
        })
        return resolveCallback(promise, cb)
      },

      update: function (query, updateDoc, options, cb) {
        options = options || {}
        if (typeof options === 'function') {
          cb = options
          options = {}
        }

        var promise = Promise.resolve().then(function () {
          var matches = csvAdapter.findDocuments(sqlManager.loadCollection(collectionName), query, options.multi ? {} : { limit: 1 })
          if (!matches.length && !options.upsert) {
            return {
              matchedCount: 0,
              modifiedCount: 0,
              result: { ok: 1, n: 0 }
            }
          }

          if (!matches.length && options.upsert) {
            var upsertDoc = Object.assign({}, query, updateDoc.$set || {})
            if (!upsertDoc._id && query && query._id) upsertDoc._id = query._id
            if (!upsertDoc.id && upsertDoc._id) upsertDoc.id = upsertDoc._id
            sqlManager.upsertDocument(collectionName, upsertDoc)
            return {
              matchedCount: 0,
              modifiedCount: 1,
              upsertedCount: 1,
              result: { ok: 1, n: 1 }
            }
          }

          var modifiedCount = 0
          var updatedDocs = matches.map(function (doc) {
            if (updateDoc.$set) {
              Object.assign(doc, updateDoc.$set)
            }
            if (updateDoc.$unset) {
              Object.keys(updateDoc.$unset).forEach(function (key) {
                delete doc[key]
              })
            }
            modifiedCount++
            return doc
          })

          sqlManager.bulkUpsertDocuments(collectionName, updatedDocs)
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
          var matches = csvAdapter.findDocuments(sqlManager.loadCollection(collectionName), query, options.justOne ? { limit: 1 } : {})
          var ids = matches.map(function (doc) { return doc._id || doc.id }).filter(Boolean)
          var deletedCount = sqlManager.deleteDocumentsByIds(collectionName, ids)
          return {
            deletedCount: deletedCount,
            result: { ok: 1, n: deletedCount }
          }
        })
        return resolveCallback(promise, cb)
      },

      insert: function (doc, cb) {
        if (Array.isArray(doc)) {
          return this.insertMany(doc, cb)
        }
        return this.insertOne(doc, cb)
      },

      save: function (doc, cb) {
        var id = doc && (doc._id || doc.id)
        if (!id) {
          return this.insertOne(doc, cb)
        }

        return this.replaceOne({ _id: id }, doc, { upsert: true }, cb)
      },

      count: function (query, cb) {
        var promise = Promise.resolve(csvAdapter.findDocuments(sqlManager.loadCollection(collectionName), query || {}, {}).length)
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
