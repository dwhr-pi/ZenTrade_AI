# `stub`-Exchange fuer Offline-Tests

## Zweck

Der Exchange `stub` ist ein rein lokaler Test-Adapter fuer Zenbot.

Er ist gedacht fuer:

- CSV-Backend-Tests ohne MongoDB
- Offline-Backfills ohne echte Boerse
- `sim`- und `trade --paper`-Tests ohne API-Schluessel

Er ist **nicht** fuer reales Trading gedacht.

## Aktivierung

Wichtige Umgebungsvariablen:

- `ZENBOT_DB_TYPE=csv`
- `ZENBOT_DB_CSV_DIR=<Pfad zum CSV-Datenordner>`

Optionale Steuerung fuer den Stub:

- `ZENBOT_STUB_INTERVAL`
  - Zeitabstand zwischen synthetischen Trades in Millisekunden
  - Standard: `60000`
- `ZENBOT_STUB_BATCH_SIZE`
  - Anzahl erzeugter Trades pro Abruf
  - Standard: `250`

Der aktive Test-Selector ist:

- `stub.BTC-USD`

## Beispielaufrufe

### Backfill in CSV

```powershell
$env:ZENBOT_DB_TYPE='csv'
$env:ZENBOT_DB_CSV_DIR='C:\temp\zenbot-csv'
node .\zenbot.js backfill stub.BTC-USD --days 1
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

## Bedienungs- und Laufzeitbesonderheiten

### Pre-Roll von `trade`

Der `trade`-Befehl startet seinen internen Pre-Roll-`backfill` jetzt direkt ueber den laufenden Node-Interpreter und `zenbot.js`.

Folge:

- robuster auf Windows
- keine Abhaengigkeit mehr von problematischem `.bat`-Quoting bei Pfaden mit Leerzeichen

### Optionale Output-Module

Wenn ein aktiviertes Output-Modul nicht geladen werden kann, zum Beispiel weil `express` fuer die Web-API fehlt, laeuft `trade` weiter und gibt nur eine Warnung aus.

Das betrifft aktuell besonders:

- `output.api`

Wenn die Web-API wirklich genutzt werden soll, muessen die fehlenden Node-Abhaengigkeiten weiterhin sauber installiert werden.

## Hinweise zum Testverhalten

- Der Stub erzeugt deterministische synthetische Trades.
- Fuer `backfill` arbeitet er rueckwaerts-kompatibel zum bestehenden Zenbot-Pfad.
- Fuer `trade --paper` beantwortet er auch Vorwaerts-Abfragen fuer Live-/Polling-Tests.
- Preis und Volumen sind nur Testdaten und nicht marktrealistisch.
