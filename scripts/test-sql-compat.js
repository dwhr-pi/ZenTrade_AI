const fs = require('fs')
const os = require('os')
const path = require('path')

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

async function main() {
  const dataDir = path.join(os.tmpdir(), 'zenbot-sql-compat')
  fs.rmSync(dataDir, { recursive: true, force: true })

  const conf = {
    db: {
      type: 'sql',
      sql: {
        dialect: 'sqlite',
        directory: dataDir,
        storage: path.join(dataDir, 'zenbot.sqlite'),
        autoProvision: true
      }
    }
  }

  const manager = await sqlConnectionManagerFactory(conf).init()
  conf.db.sql = manager

  const collectionService = collectionServiceFactory(conf)
  const trades = collectionService.getTrades()
  const sessions = collectionService.getSessions()
  const myTrades = collectionService.getMyTrades()
  const resumeMarkers = collectionService.getResumeMarkers()

  await trades.bulkUpsert([
    { _id: 'trade-1', id: 'trade-1', selector: 'gdax.BTC-USD', trade_id: '1', time: 1000, price: 10 },
    { _id: 'trade-2', id: 'trade-2', selector: 'gdax.BTC-USD', trade_id: '2', time: 2000, price: 20 },
    { _id: 'trade-3', id: 'trade-3', selector: 'gdax.ETH-USD', trade_id: '3', time: 1500, price: 30 }
  ])

  const ascTrades = await toArray(
    trades.find({ selector: 'gdax.BTC-USD' }).limit(10).sort({ time: 1 })
  )
  assert(ascTrades.length === 2, 'expected 2 BTC trades')
  assert(ascTrades[0].time === 1000, 'expected ascending sort by time')

  await sessions.insertOne({ _id: 'session-1', id: 'session-1', selector: 'gdax.BTC-USD', started: 10 })
  await sessions.insertOne({ _id: 'session-2', id: 'session-2', selector: 'gdax.BTC-USD', started: 20 })
  const latestSession = await toArray(
    sessions.find({ selector: 'gdax.BTC-USD' }).limit(1).sort({ started: -1 })
  )
  assert(latestSession.length === 1 && latestSession[0].started === 20, 'expected latest session first')

  await myTrades.insertOne({ _id: 'my-1', id: 'my-1', selector: 'gdax.BTC-USD', type: 'buy', time: 1 })
  await myTrades.insertOne({ _id: 'my-2', id: 'my-2', selector: 'gdax.BTC-USD', type: 'sell', time: 2 })
  const naturalDesc = await toArray(
    myTrades.find({ selector: 'gdax.BTC-USD' }).sort({ $natural: -1 }).limit(1)
  )
  assert(naturalDesc.length === 1 && naturalDesc[0]._id === 'my-2', 'expected $natural descending order')

  await resumeMarkers.replaceOne(
    { _id: 'marker-1' },
    { _id: 'marker-1', id: 'marker-1', selector: 'gdax.BTC-USD', from: 1, to: 10 },
    { upsert: true }
  )
  const marker = await new Promise((resolve, reject) => {
    resumeMarkers.findOne({ _id: 'marker-1' }, (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
  assert(marker && marker.to === 10, 'expected resume marker upsert to persist')

  const tradeCount = await trades.count({ selector: 'gdax.BTC-USD' })
  assert(tradeCount === 2, 'expected count() to work')

  console.log('SQL compatibility test passed')
  console.log(manager.storagePath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
