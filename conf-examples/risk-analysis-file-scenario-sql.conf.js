var c = module.exports = {}

c.db = {}
c.db.type = 'sql'
c.db.sql = {}
c.db.sql.dialect = process.env.ZENBOT_DB_SQL_DIALECT || 'sqlite'
c.db.sql.connectionString = process.env.ZENBOT_DB_SQL_CONNECTION_STRING || null
c.db.sql.directory = process.env.ZENBOT_DB_SQL_DIR || './data/sql'
c.db.sql.storage = process.env.ZENBOT_DB_SQL_STORAGE || './data/sql/zenbot.sqlite'
c.db.sql.autoProvision = true

c.selector = 'stub.BTC-USD'
c.strategy = 'risk_analysis_file'
c.days = 1
c.poll_trades = 1000
c.currency_capital = 100000
c.asset_capital = 0
c.order_type = 'taker'
c.markdown_buy_pct = -1
c.markup_sell_pct = -1

c.risk_file = './data/risk/risk-analysis-scenario.example.json'
c.risk_max_age_s = 10800
c.max_buy_risk = 0.35
c.risk_exit_threshold = 0.8
c.allow_buy = true
c.allow_sell = true

c.output = {}
c.output.api = {}
c.output.api.on = false
