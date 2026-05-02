var c = module.exports = {}

// CSV-Dateibetrieb fuer echte Zenbot-Selectoren.
// Gedacht fuer Backfills, Simulationen und Paper-Trading mit einer realen Exchange-Anbindung,
// aber ohne MongoDB als Datenspeicher.
c.db = {}
c.db.type = 'csv'
c.db.csv = {}
c.db.csv.dataDir = './data/csv-live'
c.db.csv.syncInterval = 0

// Diese Defaults koennen direkt angepasst oder per CLI ueberschrieben werden.
c.selector = 'gdax.BTC-USD'
c.strategy = 'trend_ema'
c.days = 14
c.poll_trades = 30000

// Die Web-API bleibt standardmaessig aus, damit fehlende Express-Abhaengigkeiten
// den CSV-Betrieb nicht abbrechen.
c.output = {}
c.output.api = {}
c.output.api.on = false
