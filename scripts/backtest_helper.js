#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    return fallback
  }
}

function write(text) {
  process.stdout.write(String(text))
}

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, '')
}

function discoverSelectors(root, exchange, maxProductsRaw) {
  const maxProducts = Number(maxProductsRaw || 0)
  const productsPath = path.join(root, 'extensions', 'exchanges', exchange, 'products.json')
  const products = readJson(productsPath, [])
  const selectors = []

  for (const product of products) {
    if (!product || !product.asset || !product.currency) continue
    selectors.push(`${exchange}.${product.asset}-${product.currency}`)
  }

  const unique = Array.from(new Set(selectors))
  const limited = maxProducts > 0 ? unique.slice(0, maxProducts) : unique
  write(limited.length ? limited.join('\n') + '\n' : '')
}

function countSimResults(csvDir) {
  const file = path.join(csvDir, 'sim_results.json')
  const data = readJson(file, [])
  write(Array.isArray(data) ? data.length : 0)
}

function extractNewResult(csvDir, beforeCountRaw) {
  const beforeCount = Number(beforeCountRaw || 0)
  const file = path.join(csvDir, 'sim_results.json')
  const data = readJson(file, [])
  if (!Array.isArray(data) || data.length <= beforeCount) return
  write(JSON.stringify(data[data.length - 1], null, 2))
}

function buildResultRow(args) {
  const [
    selector,
    strategy,
    statusRaw,
    csvDir,
    logFile,
    reportFile,
    confPath,
    daysRaw,
    backfillDaysRaw,
    periodLength,
    minPeriodsRaw,
    exchangeName,
    productName,
    simResultFile
  ] = args

  const status = Number(statusRaw)
  const days = Number(daysRaw)
  const backfillDays = Number(backfillDaysRaw)
  const minPeriods = Number(minPeriodsRaw)

  let logText = ''
  try {
    logText = stripAnsi(fs.readFileSync(logFile, 'utf8'))
  } catch (err) {}

  const simData = simResultFile && fs.existsSync(simResultFile)
    ? readJson(simResultFile, null)
    : null

  const matchLine = (prefix) => logText.split(/\r?\n/).find(line => line.toLowerCase().startsWith(prefix)) || null
  const parseNumber = value => {
    if (value === null || value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }

  const simresults = simData && simData.simresults ? simData.simresults : null

  const row = {
    selector,
    exchange: exchangeName,
    product: productName,
    strategy,
    status,
    success: status === 0 && !!simresults,
    config: {
      conf_path: confPath,
      csv_dir: csvDir,
      days,
      backfill_days: backfillDays,
      period_length: periodLength,
      min_periods: minPeriods
    },
    metrics: {
      end_balance: simresults ? parseNumber(simresults.currency) : null,
      profit_pct: simresults ? parseNumber(simresults.profit) * 100 : null,
      buy_hold_end_balance: simresults ? parseNumber(simresults.buy_hold) : null,
      buy_hold_profit_pct: simresults ? parseNumber(simresults.buy_hold_profit) * 100 : null,
      vs_buy_hold_pct: simresults ? parseNumber(simresults.vs_buy_hold) : null,
      total_trades: simresults ? parseNumber(simresults.total_trades) : null,
      length_days: simresults ? parseNumber(simresults.length_days) : null,
      total_sells: simresults ? parseNumber(simresults.total_sells) : null,
      total_losses: simresults ? parseNumber(simresults.total_losses) : null
    },
    summary: {
      end_balance_line: matchLine('end balance:'),
      buy_hold_line: matchLine('buy hold:'),
      vs_buy_hold_line: matchLine('vs. buy hold:'),
      trades_line: logText.split(/\r?\n/).find(line => / trades over /i.test(line)) || null,
      win_loss_line: matchLine('win/loss:'),
      error_rate_line: matchLine('error rate:')
    },
    log_file: path.relative(process.cwd(), logFile).replace(/\\/g, '/'),
    report_file: path.relative(process.cwd(), reportFile).replace(/\\/g, '/'),
    raw_error_excerpt: status === 0 ? null : logText.split(/\r?\n/).slice(-12).join('\n')
  }

  write(JSON.stringify(row))
}

function generateOutputs(tmpResults, resultsJson, resultsCsv, rankingMd, reportFile) {
  const raw = fs.existsSync(tmpResults) ? fs.readFileSync(tmpResults, 'utf8').trim() : ''
  const rows = raw ? raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)) : []

  const successRows = rows.filter(row => row.success)
  const failedRows = rows.filter(row => !row.success)

  const sortNumericDesc = (items, getter) => [...items].sort((a, b) => (getter(b) ?? -Infinity) - (getter(a) ?? -Infinity))
  const sortNumericAsc = (items, getter) => [...items].sort((a, b) => (getter(a) ?? Infinity) - (getter(b) ?? Infinity))

  const topProfit = sortNumericDesc(successRows, row => row.metrics.profit_pct).slice(0, 10)
  const bottomProfit = sortNumericAsc(successRows, row => row.metrics.profit_pct).slice(0, 10)
  const topVsBuyHold = sortNumericDesc(successRows, row => row.metrics.vs_buy_hold_pct).slice(0, 10)
  const bottomVsBuyHold = sortNumericAsc(successRows, row => row.metrics.vs_buy_hold_pct).slice(0, 10)

  const bestPerSelector = []
  for (const selector of [...new Set(successRows.map(row => row.selector))].sort()) {
    const best = sortNumericDesc(successRows.filter(row => row.selector === selector), row => row.metrics.profit_pct)[0]
    if (best) bestPerSelector.push(best)
  }

  const bestPerStrategy = []
  for (const strategy of [...new Set(successRows.map(row => row.strategy))].sort()) {
    const best = sortNumericDesc(successRows.filter(row => row.strategy === strategy), row => row.metrics.profit_pct)[0]
    if (best) bestPerStrategy.push(best)
  }

  fs.writeFileSync(resultsJson, JSON.stringify(rows, null, 2))

  const csvHeaders = [
    'selector',
    'exchange',
    'product',
    'strategy',
    'status',
    'success',
    'days',
    'backfill_days',
    'period_length',
    'min_periods',
    'end_balance',
    'profit_pct',
    'buy_hold_end_balance',
    'buy_hold_profit_pct',
    'vs_buy_hold_pct',
    'total_trades',
    'length_days',
    'total_sells',
    'total_losses',
    'log_file'
  ]

  const csvEscape = value => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const csvLines = [csvHeaders.join(',')]
  for (const row of rows) {
    const values = [
      row.selector,
      row.exchange,
      row.product,
      row.strategy,
      row.status,
      row.success,
      row.config.days,
      row.config.backfill_days,
      row.config.period_length,
      row.config.min_periods,
      row.metrics.end_balance,
      row.metrics.profit_pct,
      row.metrics.buy_hold_end_balance,
      row.metrics.buy_hold_profit_pct,
      row.metrics.vs_buy_hold_pct,
      row.metrics.total_trades,
      row.metrics.length_days,
      row.metrics.total_sells,
      row.metrics.total_losses,
      row.log_file
    ]
    csvLines.push(values.map(csvEscape).join(','))
  }
  fs.writeFileSync(resultsCsv, csvLines.join('\n'))

  const fmt = value => value === null || value === undefined || Number.isNaN(value) ? '-' : Number(value).toFixed(2)
  const table = rows => {
    if (!rows.length) return '_keine Daten_'
    const header = '| Selector | Strategie | Gewinn % | vs Buy Hold % | Endsaldo | Trades | Status |'
    const sep = '|---|---|---:|---:|---:|---:|---:|'
    const body = rows.map(row => `| ${row.selector} | ${row.strategy} | ${fmt(row.metrics.profit_pct)} | ${fmt(row.metrics.vs_buy_hold_pct)} | ${fmt(row.metrics.end_balance)} | ${row.metrics.total_trades ?? '-'} | ${row.status} |`)
    return [header, sep, ...body].join('\n')
  }

  const failedList = failedRows.map(row => `- \`${row.selector}\` / \`${row.strategy}\` -> Status ${row.status}`).join('\n') || '_keine Fehlschlaege_'

  const md = [
    '# Backtest-Ranking',
    '',
    `Quelle Gesamtbericht: \`${path.basename(reportFile)}\``,
    '',
    '## Ueberblick',
    '',
    `- Gesamtlaeufe: ${rows.length}`,
    `- Erfolgreiche Laeufe: ${successRows.length}`,
    `- Fehlgeschlagene Laeufe: ${failedRows.length}`,
    '',
    '## Beste Ergebnisse nach Gewinn',
    '',
    table(topProfit),
    '',
    '## Schwaechste Ergebnisse nach Gewinn',
    '',
    table(bottomProfit),
    '',
    '## Beste Ergebnisse gegen Buy-and-Hold',
    '',
    table(topVsBuyHold),
    '',
    '## Schwaechste Ergebnisse gegen Buy-and-Hold',
    '',
    table(bottomVsBuyHold),
    '',
    '## Bestes Ergebnis je Handelspaar',
    '',
    table(bestPerSelector),
    '',
    '## Bestes Ergebnis je Strategie',
    '',
    table(bestPerStrategy),
    '',
    '## Fehlgeschlagene Laeufe',
    '',
    failedList,
    '',
    '## Hinweise',
    '',
    '- Verschobene oder geparkte Strategien werden absichtlich nicht automatisch mit getestet.',
    '- Erfolgswerte stammen aus den von Zenbot geschriebenen `sim_results`-Datensaetzen, sofern ein Lauf regulaer abgeschlossen wurde.',
    '- Fehlgeschlagene Laeufe bleiben in der Auswertung sichtbar, damit das Ranking nicht stillschweigend schoengerechnet wird.'
  ].join('\n')

  fs.writeFileSync(rankingMd, md)
}

const [command, ...args] = process.argv.slice(2)

switch (command) {
  case 'discover-selectors':
    discoverSelectors(...args)
    break
  case 'count-sim-results':
    countSimResults(...args)
    break
  case 'extract-new-result':
    extractNewResult(...args)
    break
  case 'build-result-row':
    buildResultRow(args)
    break
  case 'generate-outputs':
    generateOutputs(...args)
    break
  default:
    process.exit(1)
}
