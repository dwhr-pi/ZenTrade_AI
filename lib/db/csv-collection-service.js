var crypto = require('crypto')
var Readable = require('stream').Readable
var csvAdapter = require('./csv-adapter')

module.exports = function (conf) {
  var csvManager = conf.db.csv

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
      var docs = csvManager.cache[collectionName] || []
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

          var docs = csvManager.cache[collectionName] || []
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

  function nextNatural(collectionName) {
    var docs = csvManager.cache[collectionName] || []
    return docs.length
  }

  function createCollectionInterface(collectionName) {
    return {
      find: function (query, options) {
        return createCursor(collectionName, query, options)
      },

      findOne: function (query, cb) {
        var promise = Promise.resolve((csvAdapter.findDocuments(csvManager.cache[collectionName], query, { limit: 1 })[0]) || null)
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
        if (!insertDoc._id && insertDoc.id) {
          insertDoc._id = insertDoc.id
        }
        insertDoc._natural = nextNatural(collectionName)
        csvManager.cache[collectionName].push(insertDoc)
        return resolveCallback(csvManager.syncCollection(collectionName).then(function () {
          return {
            insertedId: insertDoc._id || insertDoc.id,
            insertedCount: 1,
            result: { ok: 1, n: 1 }
          }
        }), cb)
      },

      insertMany: function (docs, cb) {
        var insertedIds = []
        docs.forEach(function (doc) {
          var insertDoc = Object.assign({}, doc)
          if (!insertDoc.id && !insertDoc._id) {
            insertDoc.id = crypto.randomBytes(8).toString('hex')
          }
          if (!insertDoc._id && insertDoc.id) {
            insertDoc._id = insertDoc.id
          }
          insertDoc._natural = nextNatural(collectionName)
          insertedIds.push(insertDoc._id || insertDoc.id)
          csvManager.cache[collectionName].push(insertDoc)
        })
        return resolveCallback(csvManager.syncCollection(collectionName).then(function () {
          return {
            insertedIds: insertedIds,
            insertedCount: docs.length,
            result: { ok: 1, n: docs.length }
          }
        }), cb)
      },

      replaceOne: function (query, replacement, options, cb) {
        options = options || {}
        if (typeof options === 'function') {
          cb = options
          options = {}
        }
        var docs = csvManager.cache[collectionName]
        var existing = csvAdapter.findDocuments(docs, query, { limit: 1 })[0]
        var promise

        if (existing) {
          var index = docs.findIndex(function (doc) {
            return doc._id === existing._id || doc.id === existing.id
          })
          var nextDoc = Object.assign({}, replacement)
          nextDoc._natural = existing._natural
          if (!nextDoc._id && nextDoc.id) nextDoc._id = nextDoc.id
          if (!nextDoc.id && nextDoc._id) nextDoc.id = nextDoc._id
          docs[index] = nextDoc
          promise = csvManager.syncCollection(collectionName).then(function () {
            return { result: { ok: 1, n: 1 }, matchedCount: 1, modifiedCount: 1 }
          })
          return resolveCallback(promise, cb)
        }

        if (options.upsert) {
          promise = this.insertOne(replacement).then(function () {
            return { result: { ok: 1, n: 1 }, matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }
          })
          return resolveCallback(promise, cb)
        }

        promise = Promise.resolve({ result: { ok: 1, n: 0 }, matchedCount: 0, modifiedCount: 0 })
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
        var matches = csvAdapter.findDocuments(csvManager.cache[collectionName], query, options.multi ? {} : { limit: 1 })
        var modifiedCount = 0
        matches.forEach(function (match) {
          var index = csvManager.cache[collectionName].findIndex(function (doc) {
            return doc._id === match._id || doc.id === match.id
          })
          if (index === -1) return
          if (update.$set) {
            Object.assign(csvManager.cache[collectionName][index], update.$set)
            modifiedCount++
          }
        })
        return resolveCallback(csvManager.syncCollection(collectionName).then(function () {
          return {
            matchedCount: matches.length,
            modifiedCount: modifiedCount,
            result: { ok: 1, n: modifiedCount }
          }
        }), cb)
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
        var matches = csvAdapter.findDocuments(csvManager.cache[collectionName], query, options.justOne ? { limit: 1 } : {})
        var ids = matches.map(function (doc) { return doc._id || doc.id })
        csvManager.cache[collectionName] = csvManager.cache[collectionName].filter(function (doc) {
          return ids.indexOf(doc._id || doc.id) === -1
        })
        return resolveCallback(csvManager.syncCollection(collectionName).then(function () {
          return {
            deletedCount: matches.length,
            result: { ok: 1, n: matches.length }
          }
        }), cb)
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
        var promise = Promise.resolve(csvAdapter.findDocuments(csvManager.cache[collectionName], query || {}, {}).length)
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
