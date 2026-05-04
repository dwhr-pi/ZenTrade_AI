var c = module.exports = {}

// Lokaler SQL-Testpfad auf SQLite-Basis.
// Dieser Modus legt die Daten automatisch unter ./data/sql an.
c.db = {}
c.db.type = 'sql'
c.db.sql = {}
c.db.sql.dialect = process.env.ZENBOT_DB_SQL_DIALECT || 'sqlite'
c.db.sql.connectionString = process.env.ZENBOT_DB_SQL_CONNECTION_STRING || null
c.db.sql.directory = process.env.ZENBOT_DB_SQL_DIR || './data/sql'
c.db.sql.storage = process.env.ZENBOT_DB_SQL_STORAGE || './data/sql/zenbot.sqlite'
