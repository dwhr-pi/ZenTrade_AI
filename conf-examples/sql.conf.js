var c = module.exports = {}

// Lokaler SQL-Betrieb mit automatischer SQLite-Einrichtung.
c.db = {}
c.db.type = 'sql'
c.db.sql = {}
c.db.sql.dialect = process.env.ZENBOT_DB_SQL_DIALECT || 'sqlite'
c.db.sql.connectionString = process.env.ZENBOT_DB_SQL_CONNECTION_STRING || null
c.db.sql.directory = process.env.ZENBOT_DB_SQL_DIR || './data/sql'
c.db.sql.storage = process.env.ZENBOT_DB_SQL_STORAGE || './data/sql/zenbot.sqlite'
c.db.sql.autoProvision = true

// Sinnvolle lokale Defaults fuer Offline-Tests.
c.selector = 'stub.BTC-USD'
c.strategy = 'volume_universal'
c.days = 1
c.poll_trades = 1000

// Die optionale Web-API bleibt in dieser Vorlage bewusst aus,
// damit lokale Tests nicht an fehlenden Express-Abhaengigkeiten scheitern.
c.output = {}
c.output.api = {}
c.output.api.on = false
