#!/usr/bin/env node

var path = require('path')

var strategy = require('../extensions/strategies/risk_analysis_file/strategy')

var repoRoot = path.resolve(__dirname, '..')
var scenarioPath = path.join(repoRoot, 'data', 'risk', 'risk-analysis-scenario.example.json')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function createState(periodTime) {
  return {
    options: {
      risk_file: scenarioPath,
      risk_max_age_s: 10800,
      max_buy_risk: 0.35,
      risk_exit_threshold: 0.8,
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
    } catch (err) {
      reject(err)
    }
  })
}

async function main() {
  var buyState = await runPeriod(createState('2026-05-22T15:30:00Z'))
  assert(buyState.signal === 'buy', 'expected buy recommendation during low-risk scenario window')
  assert(buyState.period.risk_status === 'loaded', 'expected loaded risk status during buy window')

  var exitState = await runPeriod(createState('2026-05-22T16:40:00Z'))
  assert(exitState.signal === 'sell', 'expected defensive sell during high-risk scenario window')
  assert(exitState.period.risk_status === 'risk-exit', 'expected risk-exit status during exit window')

  var lateState = await runPeriod(createState('2026-05-22T18:00:00Z'))
  assert(lateState.signal == null, 'expected no active signal after scenario expiry')
  assert(lateState.period.risk_status === 'invalid', 'expected invalid status when no active scenario entry remains')

  console.log('risk_analysis_file scenario test passed')
  console.log('Risk file: ' + scenarioPath)
}

main().catch(function (err) {
  console.error(err.message || err)
  process.exit(1)
})
