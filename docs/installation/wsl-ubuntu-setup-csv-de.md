# WSL-Ubuntu Komplettanleitung fuer Zenbot mit CSV

## Ziel

Diese Anleitung beschreibt den vollstaendigen, praktischsten Einstiegsweg fuer dieses Zenbot-Repo auf WSL mit Ubuntu:

- ohne MongoDB
- mit CSV-Dateibackend
- mit erstem lauffaehigem Test
- mit typischen Fehlerbildern und Gegenmassnahmen

Sie ist als stabile Basis gedacht, bevor spaeter optional wieder auf MongoDB umgestellt wird.

## Fuer wen diese Anleitung gedacht ist

Diese Anleitung ist passend, wenn:

- Zenbot unter WSL auf Windows laufen soll
- MongoDB auf der Zielmaschine bisher Probleme gemacht hat
- zunaechst `backfill`, `sim` und `trade --paper` getestet werden sollen

Wenn spaeter wieder MongoDB verwendet werden soll, bleibt das moeglich. Der aktuelle CSV-Pfad nimmt diese Option nicht weg.

## Aktueller empfohlener Betriebsweg

Fuer den ersten Testlauf ist die empfohlene Reihenfolge:

1. WSL + Ubuntu sauber bereitstellen
2. Node.js und npm installieren
3. Repo frisch im Linux-Dateisystem klonen
4. `npm install` ausfuehren
5. Zenbot mit `csv.conf.js` im `stub`-Modus testen
6. danach optional auf `csv-live.conf.js` mit echtem Selector wechseln

MongoDB ist fuer diesen Einstieg nicht erforderlich.

## Schritt 1: WSL und Ubuntu starten

Unter Windows sollte zuerst sichergestellt sein, dass WSL laeuft und sich Ubuntu oeffnen laesst.

Pruefen:

```powershell
wsl --status
```

Danach Ubuntu starten, zum Beispiel ueber:

```powershell
wsl
```

Oder direkt ueber die installierte Ubuntu-App.

## Schritt 2: In Ubuntu das System aktualisieren

Nach dem ersten Start in Ubuntu:

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

Wenn ein sehr altes Ubuntu-Image verwendet wird, kann dieser Schritt bereits erste Paketprobleme zeigen. In dem Fall ist fuer CSV oft trotzdem ein neueres Ubuntu unter WSL der deutlich schnellere Weg als eine tiefe Reparatur eines Alt-Systems.

## Schritt 3: Node.js und npm installieren

Zenbot benoetigt eine funktionierende Node-Umgebung. Fuer WSL ist ein aktuelles LTS-Node in der Regel der beste Weg.

Wenn `node` und `npm` bereits vorhanden sind:

```bash
node -v
npm -v
```

Wenn sie fehlen, ist `nvm` unter WSL meist der robusteste Installationsweg:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
nvm use --lts
node -v
npm -v
```

Falls `curl` fehlt:

```bash
sudo apt-get install -y curl
```

## Schritt 4: Das Repo im Linux-Dateisystem ablegen

Wichtig ist, das Repo nach Moeglichkeit **nicht** direkt unter `/mnt/c/...` zu betreiben, sondern in einem Linux-Pfad wie `~/zenbot`.

Empfohlener Ablauf:

```bash
cd ~
git clone https://github.com/dwhr-pi/zenbot.git
cd zenbot
```

Warum dieser Weg besser ist:

- weniger Dateisystem-Reibung unter WSL
- meist schnellere Node-Installationen
- weniger Probleme mit Dateirechten und Watchern

### Repo-Bezug pruefen

Nach dem Klonen:

```bash
pwd
git remote -v
```

Erwartet wird:

- ein Linux-Pfad wie `/home/DEINNAME/zenbot`
- `origin` zeigt auf `https://github.com/dwhr-pi/zenbot.git`

Wenn du das Repo bereits auf Windows unter `C:\\...` geklont hast, ist fuer WSL meist trotzdem ein **frischer Clone in Ubuntu** die bessere Wahl als ein direkter Betrieb aus `/mnt/c/...`.

## Schritt 5: Abhaengigkeiten installieren

Im Repo:

```bash
npm install
```

Wenn `npm install` erfolgreich endet, ist der CSV-Testpfad in der Regel freigegeben.

Optional kann danach noch geprueft werden:

```bash
node ./zenbot.js --help
```

## Schritt 6: Mit CSV und `stub` den ersten Testlauf machen

Der erste sichere Einstieg ist die vorbereitete CSV-Testvorlage:

- `conf-examples/csv.conf.js`

Sie ist fuer lokale Offline-Tests mit dem eingebauten `stub`-Exchange gedacht.

### 6.1 Backfill-Test

```bash
node ./zenbot.js backfill --conf ./conf-examples/csv.conf.js --days 1
```

### 6.2 Simulations-Test

```bash
node ./zenbot.js sim --conf ./conf-examples/csv.conf.js
```

### 6.3 Paper-Trading-Test

```bash
node ./zenbot.js trade --paper --conf ./conf-examples/csv.conf.js --run_for 0.05 --non_interactive --filename none
```

Wenn diese drei Befehle laufen, ist Zenbot unter WSL im CSV-Modus praktisch einsatzbereit.

## Schritt 7: CSV mit echtem Selector testen

Wenn der `stub`-Pfad funktioniert, kann als naechster Schritt die Live-CSV-Vorlage verwendet werden:

- `conf-examples/csv-live.conf.js`

Beispiel:

```bash
node ./zenbot.js backfill gdax.BTC-USD --conf ./conf-examples/csv-live.conf.js --days 14
```

Dieser Modus nutzt weiterhin CSV als Speicher, aber nicht mehr den lokalen `stub`-Exchange.

## Wo die CSV-Daten liegen

Im CSV-Modus schreibt Zenbot JSON-Dateien in den konfigurierten Datenordner.

Typische Dateien:

- `trades.json`
- `resume_markers.json`
- `sessions.json`
- `balances.json`
- `periods.json`
- `my_trades.json`
- `sim_results.json`

Je nach verwendeter Konfiguration landen diese Dateien typischerweise unter:

- `./data/csv`
- oder in einem ueber die Konfiguration gesetzten alternativen Verzeichnis

## Typische Stolperstellen

## `node: command not found`

Node.js ist in Ubuntu noch nicht installiert oder die `nvm`-Umgebung ist in der aktuellen Shell noch nicht aktiv.

Hilfe:

```bash
source ~/.nvm/nvm.sh
nvm use --lts
node -v
```

## `npm install` bricht ab

Moegliche Ursachen:

- fehlende Build-Tools
- altes Ubuntu-Paketset
- zeitweise Netzwerkprobleme

Erster Gegenversuch:

```bash
sudo apt-get install -y build-essential python3 make g++
npm install
```

## Warnung wegen `./conf`

Wenn Zenbot meldet, dass `./conf` nicht gefunden wurde, ist das im Testbetrieb zunaechst nicht kritisch, solange ein `--conf`-Override verwendet wird.

Beispiel:

```bash
node ./zenbot.js sim --conf ./conf-examples/csv.conf.js
```

## Warnungen zu optionalen Ausgabemodulen

Einzelne Output- oder API-Module koennen in Teilumgebungen fehlen. Fuer den CSV-Testpfad mit `sim` oder `trade --paper` ist das nicht automatisch ein Blocker, solange der eigentliche Befehl weiterlaeuft.

## Das Repo liegt unter `/mnt/c/...`

Das kann funktionieren, fuehrt unter WSL aber haeufiger zu Reibung.

Besser:

```bash
mv /mnt/c/.../zenbot ~/zenbot
cd ~/zenbot
```

Oder direkt frisch in `~/zenbot` klonen.

## Wann du auf MongoDB wechseln solltest

MongoDB lohnt sich erst dann wieder, wenn:

- der CSV-Testpfad sauber funktioniert
- du historische Mongo-Workflows wirklich brauchst
- du die Legacy-Installation auf deiner Zielumgebung bewusst pflegen willst

Fuer Ubuntu 14.04 ist MongoDB weiterhin der empfindlichere Pfad.

Die Legacy-Anleitung dafuer steht in:

- `docs/installation/wsl-ubuntu-14.04-mongodb-de.md`

## Empfohlene Reihenfolge fuer die Praxis

1. `csv.conf.js` mit `stub`
2. `csv-live.conf.js` mit echtem Selector
3. erst danach optional `mongo.conf.js`

So bekommt man den schnellsten realen Funktionsnachweis, ohne direkt an MongoDB haengen zu bleiben.

## Weitere passende Dokus

- `docs/installation/wsl-ubuntu-erster-test-checkliste-de.md`
- `docs/installation/wsl-ubuntu-csv-test-de.md`
- `docs/installation/csv-de.md`
- `docs/installation/database-modes-de.md`
- `docs/installation/confjs-leitfaden-de.md`
- `docs/installation/wsl-ubuntu-14.04-mongodb-de.md`
