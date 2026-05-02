module.exports = {
  findDocuments: function (documents, query, options) {
    if (!Array.isArray(documents)) return []

    query = query || {}
    options = options || {}

    var results = documents.filter(function (doc) {
      return module.exports.matchesQuery(doc, query)
    })

    if (options.sort) {
      results = module.exports.sortDocuments(results, options.sort)
    }
    if (options.skip) {
      results = results.slice(options.skip)
    }
    if (options.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  },

  matchesQuery: function (doc, query) {
    for (var key in query) {
      if (key === '$or') {
        if (!query[key].some(function (subQuery) {
          return module.exports.matchesQuery(doc, subQuery)
        })) return false
        continue
      }
      if (key === '$and') {
        if (!query[key].every(function (subQuery) {
          return module.exports.matchesQuery(doc, subQuery)
        })) return false
        continue
      }

      var expected = query[key]
      var actual = doc[key]

      if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
        for (var op in expected) {
          var value = expected[op]
          if (op === '$gt' && !(actual > value)) return false
          if (op === '$gte' && !(actual >= value)) return false
          if (op === '$lt' && !(actual < value)) return false
          if (op === '$lte' && !(actual <= value)) return false
          if (op === '$ne' && actual === value) return false
          if (op === '$in' && value.indexOf(actual) === -1) return false
          if (op === '$nin' && value.indexOf(actual) !== -1) return false
        }
      } else if (actual !== expected) {
        return false
      }
    }

    return true
  },

  sortDocuments: function (documents, sortOptions) {
    var entries = Object.keys(sortOptions || {})

    return documents.slice().sort(function (a, b) {
      for (var i = 0; i < entries.length; i++) {
        var key = entries[i]
        var direction = sortOptions[key]

        if (key === '$natural') {
          var aNatural = typeof a._natural === 'number' ? a._natural : 0
          var bNatural = typeof b._natural === 'number' ? b._natural : 0
          if (aNatural < bNatural) return direction === 1 ? -1 : 1
          if (aNatural > bNatural) return direction === 1 ? 1 : -1
          continue
        }

        if (a[key] < b[key]) return direction === 1 ? -1 : 1
        if (a[key] > b[key]) return direction === 1 ? 1 : -1
      }
      return 0
    })
  }
}
