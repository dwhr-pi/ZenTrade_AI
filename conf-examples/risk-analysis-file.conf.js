var c = module.exports = {}

c.db = {}
c.db.type = 'csv'
c.db.csv = {}
c.db.csv.dataDir = './data/csv'
c.db.csv.syncInterval = 0

c.selector = 'stub.BTC-USD'
c.strategy = 'risk_analysis_file'
c.days = 1
c.poll_trades = 1000

c.risk_file = './data/risk/risk-analysis.example.json'
c.risk_max_age_s = 1800
c.max_buy_risk = 0.35
c.risk_exit_threshold = 0.8
c.allow_buy = true
c.allow_sell = true

c.output = {}
c.output.api = {}
c.output.api.on = false
