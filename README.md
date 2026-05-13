# ZenTrade_AI

`ZenTrade_AI` ist die aktuelle Arbeitslinie fuer Analyse, Backtesting, Simulation und Paper-Trading auf Basis von Zenbot. Der Schwerpunkt liegt auf einer lokal nutzbaren Infrastruktur ohne MongoDB-Zwang, mit sauber dokumentierter Umschaltung zwischen mehreren Datenbanktechniken.

Wichtiger Hinweis:

- Nutzung auf eigene Gefahr.
- Keine Haftung fuer Verluste oder Schaeden.
- Die Projektlinie in `Trading_Analysis.md` und den Dokus bleibt fuehrend.

## Aktueller Fokus

- Analyse und Strategieentwicklung
- Backtesting und Simulationslaeufe
- Paper-Trading
- CSV- und SQL-basierte lokale Datenspeicherung
- spaetere Erweiterbarkeit fuer weitere Datenbankpfade

## Datenbankmodi

Der Kern kann aktuell mit drei Konfigurationspfaden arbeiten:

- `mongo` fuer klassischen Altbetrieb
- `csv` fuer lokale Dateiablaeufe ohne MongoDB
- `sql` fuer lokalen SQL-Betrieb mit automatischer SQLite-Einrichtung

Wichtig:

- `csv` und `sql` sind fuer lokale Tests, Backfills, Simulationen und Paper-Trading gedacht.
- `sql` nutzt derzeit SQLite ueber die in Node.js eingebaute `node:sqlite`-Runtime.
- Wenn `db.type='sql'` gesetzt ist, wird die SQLite-Datei bei Bedarf automatisch angelegt.
- Externe SQL-Server wie PostgreSQL oder MySQL werden im aktuellen Stand noch nicht automatisch installiert oder eingebunden.

Mehr dazu:

- `docs/installation/database-modes-de.md`
- `docs/installation/csv-de.md`

## Repository klonen

Zum Testen, Backtesten und fuer lokale Simulationen sollte direkt dieses Repository geklont werden:

```bash
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
```

Wichtig:

- Fuer `csv` und `sql` ist MongoDB im aktuellen Projektstand nicht mehr Pflicht.
- Fuer lokale Tests reicht in der Regel eine passende Node.js-Installation plus dieses Repo.
- Die ausfuehrliche Schnellstart-Anleitung unter `docs` bleibt bestehen und wird weiterhin als Doku-Einstieg empfohlen.

Schnelle Installationspfade:

- WSL: `docs/installation/README-de.md`, `docs/installation/install-wsl-rpi-linux-de.md`
- Raspberry Pi OS und DietPi: `docs/installation/raspberrypi-de.md`, `docs/installation/install-wsl-rpi-linux-de.md`
- Ubuntu und aehnliche Linux-Systeme: `docs/installation/debian-ubuntu-de.md`, `docs/installation/install-wsl-rpi-linux-de.md`
- Windows-EXE und Windows-spezifische Hinweise: `docs/installation/windows-exe-de.md`
- Autostart: `docs/installation/autostart-de.md`
- Windows und macOS Installationspfad: `docs/installation/install-windows-macos-de.md`

## Empfohlener Einstieg ohne MongoDB

### CSV

```powershell
node .\zenbot.js backfill stub.BTC-USD --conf .\conf-examples\csv.conf.js --days 1
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\csv.conf.js --strategy volume_universal --period_length 1m --days 1
```

### SQL

```powershell
node .\zenbot.js backfill stub.BTC-USD --conf .\conf-examples\sql.conf.js --days 1
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\sql.conf.js --strategy volume_universal --period_length 1m --days 1
```

## Konfigurationsvorlagen

- `conf-examples/csv.conf.js`
- `conf-examples/csv-live.conf.js`
- `conf-examples/sql.conf.js`
- `conf-examples/mongo.conf.js`

Die Auswahl erfolgt ueber `db.type` oder direkt per `--conf`.

## Schnelle Verifikation

CSV-Kompatibilitaet:

```powershell
node .\scripts\test-csv-compat.js
```

SQL-Kompatibilitaet:

```powershell
npm run test:sql-compat
```

## Installationshinweis

Fuer den aktuellen lokalen Kernpfad gilt:

- MongoDB ist nicht mehr Voraussetzung fuer Backtests und Simulationen.
- CSV braucht keine zusaetzliche Datenbankinstallation.
- SQL braucht im aktuellen Projektstand keine separate SQLite-Installation, solange eine Node.js-Version mit `node:sqlite` verwendet wird.

## Plattformhinweis

Fuer den aktuellen ZenTrade_AI-Testpfad ist die empfohlene Reihenfolge:

1. Repository klonen
2. `npm install`
3. einen lokalen `csv`- oder `sql`-Pfad waehlen
4. Backfill oder Simulation gegen `stub.BTC-USD` pruefen

Beispiel fuer den ersten SQL-Test:

```bash
node ./zenbot.js backfill stub.BTC-USD --conf ./conf-examples/sql.conf.js --days 1
node ./zenbot.js sim stub.BTC-USD --conf ./conf-examples/sql.conf.js --strategy volume_universal --period_length 1m --days 1
```

## Naechste Integrationslinie

- SQL weiter verfestigen und gegen mehr reale Backtestfaelle pruefen
- Material aus `neue Strategien und Scripte` gezielt in den Kern uebernehmen
- anschliessend Access-Kompatibilitaet auf einer stabilen SQL-Basis untersuchen
