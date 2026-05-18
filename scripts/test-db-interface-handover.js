#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')

const csvConnectionManagerFactory = require('../lib/db/csv-connection-manager')
const sqlConnectionManagerFactory = require('../lib/db/sql-connection-manager')
const collectionServiceFactory = require('../lib/services/collection-service')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function toArray(cursor) {
  return new Promise((resolve, reject) => {
    cursor.toArray((err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

function loadConfig(type, baseDir) {
  if (type === 'csv') {
    return {
      db: {
        type: 'csv',
        csv: {
          dataDir: path.join(baseDir, 'csv'),
          syncInterval: 0
        }
      }
    }
  }

  return {
    db: {
      type: 'sql',
      sql: {
        dialect: 'sqlite',
        directory: path.join(baseDir, 'sql'),
        storage: path.join(baseDir, 'sql', 'zenbot.sqlite'),
        autoProvision: true
      }
    }
  }
}

async function initBackend(type, baseDir) {
  const conf = loadConfig(type, baseDir)
  if (type === 'csv') {
    const manager = await csvConnectionManagerFactory(conf).init()
    conf.db.csv = manager
    return conf
  }

  const manager = await sqlConnectionManagerFactory(conf).init()
  conf.db.sql = manager
  return conf
}

async function seedCollections(collectionService) {
  const trades = collectionService.getTrades()
  const sessions = collectionService.getSessions()
  const myTrades = collectionService.getMyTrades()
  const resumeMarkers = collectionService.getResumeMarkers()
  const simResults = collectionService.getSimResults()

  await trades.replaceOne(
    { _id: 'trade-1' },
    { _id: 'trade-1', id: 'trade-1', selector: 'stub.BTC-USD', trade_id: '1', time: 1000, price: 10, size: 0.1 },
    { upsert: true }
  )
  await trades.replaceOne(
    { _id: 'trade-2' },
    { _id: 'trade-2', id: 'trade-2', selector: 'stub.BTC-USD', trade_id: '2', time: 2000, price: 20, size: 0.2 },
    { upsert: true }
  )
  await trades.replaceOne(
    { _id: 'trade-3' },
    { _id: 'trade-3', id: 'trade-3', selector: 'stub.ETH-USD', trade_id: '3', time: 1500, price: 30, size: 0.3 },
    { upsert: true }
  )

  await sessions.insertOne({ _id: 'session-1', id: 'session-1', selector: 'stub.BTC-USD', started: 10, status: 'open' })
  await sessions.insertOne({ _id: 'session-2', id: 'session-2', selector: 'stub.BTC-USD', started: 20, status: 'closed' })

  await myTrades.insertOne({ _id: 'my-1', id: 'my-1', selector: 'stub.BTC-USD', type: 'buy', time: 1, price: 10 })
  await myTrades.insertOne({ _id: 'my-2', id: 'my-2', selector: 'stub.BTC-USD', type: 'sell', time: 2, price: 20 })

  await resumeMarkers.replaceOne(
    { _id: 'marker-1' },
    { _id: 'marker-1', id: 'marker-1', selector: 'stub.BTC-USD', from: 1, to: 10 },
    { upsert: true }
  )

  await simResults.insertOne({
    _id: 'sim-1',
    id: 'sim-1',
    selector: 'stub.BTC-USD',
    time: 3000,
    balance: 1001.5,
    trades: 2
  })
}

async function collectSnapshot(collectionService) {
  const trades = collectionService.getTrades()
  const sessions = collectionService.getSessions()
  const myTrades = collectionService.getMyTrades()
  const resumeMarkers = collectionService.getResumeMarkers()
  const simResults = collectionService.getSimResults()

  const snapshot = {}

  snapshot.tradeAsc = (await toArray(trades.find({ selector: 'stub.BTC-USD' }).sort({ time: 1 }).limit(10)))
    .map(doc => ({ _id: doc._id, time: doc.time, price: doc.price }))

  snapshot.tradeDesc = (await toArray(trades.find({ selector: 'stub.BTC-USD' }).sort({ time: -1 }).limit(1)))
    .map(doc => ({ _id: doc._id, time: doc.time }))

  snapshot.latestSession = (await toArray(sessions.find({ selector: 'stub.BTC-USD' }).sort({ started: -1 }).limit(1)))
    .map(doc => ({ _id: doc._id, started: doc.started, status: doc.status }))

  snapshot.naturalTrade = (await toArray(myTrades.find({ selector: 'stub.BTC-USD' }).sort({ $natural: -1 }).limit(1)))
    .map(doc => ({ _id: doc._id, type: doc.type, time: doc.time }))

  snapshot.resumeMarker = await new Promise((resolve, reject) => {
    resumeMarkers.findOne({ _id: 'marker-1' }, (err, row) => {
      if (err) return reject(err)
      resolve(row ? { _id: row._id, from: row.from, to: row.to } : null)
    })
  })

  snapshot.tradeCount = await trades.count({ selector: 'stub.BTC-USD' })
  snapshot.simResult = (await toArray(simResults.find({ selector: 'stub.BTC-USD' }).limit(1)))
    .map(doc => ({ _id: doc._id, balance: doc.balance, trades: doc.trades }))

  return snapshot
}

async function runBackend(type, baseDir) {
  const firstConf = await initBackend(type, baseDir)
  const firstService = collectionServiceFactory(firstConf)
  await seedCollections(firstService)
  const firstSnapshot = await collectSnapshot(firstService)

  const secondConf = await initBackend(type, baseDir)
  const secondService = collectionServiceFactory(secondConf)
  const secondSnapshot = await collectSnapshot(secondService)

  return {
    firstSnapshot,
    secondSnapshot
  }
}

async function main() {
  const baseDir = path.join(os.tmpdir(), 'zenbot-db-interface-handover')
  fs.rmSync(baseDir, { recursive: true, force: true })
  fs.mkdirSync(baseDir, { recursive: true })

  const csv = await runBackend('csv', baseDir)
  const sql = await runBackend('sql', baseDir)

  assert(JSON.stringify(csv.firstSnapshot) === JSON.stringify(csv.secondSnapshot), 'csv snapshot changed after re-init')
  assert(JSON.stringify(sql.firstSnapshot) === JSON.stringify(sql.secondSnapshot), 'sql snapshot changed after re-init')
  assert(JSON.stringify(csv.firstSnapshot) === JSON.stringify(sql.firstSnapshot), 'csv/sql handover snapshots differ')

  console.log('DB interface handover test passed')
  console.log('CSV and SQL produced matching snapshots before and after re-init.')
  console.log(baseDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
