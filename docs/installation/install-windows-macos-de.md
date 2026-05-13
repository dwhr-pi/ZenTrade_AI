# ZenTrade_AI unter Windows und macOS

## Ziel

Diese Anleitung uebernimmt den brauchbaren Teil der alten Installationsnotizen und richtet ihn auf den heutigen ZenTrade_AI-Stand aus.

Wichtig:

- fuer Windows ist WSL weiterhin der bevorzugte Weg
- fuer macOS und Windows stehen lokale Tests mit `csv` oder `sql` im Vordergrund
- MongoDB ist fuer Backtests, Simulationen und Paper-Trading nicht mehr zwingend noetig

## Windows

### Empfohlener Weg

Der bevorzugte Weg ist:

1. WSL installieren
2. Ubuntu unter WSL verwenden
3. ZenTrade_AI direkt dort klonen und testen

Schnellstart:

```powershell
wsl --install
```

Danach in Ubuntu:

```bash
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
node ./scripts/test-csv-compat.js
node ./scripts/test-sql-compat.js
```

Vertiefung:

- `docs/installation/install-wsl-rpi-linux-de.md`
- `docs/installation/windows-exe-de.md`

### Alternativer nativer Windows-Weg

Falls ohne WSL getestet werden soll:

```powershell
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
node .\zenbot.js --help
```

Dieser Weg ist interessant, aber derzeit weniger robust als WSL.

## macOS

macOS ist fuer den CLI-Betrieb grundsaetzlich geeignet.

### Grundinstallation

Mit Homebrew oder einer vorhandenen Toolchain:

```bash
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
```

Erster Test:

```bash
node ./scripts/test-csv-compat.js
node ./scripts/test-sql-compat.js
```

Danach kann direkt mit `csv` oder `sql` getestet werden.

## Erster fachlicher Test

Unabhaengig von Windows oder macOS:

```bash
node ./zenbot.js backfill stub.BTC-USD --conf ./conf-examples/sql.conf.js --days 1
node ./zenbot.js sim stub.BTC-USD --conf ./conf-examples/sql.conf.js --strategy volume_universal --period_length 1m --days 1
```

## Hinweis

Fuer den heutigen ZenTrade_AI-Fokus sind robuste lokale Testpfade wichtiger als die alte Vollabhaengigkeit von MongoDB oder fruehes Packaging. Deshalb sind WSL, `csv` und `sql` in dieser Doku bewusst priorisiert.
