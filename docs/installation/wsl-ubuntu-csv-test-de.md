# WSL-Ubuntu Testanleitung fuer Zenbot mit CSV

## Ziel

Diese Anleitung ist der schnellste Weg, Zenbot auf WSL mit Ubuntu **ohne MongoDB** anzutesten.

Der Fokus liegt auf:

- erstem erfolgreichen Start
- CSV-Dateibetrieb
- Offline-Tests mit `stub`
- spaeterem Umschalten auf echte Selectoren

Wenn du statt der Kurzfassung eine komplette Schritt-fuer-Schritt-Installation brauchst, lies zusaetzlich:

- `docs/installation/wsl-ubuntu-erster-test-checkliste-de.md`
- `docs/installation/wsl-ubuntu-setup-csv-de.md`

## Wann kannst du testen?

Sobald diese vier Punkte erfuellt sind:

1. WSL mit Ubuntu laeuft.
2. Node.js und npm sind in Ubuntu verfuegbar.
3. Das Repo liegt in einem frischen Linux-Arbeitsverzeichnis.
4. `npm install` ist im Repo durchgelaufen.

Ab dann kannst du Zenbot mit CSV ausprobieren.

MongoDB ist fuer diesen Einstieg **nicht** noetig.

## Empfehlung fuer den Start

Teste zuerst **nicht** direkt mit MongoDB und auch nicht sofort mit einer echten Boerse.

Empfohlene Reihenfolge:

1. `stub` + CSV
2. CSV mit echtem Selector
3. erst danach optional MongoDB

## Schritt 1: WSL und Ubuntu bereitstellen

Wenn WSL auf dem Windows-System noch nicht installiert ist, ist der offizielle Startpunkt:

- Microsoft Learn: `wsl --install`

Wenn Ubuntu bereits laeuft, kannst du direkt mit Schritt 2 weitermachen.

## Schritt 2: Node.js in Ubuntu bereitstellen

Wichtig ist vor allem:

- modernes Node.js
- funktionierendes `npm`

Pruefen:

```bash
node -v
npm -v
```

## Schritt 3: Repo frisch in WSL ablegen

Ich empfehle ausdruecklich einen **frischen Clone innerhalb des Linux-Dateisystems**, zum Beispiel unter deinem Home-Verzeichnis.

Beispiel:

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/dwhr-pi/zenbot.git
cd zenbot
```

Warum das wichtig ist:

- keine alten Windows-`node_modules`
- sauberere Dateirechte
- weniger Reibung mit nativen Node-Abhaengigkeiten

## Schritt 4: Abhaengigkeiten installieren

Im Repo:

```bash
npm install
```

Wenn das erfolgreich war, ist Zenbot fuer erste CSV-Tests bereit.

## Schritt 5: Erster CSV-Test ohne MongoDB

Die einfachste Einstiegsvorlage ist:

- `conf-examples/csv.conf.js`

Erster Test:

```bash
node ./zenbot.js backfill --conf ./conf-examples/csv.conf.js --days 1
```

Danach:

```bash
node ./zenbot.js sim --conf ./conf-examples/csv.conf.js
```

Und fuer einen kurzen Paper-Test:

```bash
node ./zenbot.js trade --paper --conf ./conf-examples/csv.conf.js --run_for 0.05 --non_interactive --filename none
```

## Schritt 6: CSV mit echtem Selector testen

Wenn der Stub-Test sauber lief, nimm diese Vorlage:

- `conf-examples/csv-live.conf.js`

Beispiel:

```bash
node ./zenbot.js backfill gdax.BTC-USD --conf ./conf-examples/csv-live.conf.js --days 14
```

Danach:

```bash
node ./zenbot.js sim gdax.BTC-USD --conf ./conf-examples/csv-live.conf.js
```

Wichtig:

- Das haengt dann auch von den Abhaengigkeiten des jeweiligen Exchange-Moduls ab.
- CSV ist hier nur der Speicherpfad, nicht die Boersenanbindung.

## Was ist auf WSL heute schon realistisch?

### Bereits gut geeignet

- CSV-Backfill mit `stub`
- CSV-Simulation mit `stub`
- CSV-`trade --paper` mit `stub`

### Als naechster sinnvoller Schritt

- CSV mit echtem Selector wie `gdax.BTC-USD`

### Noch nicht mein erster Rat

- MongoDB auf Ubuntu 14.04 in WSL als erster Einstieg
- SQL als aktiver Kernmodus

## Typische Hinweise

### Warnung zu `./conf`

Wenn keine eigene `conf.js` existiert, faellt Zenbot auf `conf-sample.js` zurueck.

Diese Meldung ist fuer erste Tests normal.

### Warnung zu optionalen Output-Modulen

Wenn zum Beispiel `express` fehlt, kann `output.api` uebersprungen werden.

Das blockiert den CSV-Testpfad nicht mehr automatisch.

### Datenablage

Im CSV-Modus schreibt Zenbot in JSON-Dateien, zum Beispiel:

- `trades.json`
- `resume_markers.json`
- `sessions.json`
- `balances.json`
- `periods.json`
- `my_trades.json`
- `sim_results.json`

## Wenn du spaeter wieder MongoDB willst

Dann kannst du danach jederzeit wieder auf:

- `conf-examples/mongo.conf.js`

oder auf eine eigene `conf.js` mit `c.db.type = 'mongo'` zurueckwechseln.

CSV ersetzt den Mongo-Pfad nicht.

## Verwandte Doku

- `docs/installation/csv-de.md`
- `docs/installation/database-modes-de.md`
- `docs/installation/confjs-leitfaden-de.md`
- `docs/exchanges/stub-de.md`
- `docs/installation/wsl-ubuntu-14.04-mongodb-de.md`

## Offizielle Grundlagen

- Microsoft Learn: WSL-Installation
- npm Docs: lokale Paketinstallation mit `npm install`
