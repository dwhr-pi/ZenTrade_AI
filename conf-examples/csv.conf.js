var c = module.exports = {}

// Lokaler dateibasierter Test- und Pilotbetrieb ohne MongoDB.
c.db = {}
c.db.type = 'csv'
c.db.csv = {}
c.db.csv.dataDir = './data/csv'
c.db.csv.syncInterval = 0

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
