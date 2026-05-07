#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const minimist = require('minimist')

function parseArgs() {
  const args = minimist(process.argv.slice(2), {
    string: ['db', 'out', 'schema'],
    boolean: ['help'],
    alias: {
      h: 'help'
    }
  })

  if (args.help) {
    console.log('Usage: node ./scripts/export-access-package.js --db <sqlite-file> [--out <dir>] [--schema <file>]')
    process.exit(0)
  }

  if (!args.db) {
    console.error('Missing required argument: --db <sqlite-file>')
    process.exit(1)
  }

  return {
    dbPath: path.resolve(process.cwd(), args.db),
    outDir: path.resolve(process.cwd(), args.out || path.join('exports', 'access_package')),
    schemaPath: path.resolve(
      process.cwd(),
      args.schema || path.join('neue Strategien und Scripte', 'zenbot_microsoft_access_database', 'zenbot_access_db.sql')
    ),
    queryPackPath: path.resolve(
      process.cwd(),
      path.join('docs', 'installation', 'access-query-pack.sql')
    )
  }
}

function ensureSqlite() {
  try {
    return require('node:sqlite')
  } catch (err) {
    console.error('This script requires Node.js with built-in node:sqlite support.')
    process.exit(1)
  }
}

function parseSelector(value) {
  if (!value) {
    return {
      normalized: '',
      exchange: '',
      asset: '',
      currency: '',
      symbol: ''
    }
  }

  if (typeof value === 'object') {
    return {
      normalized: value.normalized || '',
      exchange: value.exchange_id || '',
      asset: value.asset || '',
      currency: value.currency || '',
      symbol: value.asset && value.currency ? value.asset + '/' + value.currency : (value.product_id || '')
    }
  }

  const normalized = String(value)
  const firstDot = normalized.indexOf('.')
  const exchange = firstDot >= 0 ? normalized.slice(0, firstDot) : ''
  const product = firstDot >= 0 ? normalized.slice(firstDot + 1) : normalized
  const dash = product.indexOf('-')
  const asset = dash >= 0 ? product.slice(0, dash) : product
  const currency = dash >= 0 ? product.slice(dash + 1) : ''

  return {
    normalized: normalized,
    exchange: exchange,
    asset: asset,
    currency: currency,
    symbol: asset && currency ? asset + '/' + currency : product
  }
}

function toAccessDate(value) {
  if (value === null || typeof value === 'undefined' || value === '') return ''
  const date = typeof value === 'number' ? new Date(value) : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function toNumber(value) {
  if (value === null || typeof value === 'undefined' || value === '') return ''
  const n = Number(value)
  return Number.isFinite(n) ? n : ''
}

function csvEscape(value) {
  const text = value === null || typeof value === 'undefined' ? '' : String(value)
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}

function writeCsv(file, headers, rows) {
  const lines = [headers.join(',')]
  rows.forEach(function (row) {
    lines.push(headers.map(function (header) {
      return csvEscape(row[header])
    }).join(','))
  })
  fs.writeFileSync(file, lines.join('\n'))
}

function loadCollections(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'zb_%' ORDER BY name").all()
  const collections = {}

  tables.forEach(function (row) {
    const tableName = row.name
    const rows = db.prepare('SELECT doc_json FROM ' + tableName + ' ORDER BY natural ASC').all()
    collections[tableName.replace(/^zb_/, '')] = rows.map(function (entry) {
      return JSON.parse(entry.doc_json)
    })
  })

  return collections
}

function getLatestTime(doc) {
  return doc && (doc.time || doc.updated_at || doc.created_at || doc.end || doc.end_time || doc.start || doc.start_time) || ''
}

function latestBy(collection, keyFn) {
  const map = new Map()
  ;(collection || []).forEach(function (doc) {
    const key = keyFn(doc)
    if (!key) return
    const current = map.get(key)
    if (!current || Number(getLatestTime(doc) || 0) >= Number(getLatestTime(current) || 0)) {
      map.set(key, doc)
    }
  })
  return map
}

function collectAssets(collections) {
  const selectors = new Map()

  function addFromDoc(doc) {
    const selector = parseSelector(doc && doc.selector ? doc.selector : '')
    if (!selector.normalized) return
    if (!selectors.has(selector.normalized)) {
      selectors.set(selector.normalized, selector)
    }
  }

  Object.keys(collections).forEach(function (name) {
    collections[name].forEach(addFromDoc)
  })

  return Array.from(selectors.values()).sort(function (a, b) {
    return a.normalized.localeCompare(b.normalized)
  }).map(function (selector, index) {
    return {
      AssetID: index + 1,
      Symbol: selector.symbol,
      Name: selector.asset,
      Exchange: selector.exchange,
      BaseCurrency: selector.asset,
      QuoteCurrency: selector.currency,
      IsActive: 'Yes',
      CreatedDate: '',
      LastUpdated: '',
      _selector: selector.normalized
    }
  })
}

function collectStrategies(collections) {
  const strategies = new Map()

  ;(collections.sim_results || []).forEach(function (doc) {
    if (!doc.strategy) return
    if (!strategies.has(doc.strategy)) {
      strategies.set(doc.strategy, {
        StrategyName: doc.strategy,
        Description: 'Exported from Zenbot sim_results',
        Parameters: JSON.stringify({
          period_length: doc.period_length,
          min_periods: doc.min_periods,
          order_type: doc.order_type,
          buy_pct: doc.buy_pct,
          sell_pct: doc.sell_pct
        }),
        IsActive: 'Yes',
        CreatedDate: '',
        LastUpdated: ''
      })
    }
  })

  return Array.from(strategies.values()).sort(function (a, b) {
    return a.StrategyName.localeCompare(b.StrategyName)
  }).map(function (row, index) {
    row.StrategyID = index + 1
    return row
  })
}

function buildDerivedTradeBuckets(collections) {
  const buckets = new Map()

  ;(collections.trades || []).forEach(function (doc) {
    const selector = parseSelector(doc.selector).normalized
    const tradeTime = Number(doc.time)
    const price = Number(doc.price)
    const size = Number(doc.size || doc.quantity || doc.asset_amount)

    if (!selector || !Number.isFinite(tradeTime) || !Number.isFinite(price)) return

    const bucketTime = Math.floor(tradeTime / 60000) * 60000
    const key = selector + ':' + bucketTime
    const current = buckets.get(key)

    if (!current) {
      buckets.set(key, {
        selector: selector,
        time: bucketTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: Number.isFinite(size) ? size : 0,
        tradeCount: 1,
        notional: Number.isFinite(size) ? size * price : 0
      })
      return
    }

    current.high = Math.max(current.high, price)
    current.low = Math.min(current.low, price)
    current.close = price
    current.tradeCount += 1
    if (Number.isFinite(size)) {
      current.volume += size
      current.notional += size * price
    }
  })

  return Array.from(buckets.values()).sort(function (a, b) {
    if (a.selector === b.selector) return a.time - b.time
    return a.selector.localeCompare(b.selector)
  })
}

function collectCandles(collections, assetBySelector) {
  const periods = collections.periods || []
  if (periods.length) {
    return periods.map(function (doc, index) {
      return {
        CandleID: index + 1,
        AssetID: assetBySelector.get(parseSelector(doc.selector).normalized) || '',
        Timestamp: toAccessDate(doc.time),
        OpenPrice: toNumber(doc.open),
        HighPrice: toNumber(doc.high),
        LowPrice: toNumber(doc.low),
        ClosePrice: toNumber(doc.close),
        Volume: toNumber(doc.volume),
        Timeframe: doc.period_id || doc.period || '',
        CreatedDate: toAccessDate(doc.time)
      }
    })
  }

  return buildDerivedTradeBuckets(collections).map(function (doc, index) {
    return {
      CandleID: index + 1,
      AssetID: assetBySelector.get(doc.selector) || '',
      Timestamp: toAccessDate(doc.time),
      OpenPrice: toNumber(doc.open),
      HighPrice: toNumber(doc.high),
      LowPrice: toNumber(doc.low),
      ClosePrice: toNumber(doc.close),
      Volume: toNumber(doc.volume),
      Timeframe: '1m_derived',
      CreatedDate: toAccessDate(doc.time)
    }
  })
}

function collectTrades(collections, assetBySelector, strategyByName) {
  const sourceTrades = (collections.my_trades && collections.my_trades.length) ? collections.my_trades : (collections.trades || [])
  const latestStrategiesBySelector = latestBy(collections.sim_results || [], function (doc) {
    return parseSelector(doc.selector).normalized
  })

  return sourceTrades.map(function (doc, index) {
    const selector = parseSelector(doc.selector).normalized
    const inferredStrategy = latestStrategiesBySelector.get(selector)
    const quantity = toNumber(doc.size || doc.asset_amount || doc.quantity)
    const price = toNumber(doc.price)

    return {
      TradeID: index + 1,
      AssetID: assetBySelector.get(selector) || '',
      StrategyID: strategyByName.get(doc.strategy || (inferredStrategy && inferredStrategy.strategy) || '') || '',
      TradeType: String(doc.type || doc.side || '').toUpperCase(),
      Quantity: quantity,
      Price: price,
      TotalValue: price !== '' && quantity !== '' ? Number(price) * Number(quantity) : '',
      Fee: toNumber(doc.fee),
      Timestamp: toAccessDate(doc.time),
      OrderID: doc.order_id || doc.id || doc._id || '',
      Status: doc.status || 'COMPLETED',
      Notes: doc.note || '',
      CreatedDate: toAccessDate(doc.time)
    }
  })
}

function collectPortfolio(collections, assetBySelector) {
  const balances = collections.balances || []
  if (balances.length) {
    return balances.map(function (doc, index) {
      return {
        PortfolioID: index + 1,
        AssetID: assetBySelector.get(parseSelector(doc.selector).normalized) || '',
        Quantity: toNumber(doc.asset),
        AveragePrice: toNumber(doc.asset_price),
        TotalValue: toNumber(doc.currency),
        LastUpdated: toAccessDate(doc.time || doc.updated_at)
      }
    })
  }

  const latestSimBySelector = latestBy(collections.sim_results || [], function (doc) {
    return parseSelector(doc.selector).normalized
  })

  return Array.from(latestSimBySelector.entries()).sort(function (a, b) {
    return a[0].localeCompare(b[0])
  }).map(function (entry, index) {
    const selector = entry[0]
    const doc = entry[1]
    const sim = doc.simresults || {}
    const quantity = toNumber(sim.asset_capital || doc.asset_capital)
    const averagePrice = toNumber(sim.last_assest_value || sim.last_asset_value || doc.last_assest_value || doc.last_asset_value)
    const totalValue = quantity !== '' && averagePrice !== ''
      ? Number(quantity) * Number(averagePrice)
      : toNumber(sim.currency || sim.net_currency || doc.net_currency || doc.currency_capital)

    return {
      PortfolioID: index + 1,
      AssetID: assetBySelector.get(selector) || '',
      Quantity: quantity,
      AveragePrice: averagePrice,
      TotalValue: totalValue,
      LastUpdated: toAccessDate(getLatestTime(doc))
    }
  })
}

function collectSessions(collections, strategyByName) {
  const sessions = collections.sessions || []
  if (sessions.length) {
    return sessions.map(function (doc, index) {
      return {
        SessionID: index + 1,
        StrategyID: strategyByName.get(doc.strategy) || '',
        StartTime: toAccessDate(doc.start || doc.start_time || doc.created_at),
        EndTime: toAccessDate(doc.end || doc.end_time || doc.updated_at),
        InitialBalance: toNumber(doc.start_capital || doc.currency_capital),
        FinalBalance: toNumber(doc.net_currency || doc.currency),
        TotalTrades: toNumber(doc.total_trades),
        ProfitLoss: toNumber(doc.profit),
        Status: doc.status || 'COMPLETED',
        Notes: doc.note || ''
      }
    })
  }

  const resumeBySelector = latestBy(collections.resume_markers || [], function (doc) {
    return parseSelector(doc.selector).normalized
  })

  return (collections.sim_results || []).map(function (doc, index) {
    const selector = parseSelector(doc.selector).normalized
    const sim = doc.simresults || {}
    const resume = resumeBySelector.get(selector)
    const startCapital = toNumber(sim.start_capital || doc.currency_capital)
    const finalBalance = toNumber(doc.net_currency || sim.currency)
    const startForProfit = Number(startCapital || 0)
    const finalForProfit = Number(finalBalance || 0)
    const derivedProfit = finalBalance !== '' && startCapital !== '' ? finalForProfit - startForProfit : ''

    return {
      SessionID: index + 1,
      StrategyID: strategyByName.get(doc.strategy) || '',
      StartTime: toAccessDate(doc.start || (resume && resume.from) || doc.created_at),
      EndTime: toAccessDate((resume && resume.to) || doc.time || doc.updated_at),
      InitialBalance: startCapital,
      FinalBalance: finalBalance,
      TotalTrades: toNumber(sim.total_trades || doc.total_trades),
      ProfitLoss: toNumber(typeof sim.profit !== 'undefined' ? sim.profit : derivedProfit),
      Status: 'COMPLETED',
      Notes: selector ? ('Derived from sim_results for ' + selector) : 'Derived from sim_results'
    }
  })
}

function collectIndicatorsFromPeriods(periods, assetBySelector) {
  return periods.flatMap(function (doc, index) {
    const selector = parseSelector(doc.selector).normalized
    const assetId = assetBySelector.get(selector) || ''
    const timestamp = toAccessDate(doc.time)
    const timeframe = doc.period_id || doc.period || ''
    const candidates = [
      ['RSI', doc.rsi],
      ['EMA_SHORT', doc.ema_short],
      ['EMA_LONG', doc.ema_long],
      ['VWAP', doc.vwap]
    ]

    return candidates.filter(function (entry) {
      return entry[1] !== null && typeof entry[1] !== 'undefined'
    }).map(function (entry, innerIndex) {
      return {
        IndicatorID: (index * 10) + innerIndex + 1,
        AssetID: assetId,
        IndicatorType: entry[0],
        Value: toNumber(entry[1]),
        Timestamp: timestamp,
        Timeframe: timeframe,
        CreatedDate: timestamp
      }
    })
  })
}

function collectIndicatorsFromTrades(collections, assetBySelector) {
  const rows = []

  buildDerivedTradeBuckets(collections).forEach(function (bucket, index) {
    const assetId = assetBySelector.get(bucket.selector) || ''
    const timestamp = toAccessDate(bucket.time)
    const baseId = index * 10

    rows.push({
      IndicatorID: baseId + 1,
      AssetID: assetId,
      IndicatorType: 'VWAP_DERIVED',
      Value: bucket.volume > 0 ? toNumber(bucket.notional / bucket.volume) : '',
      Timestamp: timestamp,
      Timeframe: '1m_derived',
      CreatedDate: timestamp
    })
    rows.push({
      IndicatorID: baseId + 2,
      AssetID: assetId,
      IndicatorType: 'TRADE_COUNT',
      Value: bucket.tradeCount,
      Timestamp: timestamp,
      Timeframe: '1m_derived',
      CreatedDate: timestamp
    })
    rows.push({
      IndicatorID: baseId + 3,
      AssetID: assetId,
      IndicatorType: 'VOLUME_DERIVED',
      Value: toNumber(bucket.volume),
      Timestamp: timestamp,
      Timeframe: '1m_derived',
      CreatedDate: timestamp
    })
    rows.push({
      IndicatorID: baseId + 4,
      AssetID: assetId,
      IndicatorType: 'LAST_PRICE',
      Value: toNumber(bucket.close),
      Timestamp: timestamp,
      Timeframe: '1m_derived',
      CreatedDate: timestamp
    })
  })

  return rows
}

function collectIndicators(collections, assetBySelector) {
  const periods = collections.periods || []
  if (periods.length) {
    return collectIndicatorsFromPeriods(periods, assetBySelector)
  }
  return collectIndicatorsFromTrades(collections, assetBySelector)
}

function collectConfiguration(collections, dbPath, schemaPath) {
  const latestSim = (collections.sim_results || []).slice(-1)[0]
  const periodCount = (collections.periods || []).length
  const rawTradeCount = (collections.trades || []).length
  const rows = [
    {
      ConfigID: 1,
      ConfigKey: 'EXPORT_SOURCE_DB',
      ConfigValue: dbPath,
      Description: 'SQLite source used for Access package export',
      LastUpdated: toAccessDate(Date.now())
    },
    {
      ConfigID: 2,
      ConfigKey: 'ACCESS_SCHEMA_PATH',
      ConfigValue: schemaPath,
      Description: 'Access schema file bundled into the export package',
      LastUpdated: toAccessDate(Date.now())
    },
    {
      ConfigID: 3,
      ConfigKey: 'ACCESS_EXPORT_MODE',
      ConfigValue: periodCount ? 'native_periods' : 'trade_derived_fallbacks',
      Description: 'Shows whether Access tables were filled from periods or derived from raw trades and sim_results',
      LastUpdated: toAccessDate(Date.now())
    },
    {
      ConfigID: 4,
      ConfigKey: 'RAW_TRADE_COUNT',
      ConfigValue: String(rawTradeCount),
      Description: 'Number of raw trades present in the SQL source',
      LastUpdated: toAccessDate(Date.now())
    }
  ]

  if (latestSim) {
    rows.push({
      ConfigID: rows.length + 1,
      ConfigKey: 'LAST_SIM_STRATEGY',
      ConfigValue: latestSim.strategy || '',
      Description: 'Most recent strategy seen in sim_results',
      LastUpdated: toAccessDate(Date.now())
    })
    rows.push({
      ConfigID: rows.length + 1,
      ConfigKey: 'LAST_SIM_SELECTOR',
      ConfigValue: parseSelector(latestSim.selector).normalized,
      Description: 'Most recent selector seen in sim_results',
      LastUpdated: toAccessDate(Date.now())
    })
  }

  return rows
}

function collectErrorLogs() {
  return []
}

function rawCollectionRows(collections) {
  return Object.keys(collections).sort().map(function (name) {
    return {
      name: name,
      rows: collections[name].map(function (doc, index) {
        return {
          RowID: index + 1,
          Collection: name,
          DocumentID: doc._id || doc.id || '',
          Selector: typeof doc.selector === 'string' ? doc.selector : parseSelector(doc.selector).normalized,
          TimeValue: toNumber(doc.time || doc.updated_at || doc.created_at),
          Json: JSON.stringify(doc)
        }
      })
    }
  })
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeReadme(outDir, dbPath, collections, hasQueryPack) {
  const hasPeriods = (collections.periods || []).length > 0
  const content = [
    '# Access Export Package',
    '',
    'Dieses Paket wurde aus dem lokalen Zenbot-SQL-Bestand exportiert.',
    '',
    '## Inhalt',
    '',
    '- `access_schema.sql` mit dem vorhandenen Access-Schema',
    '- CSV-Dateien fuer die Access-Zieltabelle',
    '- `raw/` mit den originalen Zenbot-Collections als JSON-CSV-Export',
    '- `manifest.json` mit Zaehlern und Quellenhinweisen',
    '',
    '## Quelle',
    '',
    '- SQLite-Datei: `' + dbPath.replace(/\\/g, '/') + '`',
    '',
    '## Exportmodus',
    '',
    hasPeriods
      ? '- `periods` waren vorhanden und wurden direkt nach Access uebertragen.'
      : '- `periods` fehlten, deshalb wurden Candles und Indikatoren aus den Rohtrades abgeleitet.',
    '- Wenn `sessions` oder `balances` fehlen, erzeugt der Exporter benoetigte Snapshots aus `sim_results`.',
    '',
    '## Import in Access',
    '',
    '- Zuerst `access_schema.sql` in einer leeren Access-Datenbank ausfuehren.',
    '- Danach die CSV-Dateien in dieser Reihenfolge importieren: `Assets`, `Strategies`, `Bot_Configuration`, `Portfolio`, `Trading_Sessions`, `Trades`, `Candlestick_Data`, `Market_Indicators`, `Error_Logs`.',
    '- Details stehen in `docs/installation/access-import-de.md` im Projekt.',
    hasQueryPack ? '- Fuer typische Auswertungen liegt zusaetzlich `access_query_pack.sql` im Paket.' : '',
    '',
    '## Hinweis',
    '',
    '- Nicht jede Zenbot-Collection passt 1:1 in das Access-Schema.',
    '- Deshalb enthaelt das Paket sowohl gemappte Access-Tabellen als auch Rohdaten-Exporte.'
  ].join('\n')
  fs.writeFileSync(path.join(outDir, 'README.md'), content)
}

function main() {
  const opts = parseArgs()
  const sqlite = ensureSqlite()

  if (!fs.existsSync(opts.dbPath)) {
    console.error('SQLite file not found: ' + opts.dbPath)
    process.exit(1)
  }

  if (!fs.existsSync(opts.schemaPath)) {
    console.error('Access schema file not found: ' + opts.schemaPath)
    process.exit(1)
  }

  ensureDir(opts.outDir)
  ensureDir(path.join(opts.outDir, 'raw'))

  const db = new sqlite.DatabaseSync(opts.dbPath)
  const collections = loadCollections(db)
  db.close()

  const assets = collectAssets(collections)
  const assetBySelector = new Map(assets.map(function (row) { return [row._selector, row.AssetID] }))
  const strategies = collectStrategies(collections)
  const strategyByName = new Map(strategies.map(function (row) { return [row.StrategyName, row.StrategyID] }))

  const mapped = {
    Assets: assets.map(function (row) {
      return {
        AssetID: row.AssetID,
        Symbol: row.Symbol,
        Name: row.Name,
        Exchange: row.Exchange,
        BaseCurrency: row.BaseCurrency,
        QuoteCurrency: row.QuoteCurrency,
        IsActive: row.IsActive,
        CreatedDate: row.CreatedDate,
        LastUpdated: row.LastUpdated
      }
    }),
    Strategies: strategies,
    Candlestick_Data: collectCandles(collections, assetBySelector),
    Trades: collectTrades(collections, assetBySelector, strategyByName),
    Portfolio: collectPortfolio(collections, assetBySelector),
    Trading_Sessions: collectSessions(collections, strategyByName),
    Market_Indicators: collectIndicators(collections, assetBySelector),
    Bot_Configuration: collectConfiguration(collections, opts.dbPath, opts.schemaPath),
    Error_Logs: collectErrorLogs()
  }

  const headers = {
    Assets: ['AssetID', 'Symbol', 'Name', 'Exchange', 'BaseCurrency', 'QuoteCurrency', 'IsActive', 'CreatedDate', 'LastUpdated'],
    Strategies: ['StrategyID', 'StrategyName', 'Description', 'Parameters', 'IsActive', 'CreatedDate', 'LastUpdated'],
    Candlestick_Data: ['CandleID', 'AssetID', 'Timestamp', 'OpenPrice', 'HighPrice', 'LowPrice', 'ClosePrice', 'Volume', 'Timeframe', 'CreatedDate'],
    Trades: ['TradeID', 'AssetID', 'StrategyID', 'TradeType', 'Quantity', 'Price', 'TotalValue', 'Fee', 'Timestamp', 'OrderID', 'Status', 'Notes', 'CreatedDate'],
    Portfolio: ['PortfolioID', 'AssetID', 'Quantity', 'AveragePrice', 'TotalValue', 'LastUpdated'],
    Trading_Sessions: ['SessionID', 'StrategyID', 'StartTime', 'EndTime', 'InitialBalance', 'FinalBalance', 'TotalTrades', 'ProfitLoss', 'Status', 'Notes'],
    Market_Indicators: ['IndicatorID', 'AssetID', 'IndicatorType', 'Value', 'Timestamp', 'Timeframe', 'CreatedDate'],
    Bot_Configuration: ['ConfigID', 'ConfigKey', 'ConfigValue', 'Description', 'LastUpdated'],
    Error_Logs: ['LogID', 'LogLevel', 'Message', 'StackTrace', 'Timestamp', 'Source']
  }

  Object.keys(mapped).forEach(function (tableName) {
    writeCsv(path.join(opts.outDir, tableName + '.csv'), headers[tableName], mapped[tableName])
  })

  rawCollectionRows(collections).forEach(function (entry) {
    writeCsv(
      path.join(opts.outDir, 'raw', entry.name + '.csv'),
      ['RowID', 'Collection', 'DocumentID', 'Selector', 'TimeValue', 'Json'],
      entry.rows
    )
  })

  fs.copyFileSync(opts.schemaPath, path.join(opts.outDir, 'access_schema.sql'))
  const hasQueryPack = fs.existsSync(opts.queryPackPath)
  if (hasQueryPack) {
    fs.copyFileSync(opts.queryPackPath, path.join(opts.outDir, 'access_query_pack.sql'))
  }
  writeReadme(opts.outDir, opts.dbPath, collections, hasQueryPack)

  const manifest = {
    created_at: new Date().toISOString(),
    source_sqlite: opts.dbPath,
    source_schema: opts.schemaPath,
    source_query_pack: hasQueryPack ? opts.queryPackPath : null,
    mapped_tables: Object.fromEntries(Object.keys(mapped).map(function (name) {
      return [name, mapped[name].length]
    })),
    raw_collections: Object.fromEntries(Object.keys(collections).map(function (name) {
      return [name, collections[name].length]
    }))
  }

  fs.writeFileSync(path.join(opts.outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log('Access export package created:')
  console.log(opts.outDir)
}

main()
