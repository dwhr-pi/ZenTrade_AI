![ZenTrade_AI Logo](assets/logo.png)

# ZenTrade_AI

ZenTrade_AI ist der aktuelle Arbeitsstand dieses Repositories fuer Analyse, Backtesting, Simulation und Paper-Trading auf Basis von Zenbot.

Der Schwerpunkt liegt bewusst auf:

- Datenanalyse
- Strategieentwicklung
- Backtesting
- Simulation
- `trade --paper`
- lokalem Testbetrieb ohne MongoDB

Nicht Ziel dieses Repos sind:

- AI-gesteuerte Live-Orderausfuehrung
- autonome Kauf- oder Verkaufsentscheidungen
- Finanzberatung

Die verbindliche Projektgrenze steht in:

- [Trading_Analysis.md](Trading_Analysis.md)
- [docs/trading-risiken-und-grenzen-de.md](docs/trading-risiken-und-grenzen-de.md)

## Aktueller Stand

Im aktuellen Projektstand sind bereits eingearbeitet:

- CSV-Dateibackend fuer lokale Tests ohne MongoDB
- `stub`-Exchange fuer reproduzierbare Offline-Tests
- WSL-/Ubuntu-Dokumentation fuer den CSV-Pfad
- Backtest-Skripte mit automatischer Strategie-Erkennung
- automatische Selector-Erkennung ueber Exchange-`products.json`
- Ranking-Dateien fuer Backtest-Auswertungen

Wichtig fuer die Datenmodi:

- `mongo` bleibt als Altpfad vorhanden
- `csv` ist aktuell der praktisch nutzbare lokale Test- und Pilotpfad
- `sql` ist dokumentarisch vorbereitet, aber im Kern noch nicht aktiviert

Details dazu:

- [docs/installation/database-modes-de.md](docs/installation/database-modes-de.md)

## Installation

### 1. Repository klonen

```powershell
git clone <REPO-URL>
cd ZenTrade_AI
```

### 2. Abhaengigkeiten installieren

```powershell
npm install
```

Hinweis:

- In diesem Projekt gibt es zusaetzliche Sicherungskopien wie `node_module - copy`.
- Diese dienen nur als Referenz alter funktionierender Installationen und sind kein regulaerer Laufzeitpfad.

### 3. Konfiguration waehlen

Fuer den aktuellen lokalen Einstieg ohne MongoDB:

```powershell
node .\zenbot.js sim --conf .\conf-examples\csv.conf.js
```

Die wichtigste lokale Vorlage ist:

- [conf-examples/csv.conf.js](conf-examples/csv.conf.js)

Weitere Vorlagen:

- `conf-examples/csv-live.conf.js`
- `conf-examples/mongo.conf.js`
- `conf-examples/sql.conf.js`

## Empfohlener Einstieg ohne MongoDB

Wenn MongoDB in der Zielumgebung problematisch ist, ist der empfohlene Weg aktuell:

1. CSV-Konfiguration verwenden.
2. Mit dem `stub`-Exchange lokal testen.
3. Backfill, Simulation und spaeter `trade --paper` pruefen.

### CSV-Backfill

```powershell
node .\zenbot.js backfill stub.BTC-USD --conf .\conf-examples\csv.conf.js --days 1
```

### CSV-Simulation

```powershell
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\csv.conf.js --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --filename none --days 1
```

### CSV-Paper-Trading

```powershell
node .\zenbot.js trade stub.BTC-USD --paper --conf .\conf-examples\csv.conf.js --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --poll_trades 1000 --run_for 0.05 --non_interactive --filename none
```

## Referenzlauf

Ein aktueller reproduzierbarer Referenz-Backtest liegt unter:

- [simulations/reports/reference_backtest_20260503/README.md](simulations/reports/reference_backtest_20260503/README.md)

Dieser Lauf dokumentiert den derzeit funktionierenden CSV-/Stub-Pfad ohne MongoDB.

## Wichtige Dokumente

Fuer den aktuellen Projektstand sind besonders relevant:

- [docs/installation/README-de.md](docs/installation/README-de.md)
- [docs/installation/csv-de.md](docs/installation/csv-de.md)
- [docs/installation/database-modes-de.md](docs/installation/database-modes-de.md)
- [docs/installation/confjs-leitfaden-de.md](docs/installation/confjs-leitfaden-de.md)
- [docs/installation/backtest-automatisierung-de.md](docs/installation/backtest-automatisierung-de.md)
- [docs/installation/wsl-ubuntu-kommandosammlung-de.md](docs/installation/wsl-ubuntu-kommandosammlung-de.md)
- [docs/installation/wsl-ubuntu-repo-clone-update-de.md](docs/installation/wsl-ubuntu-repo-clone-update-de.md)
- [docs/installation/wsl-ubuntu-erster-test-checkliste-de.md](docs/installation/wsl-ubuntu-erster-test-checkliste-de.md)
- [docs/installation/wsl-ubuntu-csv-test-de.md](docs/installation/wsl-ubuntu-csv-test-de.md)
- [docs/installation/wsl-ubuntu-setup-csv-de.md](docs/installation/wsl-ubuntu-setup-csv-de.md)

## Tests

Der aktuelle Regressionstest fuer die Backtest-Helferlaeuft ueber:

```powershell
npm run test:backtest-helper
```

Der CSV-Kompatibilitaetstest laeuft ueber:

```powershell
node .\scripts\test-csv-compat.js
```

## Risiken und Haftung

- Nutzung auf eigene Gefahr
- keine Haftung fuer finanzielle Verluste
- keine Haftung fuer technische oder indirekte Schaeden

Backtests, Simulationen und Paper-Trading koennen von echtem Marktverhalten deutlich abweichen.
