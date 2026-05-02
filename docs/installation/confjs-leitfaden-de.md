# Leitfaden fuer `conf.js`

## Ziel

Dieser Leitfaden hilft dabei, eine spaetere eigene `conf.js` sauber aufzubauen, ohne `mongo`, `csv` oder den vorbereiteten `sql`-Pfad miteinander zu vermischen.

## Grundregel

Die produktive `conf.js` sollte nur die Einstellungen enthalten, die du wirklich dauerhaft fuer deinen Betrieb brauchst.

Alles, was nur fuer einzelne Testlaeufe oder Datenbankwechsel gedacht ist, ist besser in separaten Override-Dateien aufgehoben, zum Beispiel:

- `conf-examples/csv.conf.js`
- `conf-examples/csv-live.conf.js`
- `conf-examples/mongo.conf.js`

## Empfohlene Aufteilung

### Dauerhaft in `conf.js`

Typische Kandidaten:

- Exchange-API-Zugaenge
- Standard-Selector fuer deinen Hauptbetrieb
- bevorzugte Strategie
- dauerhafte Notifier
- feste Risiko- und Order-Parameter

### Besser nicht dauerhaft in `conf.js`

Wechselnde Testparameter:

- `db.type`
- testweiser `selector`
- kurze `days`-Werte fuer Backfills
- `poll_trades` nur fuer Stub- oder Kurztests
- experimentelle Output-Schalter

## Empfehltes Muster

### Schlanke Haupt-`conf.js`

Beispiel:

```js
var c = module.exports = {}

c.selector = 'gdax.BTC-USD'
c.strategy = 'trend_ema'

c.mongo = {}
c.mongo.db = 'zenbot4'
c.mongo.host = 'localhost'
c.mongo.port = 27017

c.gdax = {}
c.gdax.key = '...'
c.gdax.b64secret = '...'
c.gdax.passphrase = '...'
```

### Umschalten ueber `--conf`

Beispiele:

```powershell
node .\zenbot.js sim --conf .\conf-examples\csv.conf.js
node .\zenbot.js backfill gdax.BTC-USD --conf .\conf-examples\csv-live.conf.js --days 14
node .\zenbot.js trade --paper --conf .\conf-examples\mongo.conf.js
```

## Datenbankbezogene Empfehlung

### Wenn du gerade testen willst

- `csv.conf.js` fuer vollstaendig lokale Stub-Tests
- `csv-live.conf.js` fuer CSV-Speicher mit echten Selectoren

### Wenn du klassisch weiterarbeiten willst

- `mongo.conf.js`

### Wenn du spaeter SQL pruefen willst

- `sql.conf.js` nur als Platzhalter behalten
- noch nicht als aktiven Hauptmodus verwenden

## Was ich aktuell empfehlen wuerde

Fuer den momentanen Projektstand:

1. `conf.js` schlank halten
2. Datenbankmodus ueber `--conf` umschalten
3. CSV zuerst fuer Tests und Pilotlaeufe verwenden
4. Mongo nur dann aktivieren, wenn du den klassischen Pfad wirklich brauchst

## Verwandte Doku

- `docs/installation/database-modes-de.md`
- `docs/installation/csv-de.md`
- `docs/exchanges/stub-de.md`
