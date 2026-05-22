var fs = require('fs')
var os = require('os')
var path = require('path')

var strategy = require('../../extensions/strategies/risk_analysis_file/strategy')

describe('risk_analysis_file strategy', function () {
  var tempDir

  beforeEach(function () {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'risk-analysis-file-'))
    jasmine.clock().install()
    jasmine.clock().mockDate(new Date('2026-05-22T10:00:00Z'))
  })

  afterEach(function () {
    jasmine.clock().uninstall()
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  function writePayload(name, payload) {
    var filePath = path.join(tempDir, name)
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2))
    return filePath
  }

  function createState(riskFile, overrides) {
    return {
      options: Object.assign({
        risk_file: riskFile,
        risk_max_age_s: 1800,
        max_buy_risk: 0.35,
        risk_exit_threshold: 0.8,
        allow_buy: true,
        allow_sell: true
      }, overrides || {}),
      period: {},
      signal: null
    }
  }

  function runPeriod(state) {
    strategy.onPeriod(state, function () {})
  }

  it('emits buy for low-risk buy recommendations', function () {
    var filePath = writePayload('buy.json', {
      recommendation: 'buy',
      risk_score: 0.2,
      timestamp: '2026-05-22T09:45:00Z',
      expires_at: '2026-05-22T10:45:00Z'
    })
    var state = createState(filePath)
    runPeriod(state)
    expect(state.signal).toBe('buy')
    expect(state.period.risk_status).toBe('loaded')
  })

  it('blocks buy when risk is above threshold', function () {
    var filePath = writePayload('blocked.json', {
      recommendation: 'buy',
      risk_score: 0.6,
      timestamp: '2026-05-22T09:45:00Z',
      expires_at: '2026-05-22T10:45:00Z'
    })
    var state = createState(filePath)
    runPeriod(state)
    expect(state.signal).toBeNull()
    expect(state.period.risk_status).toBe('blocked-by-risk')
  })

  it('emits sell when risk exceeds exit threshold', function () {
    var filePath = writePayload('exit.json', {
      recommendation: 'hold',
      risk_score: 0.92,
      timestamp: '2026-05-22T09:45:00Z',
      expires_at: '2026-05-22T10:45:00Z'
    })
    var state = createState(filePath)
    runPeriod(state)
    expect(state.signal).toBe('sell')
    expect(state.period.risk_status).toBe('risk-exit')
  })

  it('selects the active assessment from a scenario sequence based on period time', function () {
    var filePath = writePayload('scenario.json', {
      assessments: [
        {
          recommendation: 'buy',
          risk_score: 0.2,
          timestamp: '2026-05-22T09:40:00Z',
          expires_at: '2026-05-22T10:20:00Z'
        },
        {
          recommendation: 'hold',
          risk_score: 0.91,
          timestamp: '2026-05-22T10:30:00Z',
          expires_at: '2026-05-22T11:00:00Z'
        }
      ]
    })

    var buyState = createState(filePath)
    buyState.period.time = '2026-05-22T09:50:00Z'
    runPeriod(buyState)
    expect(buyState.signal).toBe('buy')

    var exitState = createState(filePath)
    exitState.period.time = '2026-05-22T10:40:00Z'
    runPeriod(exitState)
    expect(exitState.signal).toBe('sell')
    expect(exitState.period.risk_status).toBe('risk-exit')
  })
})
