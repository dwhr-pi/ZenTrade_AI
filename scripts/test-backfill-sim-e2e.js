#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')
const childProcess = require('child_process')

const csvConnectionManagerFactory = require('../lib/db/csv-connection-manager')
const sqlConnectionManagerFactory = require('../lib/db/sql-connection-manager')
const collectionServiceFactory = require('../lib/services/collection-service')

const repoRoot = path.resolve(__dirname, '..')

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

function runZenbot(args, label) {
  const result = childProcess.spawnSync(process.execPath, ['zenbot.js'].concat(args), {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 180000
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const output = [result.stdout || '', result.stderr || ''].join('\n').trim()
    throw new Error(label + ' failed with exit code ' + result.status + (output ? '\n' + output : ''))
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  }
}

function writeTempConf(type, baseDir) {
  const confPath = path.join(baseDir, type + '.e2e.conf.js')
  const isCsv = type === 'csv'
  const contents = [
    'var c = module.exports = {}',
    '',
    'c.db = {}',
    "c.db.type = '" + type + "'",
    isCsv ? 'c.db.csv = {}' : 'c.db.sql = {}',
    isCsv
      ? "c.db.csv.dataDir = '" + path.join(baseDir, 'csv-data').replace(/\\/g, '\\\\') + "'"
      : "c.db.sql.dialect = 'sqlite'",
    isCsv
      ? 'c.db.csv.syncInterval = 0'
      : "c.db.sql.directory = '" + path.join(baseDir, 'sql-data').replace(/\\/g, '\\\\') + "'",
    isCsv
      ? ''
      : "c.db.sql.storage = '" + path.join(baseDir, 'sql-data', 'zenbot.sqlite').replace(/\\/g, '\\\\') + "'",
    isCsv ? '' : 'c.db.sql.autoProvision = true',
    '',
    "c.selector = 'stub.BTC-USD'",
    "c.strategy = 'volume_universal'",
    'c.days = 1',
    'c.poll_trades = 1000',
    "c.filename = 'none'",
    'c.output = {}',
    'c.output.api = {}',
    'c.output.api.on = false',
    ''
  ].filter(Boolean).join('\n')

  fs.writeFileSync(confPath, contents)
  return confPath
}

async function initBackend(type, baseDir) {
  const conf = {
    db: {
      type: type
    }
  }

  if (type === 'csv') {
    conf.db.csv = {
      dataDir: path.join(baseDir, 'csv-data'),
      syncInterval: 0
    }
    const manager = await csvConnectionManagerFactory(conf).init()
    conf.db.csv = manager
    return conf
  }

  conf.db.sql = {
    dialect: 'sqlite',
    directory: path.join(baseDir, 'sql-data'),
    storage: path.join(baseDir, 'sql-data', 'zenbot.sqlite'),
    autoProvision: true
  }
  const manager = await sqlConnectionManagerFactory(conf).init()
  conf.db.sql = manager
  return conf
}

async function inspectBackend(type, baseDir) {
  const conf = await initBackend(type, baseDir)
  const collectionService = collectionServiceFactory(conf)
  const trades = collectionService.getTrades()
  const simResults = collectionService.getSimResults()

  const tradeRows = await toArray(
    trades.find({ selector: 'stub.BTC-USD' }).sort({ time: 1 }).limit(5)
  )
  const simRows = await toArray(
    simResults.find({}).sort({ $natural: -1 }).limit(1)
  )

  assert(tradeRows.length > 0, type + ' backend has no backfilled trades')
  assert(simRows.length > 0, type + ' backend has no sim_results entry')

  const latest = simRows[0]
  const latestSelector = typeof latest.selector === 'string'
    ? latest.selector
    : (latest.selector && latest.selector.normalized)
  assert(latestSelector === 'stub.BTC-USD', type + ' sim_results selector mismatch')
  assert(latest.simresults && typeof latest.simresults.currency !== 'undefined', type + ' sim_results payload missing currency')
  assert(typeof latest.simresults.end_balance !== 'undefined', type + ' sim_results payload missing end_balance')
  assert(typeof latest.simresults.start_capital !== 'undefined', type + ' sim_results payload missing start_capital')
  assert(latest.simresults.end_balance > 0, type + ' end_balance should be greater than zero')
  assert(latest.simresults.start_capital > 0, type + ' start_capital should be greater than zero')

  return {
    tradeCount: await trades.count({ selector: 'stub.BTC-USD' }),
    latestBalance: latest.simresults.end_balance,
    startCapital: latest.simresults.start_capital,
    latestVsBuyHold: latest.simresults.vs_buy_hold
  }
}

async function runBackend(type) {
  const baseDir = path.join(os.tmpdir(), 'zenbot-backfill-sim-e2e-' + type)
  fs.rmSync(baseDir, { recursive: true, force: true })
  fs.mkdirSync(baseDir, { recursive: true })

  const confPath = writeTempConf(type, baseDir)

  runZenbot(['backfill', 'stub.BTC-USD', '--conf', confPath, '--days', '1'], type + ' backfill')
  runZenbot(['sim', 'stub.BTC-USD', '--conf', confPath, '--strategy', 'volume_universal', '--days', '1', '--silent', '--filename', 'none'], type + ' sim')

  return inspectBackend(type, baseDir)
}

async function main() {
  const csv = await runBackend('csv')
  const sql = await runBackend('sql')

  console.log('Backfill/sim e2e smoke test passed')
  console.log('csv trades=' + csv.tradeCount + ' start_capital=' + csv.startCapital + ' end_balance=' + csv.latestBalance + ' vs_buy_hold=' + csv.latestVsBuyHold)
  console.log('sql trades=' + sql.tradeCount + ' start_capital=' + sql.startCapital + ' end_balance=' + sql.latestBalance + ' vs_buy_hold=' + sql.latestVsBuyHold)
}

main().catch((err) => {
  console.error(err.stack || err.message || err)
  process.exit(1)
})
