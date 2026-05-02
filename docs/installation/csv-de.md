# Zenbot mit CSV statt MongoDB

## Zweck

Dieser Betriebsmodus ist fuer lokale Tests, Offline-Backfills, Simulationen und erste Pilotlaeufe gedacht.

Geeignet fuer:

- `backfill`
- `sim`
- `trade --paper`

Nicht gedacht fuer:

- produktiven Live-Betrieb mit voller historischer Kompatibilitaet
- Austausch aller alten Mongo-spezifischen Workflows ohne weitere Validierung

## Voraussetzungen

- Node.js
- installierte Zenbot-Abhaengigkeiten, soweit die gewuenschten Befehle sie brauchen

MongoDB ist fuer diesen Modus nicht erforderlich.

## Aktivierung

Zenbot kann per Umgebungsvariable auf CSV umgestellt werden:

```powershell
$env:ZENBOT_DB_TYPE='csv'
$env:ZENBOT_DB_CSV_DIR='C:\temp\zenbot-csv'
```

Optional:

```powershell
$env:ZENBOT_DB_CSV_SYNC_INTERVAL='0'
```

Wenn du spaeter wieder auf MongoDB zurueckwechseln willst:

```powershell
$env:ZENBOT_DB_TYPE='mongo'
```

Die allgemeine Uebersicht aller Betriebsmodi steht in:

- `docs/installation/database-modes-de.md`

## Datenablage

Im CSV-Modus legt Zenbot JSON-Dateien im angegebenen Datenordner an, zum Beispiel:

- `trades.json`
- `resume_markers.json`
- `sessions.json`
- `balances.json`
- `periods.json`
- `my_trades.json`
- `sim_results.json`

Der Name `csv` ist historisch aus dem Integrationspaket uebernommen. Der aktuelle Persistenzpfad arbeitet dateibasiert mit JSON-Collections.

## Beispielaufrufe

### Offline-Backfill mit lokalem Stub-Exchange

```powershell
$env:ZENBOT_DB_TYPE='csv'
$env:ZENBOT_DB_CSV_DIR='C:\temp\zenbot-csv'
node .\zenbot.js backfill stub.BTC-USD --days 1
```

### Backfill mit echtem Selector auf CSV-Speicher

```powershell
node .\zenbot.js backfill gdax.BTC-USD --conf .\conf-examples\csv-live.conf.js --days 14
```

### Simulation mit CSV

```powershell
$env:ZENBOT_DB_TYPE='csv'
$env:ZENBOT_DB_CSV_DIR='C:\temp\zenbot-csv'
node .\zenbot.js sim stub.BTC-USD --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --filename none --days 1
```

### Paper-Trading mit CSV

```powershell
$env:ZENBOT_DB_TYPE='csv'
$env:ZENBOT_DB_CSV_DIR='C:\temp\zenbot-csv'
node .\zenbot.js trade stub.BTC-USD --paper --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --poll_trades 1000 --run_for 0.05 --non_interactive --filename none
```

## Stub-Exchange

Fuer vollstaendig lokale Tests ist jetzt ein `stub`-Exchange vorhanden:

- Details: `docs/exchanges/stub-de.md`
- Selector: `stub.BTC-USD`

## Bedienungsrelevante Hinweise

### `trade`-Pre-Roll

Der `trade`-Befehl startet seinen internen Pre-Roll-Backfill direkt ueber `node zenbot.js backfill ...`.

Das ist vor allem unter Windows robuster als der fruehere Umweg ueber Batch-Dateien.

### Optionale Output-Module

Wenn ein optionales Output-Modul nicht geladen werden kann, laeuft Zenbot weiter und meldet nur eine Warnung.

Beispiel:

- fehlendes `express` fuer `output.api`

## Status

Der CSV-Betrieb wurde aktuell erfolgreich fuer diese CLI-Pfade validiert:

- `backfill`
- `sim`
- `trade --paper`

Die Validierung gegen alle historischen Live- und Exchange-Sonderfaelle ist damit noch nicht abgeschlossen.

## Fertige Override-Vorlage

Fuer schnelles Umschalten ohne manuelle Aenderungen an `conf.js`:

- `conf-examples/csv.conf.js`
- `conf-examples/csv-live.conf.js`

Beispiel:

```powershell
node .\zenbot.js sim --conf .\conf-examples\csv.conf.js
```

Unterschied:

- `csv.conf.js`
  - lokale Offline-Tests mit `stub.BTC-USD`
- `csv-live.conf.js`
  - CSV-Speicher mit einem echten Selector wie `gdax.BTC-USD`
