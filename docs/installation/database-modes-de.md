# Datenbankmodi in Zenbot

## Ueberblick

Zenbot kennt im aktuellen Projektstand drei Datenbankmodi auf Konfigurationsebene:

- `mongo`
- `csv`
- `sql`

Wichtig ist der aktuelle Reifegrad:

- `mongo` ist der klassische Hauptpfad
- `csv` ist fuer lokale Tests und Pilotbetrieb integriert
- `sql` ist als Zukunftspfad reserviert, aber im Kern noch nicht aktiviert

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

Fertige Override-Vorlage:

- `conf-examples/csv.conf.js`
- `conf-examples/csv-live.conf.js`

## `sql`

Verwendung:

- aktuell noch nicht fuer den Kernbetrieb freigeschaltet

Status:

- Konfigurationsplatzhalter vorhanden
- dokumentarisch vorbereitet
- Laufzeitpfad im Kern noch nicht eingebunden

Wenn `db.type='sql'` gesetzt wird, gibt Zenbot aktuell eine Warnung aus und faellt auf den Mongo-Pfad zurueck.

Das ist bewusst so, damit eine spaetere SQL-Integration vorbereitet werden kann, ohne jetzt einen stillschweigend falschen Zustand zu erzeugen.

Vorbereitete Platzhalter-Vorlage:

- `conf-examples/sql.conf.js`

## Sicher zwischen Modi wechseln

Die Modi sind absichtlich so angelegt, dass du spaeter wieder wechseln kannst:

1. `mongo` bleibt in `c.mongo.*` erhalten.
2. `csv` nutzt den separaten Block `c.db.csv.*`.
3. `sql` hat bereits einen reservierten Block `c.db.sql.*`.

Damit gilt:

- CSV ersetzt deine Mongo-Konfiguration nicht.
- Mongo kann spaeter jederzeit wieder aktiviert werden.
- SQL kann spaeter angebunden werden, ohne die Konfigurationsstruktur erneut aufzubrechen.

## Empfohlene Praxis

Fuer den aktuellen Projektstand:

- `mongo` fuer klassischen Altbetrieb
- `csv` fuer lokale Tests, Entwicklung und Pilotlaeufe
- `sql` vorerst nur als dokumentierte Reserve

## Schnell umschalten per `--conf`

Beispiele:

```powershell
node .\zenbot.js sim --conf .\conf-examples\csv.conf.js
node .\zenbot.js trade --paper --conf .\conf-examples\csv.conf.js
node .\zenbot.js backfill gdax.BTC-USD --conf .\conf-examples\csv-live.conf.js --days 14
node .\zenbot.js sim --conf .\conf-examples\mongo.conf.js
```

## Aufbau der spaeteren `conf.js`

Fuer eine saubere Trennung zwischen dauerhafter Hauptkonfiguration und testweisen Overrides:

- `docs/installation/confjs-leitfaden-de.md`
