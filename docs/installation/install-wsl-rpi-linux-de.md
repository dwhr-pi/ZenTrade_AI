# ZenTrade_AI auf WSL, Raspberry Pi und Linux

## Ziel

Diese Anleitung ergaenzt den Schnellstart und konzentriert sich auf den aktuellen ZenTrade_AI-Testpfad:

- Repository direkt klonen
- lokal mit `csv` oder `sql` arbeiten
- ohne MongoDB-Zwang backtesten, simulieren und Paper-Trading vorbereiten

## Repository klonen

```bash
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
```

## Gemeinsame Grundidee

Fuer WSL, Raspberry Pi OS, DietPi und Ubuntu gilt aktuell:

- Node.js und npm werden benoetigt
- `npm install` richtet die Projektabhaengigkeiten ein
- fuer den lokalen Testpfad sind `csv` und `sql` wichtiger als MongoDB
- `sql` nutzt im aktuellen Stand SQLite ueber `node:sqlite`

## WSL unter Windows

Empfohlen ist Ubuntu unter WSL.

### Basisinstallation

In PowerShell als Administrator:

```powershell
wsl --install
```

Danach Ubuntu starten und im Linux-Terminal:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

Node.js installieren, zum Beispiel ueber die Distribution oder den im Team bevorzugten Weg.

Danach:

```bash
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
node ./scripts/test-csv-compat.js
node ./scripts/test-sql-compat.js
```

Passende Vertiefung:

- `docs/installation/wsl-ubuntu-kommandosammlung-de.md`
- `docs/installation/wsl-ubuntu-repo-clone-update-de.md`
- `docs/installation/wsl-ubuntu-erster-test-checkliste-de.md`
- `docs/installation/wsl-ubuntu-csv-test-de.md`
- `docs/installation/wsl-ubuntu-setup-csv-de.md`

## Ubuntu und aehnliche Linux-Systeme

Beispiel:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
```

Erster lokaler Test:

```bash
node ./zenbot.js backfill stub.BTC-USD --conf ./conf-examples/csv.conf.js --days 1
node ./zenbot.js sim stub.BTC-USD --conf ./conf-examples/csv.conf.js --strategy volume_universal --period_length 1m --days 1
```

Alternative mit SQL:

```bash
node ./zenbot.js backfill stub.BTC-USD --conf ./conf-examples/sql.conf.js --days 1
node ./zenbot.js sim stub.BTC-USD --conf ./conf-examples/sql.conf.js --strategy volume_universal --period_length 1m --days 1
```

## Raspberry Pi OS und DietPi

Gerade auf ARM-Systemen ist der lokale `csv`-/`sql`-Pfad besonders interessant, weil MongoDB dort haeufig der stoerendste Teil ist.

Empfohlene Basis:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
```

Danach zuerst `csv` oder `sql` testen, bevor weitere Dienste dazu kommen:

```bash
node ./scripts/test-csv-compat.js
node ./scripts/test-sql-compat.js
```

Hinweis fuer DietPi und Raspberry Pi:

- zuerst den lokalen Testpfad stabil bekommen
- danach Backfill und Simulation pruefen
- MongoDB nur dann noch anfassen, wenn wirklich Altpfade gebraucht werden

## Empfohlener erster Test

```bash
node ./zenbot.js backfill stub.BTC-USD --conf ./conf-examples/sql.conf.js --days 1
node ./zenbot.js sim stub.BTC-USD --conf ./conf-examples/sql.conf.js --strategy volume_universal --period_length 1m --days 1
```

## Verwandte Doku

- `docs/installation/README-de.md`
- `docs/installation/database-modes-de.md`
- `docs/installation/csv-de.md`
- `docs/installation/backtest-automatisierung-de.md`
