#!/usr/bin/env node

var path = require('path')

var strategy = require('../extensions/strategies/copy_trading_file/strategy')

var repoRoot = path.resolve(__dirname, '..')
var scenarioPath = path.join(repoRoot, 'data', 'signals', 'copy-trading-scenario.example.json')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function createState(periodTime) {
  return {
    options: {
      signal_file: scenarioPath,
      signal_max_age_s: 10800,
      signal_threshold: 0.7,
      allow_buy: true,
      allow_sell: true
    },
    period: {
      time: periodTime
    },
    signal: null
  }
}

function runPeriod(state) {
  return new Promise(function (resolve, reject) {
    try {
      strategy.onPeriod(state, function () {
        resolve(state)
      })
    }
    catch (err) {
      reject(err)
    }
  })
}

async function main() {
  var buyState = await runPeriod(createState('2026-05-17T15:30:00Z'))
  assert(buyState.signal === 'buy', 'expected buy signal during scenario buy window')
  assert(buyState.period.copy_signal_status === 'loaded', 'expected loaded status for buy window')

  var sellState = await runPeriod(createState('2026-05-17T16:40:00Z'))
  assert(sellState.signal === 'sell', 'expected sell signal during scenario sell window')
  assert(sellState.period.copy_signal_status === 'loaded', 'expected loaded status for sell window')

  var lateState = await runPeriod(createState('2026-05-17T19:00:00Z'))
  assert(lateState.signal == null, 'expected no active signal after scenario expiry')
  assert(lateState.period.copy_signal_status === 'invalid', 'expected invalid status when no active scenario entry remains')

  console.log('copy_trading_file scenario test passed')
  console.log('Signal file: ' + scenarioPath)
}

main().catch(function (err) {
  console.error(err.message || err)
  process.exit(1)
})
