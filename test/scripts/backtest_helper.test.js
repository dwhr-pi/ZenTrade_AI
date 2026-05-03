const test = require('node:test')
const assert = require('node:assert/strict')
const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const helperScript = path.resolve(__dirname, '../../scripts/backtest_helper.js')

function runHelper(args, cwd) {
  return childProcess.execFileSync(process.execPath, [helperScript, ...args], {
    cwd,
    encoding: 'utf8'
  })
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}

function withTempRoot(fn) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zenbot-backtest-helper-'))
  try {
    fn(tempRoot)
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
}

test('discovers selectors from exchange products and respects limits', () => {
  withTempRoot((tempRoot) => {
    writeJson(path.join(tempRoot, 'extensions', 'exchanges', 'stub', 'products.json'), [
      { asset: 'BTC', currency: 'USD' },
      { asset: 'ETH', currency: 'USD' },
      { asset: 'BTC', currency: 'USD' },
      { asset: '', currency: 'USD' }
    ])

    const output = runHelper(['discover-selectors', '.', 'stub', '2'], tempRoot)
    assert.equal(output, 'stub.BTC-USD\nstub.ETH-USD\n')
  })
})

test('builds a structured result row for successful runs', () => {
  withTempRoot((tempRoot) => {
    const csvDir = path.join(tempRoot, 'data')
    const logFile = path.join(tempRoot, 'run.log')
    const reportFile = path.join(tempRoot, 'report.txt')
    const simResultFile = path.join(tempRoot, 'sim-result.json')

    fs.writeFileSync(logFile, [
      'end balance: 110.00',
      'buy hold: 108.00',
      'vs. buy hold: 2.00%',
      '4 trades over 7 days',
      'win/loss: 3/1',
      'error rate: 0.00%'
    ].join('\n'))
    fs.writeFileSync(reportFile, 'report')
    writeJson(simResultFile, {
      simresults: {
        currency: '110',
        profit: '0.1',
        buy_hold: '108',
        buy_hold_profit: '0.08',
        vs_buy_hold: '2',
        total_trades: '4',
        length_days: '7',
        total_sells: '2',
        total_losses: '1'
      }
    })

    const output = runHelper([
      'build-result-row',
      'stub.BTC-USD',
      'volume_universal',
      '0',
      csvDir,
      logFile,
      reportFile,
      './conf-examples/csv.conf.js',
      '30',
      '30',
      '1m',
      '52',
      'stub',
      'BTC-USD',
      simResultFile
    ], tempRoot)

    const row = JSON.parse(output)
    assert.equal(row.success, true)
    assert.equal(row.metrics.profit_pct, 10)
    assert.equal(row.metrics.vs_buy_hold_pct, 2)
    assert.equal(row.summary.trades_line, '4 trades over 7 days')
    assert.equal(row.log_file, 'run.log')
    assert.equal(row.report_file, 'report.txt')
  })
})

test('generates json, csv, and ranking outputs from mixed results', () => {
  withTempRoot((tempRoot) => {
    const tmpResults = path.join(tempRoot, 'results.jsonl')
    const resultsJson = path.join(tempRoot, 'results.json')
    const resultsCsv = path.join(tempRoot, 'results.csv')
    const rankingMd = path.join(tempRoot, 'ranking.md')
    const reportFile = path.join(tempRoot, 'report.txt')

    const rows = [
      {
        selector: 'stub.BTC-USD',
        exchange: 'stub',
        product: 'BTC-USD',
        strategy: 'alpha',
        status: 0,
        success: true,
        config: {
          days: 30,
          backfill_days: 30,
          period_length: '1m',
          min_periods: 52
        },
        metrics: {
          end_balance: 120,
          profit_pct: 20,
          buy_hold_end_balance: 110,
          buy_hold_profit_pct: 10,
          vs_buy_hold_pct: 10,
          total_trades: 5,
          length_days: 30,
          total_sells: 2,
          total_losses: 1
        },
        log_file: 'alpha.log'
      },
      {
        selector: 'stub.ETH-USD',
        exchange: 'stub',
        product: 'ETH-USD',
        strategy: 'beta',
        status: 1,
        success: false,
        config: {
          days: 30,
          backfill_days: 30,
          period_length: '1m',
          min_periods: 52
        },
        metrics: {
          end_balance: null,
          profit_pct: null,
          buy_hold_end_balance: null,
          buy_hold_profit_pct: null,
          vs_buy_hold_pct: null,
          total_trades: null,
          length_days: null,
          total_sells: null,
          total_losses: null
        },
        log_file: 'beta.log'
      }
    ]

    fs.writeFileSync(tmpResults, rows.map(row => JSON.stringify(row)).join('\n'))
    fs.writeFileSync(reportFile, 'combined report')

    runHelper(['generate-outputs', tmpResults, resultsJson, resultsCsv, rankingMd, reportFile], tempRoot)

    const parsedJson = JSON.parse(fs.readFileSync(resultsJson, 'utf8'))
    const csv = fs.readFileSync(resultsCsv, 'utf8')
    const ranking = fs.readFileSync(rankingMd, 'utf8')

    assert.equal(parsedJson.length, 2)
    assert.match(csv, /selector,exchange,product,strategy,status,success/)
    assert.match(csv, /stub\.BTC-USD,stub,BTC-USD,alpha,0,true/)
    assert.match(ranking, /# Backtest-Ranking/)
    assert.match(ranking, /Gesamtlaeufe: 2/)
    assert.match(ranking, /`stub\.ETH-USD` \/ `beta` -> Status 1/)
  })
})
