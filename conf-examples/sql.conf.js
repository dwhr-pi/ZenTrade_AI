var c = module.exports = {}

// Platzhalter fuer eine spaetere SQL-Anbindung.
// Der aktuelle Kern aktiviert diesen Modus noch nicht direkt.
c.db = {}
c.db.type = 'sql'
c.db.sql = {}
c.db.sql.dialect = process.env.ZENBOT_DB_SQL_DIALECT || 'sqlite'
c.db.sql.connectionString = process.env.ZENBOT_DB_SQL_CONNECTION_STRING || null
c.db.sql.directory = process.env.ZENBOT_DB_SQL_DIR || './data/sql'
