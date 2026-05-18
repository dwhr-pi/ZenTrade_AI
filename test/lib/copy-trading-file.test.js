var fs = require('fs')
var os = require('os')
var path = require('path')

var strategy = require('../../extensions/strategies/copy_trading_file/strategy')

describe('copy_trading_file strategy', function () {
  var tempDir

  beforeEach(function () {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copy-trading-file-'))
    jasmine.clock().install()
    jasmine.clock().mockDate(new Date('2026-05-15T10:15:00Z'))
  })

  afterEach(function () {
    jasmine.clock().uninstall()
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  function writeSignal(name, payload) {
    var filePath = path.join(tempDir, name)
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2))
    return filePath
  }

  function createState(signalFile, overrides) {
    var options = Object.assign({
      signal_file: signalFile,
      signal_max_age_s: 3600,
      signal_threshold: 0.7,
      allow_buy: true,
      allow_sell: true
    }, overrides || {})

    return {
      options: options,
      period: {},
      signal: null
    }
  }

  function runPeriod(state) {
    strategy.onPeriod(state, function () {})
  }

  it('emits a buy signal when the file contains a confident buy', function () {
    var filePath = writeSignal('buy.json', {
      signal: 'buy',
      side: 'buy',
      confidence: 0.91,
      timestamp: '2026-05-15T10:10:00Z',
      expires_at: '2026-05-15T11:00:00Z',
      symbol: 'BTC-USD',
      tags: ['reviewed']
    })
    var state = createState(filePath)

    runPeriod(state)

    expect(state.signal).toBe('buy')
    expect(state.period.copy_signal_status).toBe('loaded')
    expect(state.period.copy_signal_side).toBe('buy')
    expect(state.period.copy_signal_symbol).toBe('BTC-USD')
  })

  it('emits a sell signal when the file contains a confident sell', function () {
    var filePath = writeSignal('sell.json', {
      signal: 'sell',
      side: 'sell',
      confidence: 0.88,
      timestamp: '2026-05-15T10:14:00Z',
      expires_at: '2026-05-15T11:00:00Z'
    })
    var state = createState(filePath)

    runPeriod(state)

    expect(state.signal).toBe('sell')
    expect(state.period.copy_signal_status).toBe('loaded')
  })

  it('does not emit a signal when confidence is below threshold', function () {
    var filePath = writeSignal('below-threshold.json', {
      signal: 'buy',
      confidence: 0.5,
      timestamp: '2026-05-15T10:14:00Z',
      expires_at: '2026-05-15T11:00:00Z'
    })
    var state = createState(filePath)

    runPeriod(state)

    expect(state.signal).toBeNull()
    expect(state.period.copy_signal_status).toBe('below-threshold')
  })

  it('does not emit a signal when the signal is stale', function () {
    var filePath = writeSignal('stale.json', {
      signal: 'buy',
      confidence: 0.9,
      timestamp: '2026-05-15T08:00:00Z',
      expires_at: '2026-05-15T12:00:00Z'
    })
    var state = createState(filePath, { signal_max_age_s: 300 })

    runPeriod(state)

    expect(state.signal).toBeNull()
    expect(state.period.copy_signal_status).toBe('stale')
  })

  it('does not emit a signal when the signal is expired', function () {
    var filePath = writeSignal('expired.json', {
      signal: 'sell',
      confidence: 0.92,
      timestamp: '2026-05-15T10:10:00Z',
      expires_at: '2026-05-15T10:14:00Z'
    })
    var state = createState(filePath)

    runPeriod(state)

    expect(state.signal).toBeNull()
    expect(state.period.copy_signal_status).toBe('expired')
  })

  it('respects allow_buy and allow_sell flags', function () {
    var buyFile = writeSignal('buy-disabled.json', {
      signal: 'buy',
      confidence: 0.95,
      timestamp: '2026-05-15T10:14:00Z',
      expires_at: '2026-05-15T11:00:00Z'
    })
    var buyState = createState(buyFile, { allow_buy: false })

    runPeriod(buyState)

    expect(buyState.signal).toBeNull()
    expect(buyState.period.copy_signal_status).toBe('loaded')

    var sellFile = writeSignal('sell-disabled.json', {
      signal: 'sell',
      confidence: 0.95,
      timestamp: '2026-05-15T10:14:00Z',
      expires_at: '2026-05-15T11:00:00Z'
    })
    var sellState = createState(sellFile, { allow_sell: false })

    runPeriod(sellState)

    expect(sellState.signal).toBeNull()
    expect(sellState.period.copy_signal_status).toBe('loaded')
  })

  it('uses side when it differs from signal', function () {
    var filePath = writeSignal('side-priority.json', {
      signal: 'hold',
      side: 'buy',
      confidence: 0.85,
      timestamp: '2026-05-15T10:14:00Z',
      expires_at: '2026-05-15T11:00:00Z'
    })
    var state = createState(filePath)

    runPeriod(state)

    expect(state.signal).toBe('buy')
    expect(state.period.copy_signal).toBe('hold')
    expect(state.period.copy_signal_side).toBe('buy')
  })

  it('selects the active signal from a scenario sequence based on period time', function () {
    var filePath = writeSignal('scenario.json', {
      signals: [
        {
          signal: 'buy',
          confidence: 0.9,
          timestamp: '2026-05-15T10:00:00Z',
          expires_at: '2026-05-15T10:30:00Z'
        },
        {
          signal: 'sell',
          confidence: 0.95,
          timestamp: '2026-05-15T10:40:00Z',
          expires_at: '2026-05-15T11:10:00Z'
        }
      ]
    })

    var buyState = createState(filePath)
    buyState.period.time = '2026-05-15T10:15:00Z'
    runPeriod(buyState)
    expect(buyState.signal).toBe('buy')
    expect(buyState.period.copy_signal_side).toBe('buy')

    var sellState = createState(filePath)
    sellState.period.time = '2026-05-15T10:45:00Z'
    runPeriod(sellState)
    expect(sellState.signal).toBe('sell')
    expect(sellState.period.copy_signal_side).toBe('sell')
  })
})
