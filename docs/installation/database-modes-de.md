# Datenbankmodi in Zenbot

## Ueberblick

Zenbot kennt im aktuellen Projektstand drei Datenbankmodi auf Konfigurationsebene:

- `mongo`
- `csv`
- `sql`

Der aktuelle Reifegrad:

- `mongo` ist der klassische Hauptpfad
- `csv` ist fuer lokale Tests und Pilotbetrieb integriert
- `sql` ist fuer lokalen SQLite-Betrieb im Kern aktiviert

## `mongo`

Verwendung:

- klassischer Zenbot-Betrieb
- bestehende historische Hauptkonfiguration

Aktivierung:

```powershell
$env:ZENBOT_DB_TYPE='mongo'
```

Oder in `conf.js`:

```js
c.db = c.db || {}
c.db.type = 'mongo'
```

Mongo-spezifische Verbindungseinstellungen bleiben in:

- `c.mongo.*`

Fertige Override-Vorlage:

- `conf-examples/mongo.conf.js`

## `csv`

Verwendung:

- lokaler dateibasierter Testbetrieb
- Offline-Backfills
- Simulationen
- `trade --paper`

Aktivierung:

```powershell
$env:ZENBOT_DB_TYPE='csv'
$env:ZENBOT_DB_CSV_DIR='C:\temp\zenbot-csv'
```

Oder in `conf.js`:

```js
c.db = c.db || {}
c.db.type = 'csv'
c.db.csv = c.db.csv || {}
c.db.csv.dataDir = './data/csv'
c.db.csv.syncInterval = 0
```

Weitere Details:

- `docs/installation/csv-de.md`

Fertige Override-Vorlagen:

- `conf-examples/csv.conf.js`
- `conf-examples/csv-live.conf.js`

## `sql`

Verwendung:

- lokaler SQL-Betrieb ohne MongoDB
- Backfills
- Simulationen
- Paper-Trading
- vorbereitende Basis fuer spaetere weitere SQL-Dialekte

Status:

- Laufzeitpfad im Kern eingebunden
- Standardpfad nutzt SQLite ueber `node:sqlite`
- Datenbankdatei wird bei Bedarf automatisch angelegt
- externe SQL-Server sind noch nicht Teil der automatischen Einrichtung

Aktivierung:

```powershell
$env:ZENBOT_DB_TYPE='sql'
$env:ZENBOT_DB_SQL_DIALECT='sqlite'
$env:ZENBOT_DB_SQL_DIR='C:\temp\zenbot-sql'
```

Oder in `conf.js`:

```js
c.db = c.db || {}
c.db.type = 'sql'
c.db.sql = c.db.sql || {}
c.db.sql.dialect = 'sqlite'
c.db.sql.directory = './data/sql'
c.db.sql.storage = './data/sql/zenbot.sqlite'
c.db.sql.autoProvision = true
```

Vorlage:

- `conf-examples/sql.conf.js`

Wichtige Grenzen:

- Im aktuellen Stand ist `sqlite` der aktiv unterstuetzte SQL-Dialekt.
- Ein automatisches Nachinstallieren externer Datenbankserver findet bewusst nicht statt.
- Fuer lokale Nutzung ist das kein Nachteil, weil SQLite direkt ueber Node verwendet wird.
- Access ist aktuell nicht als direkter Kernmodus eingebunden, kann aber ueber einen SQL-basierten Exportpfad bedient werden.

Access-Export:

- `docs/installation/access-de.md`

## Sicher zwischen Modi wechseln

Die Modi sind absichtlich so angelegt, dass du spaeter wieder wechseln kannst:

1. `mongo` bleibt in `c.mongo.*` erhalten.
2. `csv` nutzt den separaten Block `c.db.csv.*`.
3. `sql` nutzt den separaten Block `c.db.sql.*`.

Damit gilt:

- CSV ersetzt deine Mongo-Konfiguration nicht.
- SQL ersetzt deine Mongo-Konfiguration nicht.
- Mongo kann spaeter jederzeit wieder aktiviert werden.

## Empfohlene Praxis

Fuer den aktuellen Projektstand:

- `mongo` fuer klassischen Altbetrieb
- `csv` fuer lokale Tests, Entwicklung und Pilotlaeufe
- `sql` fuer lokale relationale Speicherung ohne MongoDB

## Schnell umschalten per `--conf`

Beispiele:

```powershell
node .\zenbot.js sim --conf .\conf-examples\csv.conf.js
node .\zenbot.js trade --paper --conf .\conf-examples\csv.conf.js
node .\zenbot.js backfill gdax.BTC-USD --conf .\conf-examples\csv-live.conf.js --days 14
node .\zenbot.js sim --conf .\conf-examples\mongo.conf.js
node .\zenbot.js backfill stub.BTC-USD --conf .\conf-examples\sql.conf.js --days 1
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\sql.conf.js --strategy volume_universal --period_length 1m --days 1
```

## Aufbau der spaeteren `conf.js`

Fuer eine saubere Trennung zwischen dauerhafter Hauptkonfiguration und testweisen Overrides:

- `docs/installation/confjs-leitfaden-de.md`
