# Zenbot von `dwhr-pi` auf WSL mit Ubuntu 14.04 LTS und MongoDB installieren

## Zweck dieser Anleitung

Diese Anleitung beschreibt einen **Legacy-Installationspfad** fuer dieses Zenbot-Repo auf **WSL 2** mit **Ubuntu 14.04 LTS** und der weiterhin benoetigten **MongoDB**.

Wichtig:

- Ubuntu 14.04 ist historisch und problematisch.
- Aktuelle MongoDB-Pakete unterstuetzen Ubuntu 14.04 nicht mehr.
- Deshalb wird MongoDB hier **nicht** ueber aktuelle `apt`-Repos installiert, sondern als **historischer Tarball** manuell gestartet.

Das ist fuer WSL oft stabiler als ein halb funktionierender Dienst-Setup.

## Realitaetscheck vorab

Stand **28. April 2026**:

- Ubuntu 14.04 ist seit **Ende April 2019** aus der regulaeren Standardpflege heraus und in ESM uebergegangen.
- MongoDB 7.0 nennt fuer Ubuntu nur noch **20.04** und **22.04** als unterstuetzte LTS-Versionen.
- WSL unterstuetzt `systemd`, aber nur mit aktuellem WSL und aktivierter `wsl.conf`.

Konsequenz:

- Zenbot kann man auf Ubuntu 14.04 noch mit Aufwand zum Laufen bringen.
- Die MongoDB-Installation ueber aktuelle Ubuntu-/MongoDB-Repos ist auf 14.04 der typische Bruchpunkt.

## Empfohlener Legacy-Pfad

### Architektur

- **Windows / WSL 2**
- **Ubuntu 14.04 LTS** fuer Zenbot
- **MongoDB 3.2.22** als historischer `ubuntu1404`-Tarball
- MongoDB-Start per `mongod --fork`, nicht zwingend per `systemctl`

Warum genau so:

- Das Repo braucht laut [package.json](../../package.json) Node.js `>=10`.
- Die Abhaengigkeiten sind alt genug, dass ein konservativer Node-Stand sinnvoller ist als ein aktueller.
- MongoDB 3.2.x ist einer der letzten plausiblen historischen Pfade fuer Ubuntu 14.04.

## 1. WSL vorbereiten

In **Windows PowerShell als Administrator**:

```powershell
wsl --install
wsl --set-default-version 2
wsl --update
```

Falls die Distribution bereits existiert, pruefen:

```powershell
wsl -l -v
```

Ziel:

- WSL 2
- Ubuntu 14.04 LTS als vorhandene oder importierte Distribution

## 2. Optional: `systemd` in WSL aktivieren

Nur noetig, wenn du Linux-Dienste wie unter einem normalen Server per `systemctl` fahren willst.

In Ubuntu:

```bash
sudo nano /etc/wsl.conf
```

Eintragen:

```ini
[boot]
systemd=true
```

Dann in Windows:

```powershell
wsl --shutdown
```

Danach WSL neu starten.

Hinweis:
Fuer diese Anleitung ist `systemd` **optional**, weil MongoDB auch direkt per `mongod --fork` gestartet werden kann.

## 3. Alte Ubuntu-Quellen reparieren, falls `apt update` scheitert

Bei Ubuntu 14.04 zeigen die Standardquellen oft nicht mehr sauber auf aktive Mirror.

Falls `sudo apt-get update` mit 404-Fehlern scheitert, `/etc/apt/sources.list` auf `old-releases.ubuntu.com` umstellen.

Beispiel:

```bash
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak
sudo sed -i 's/archive.ubuntu.com/old-releases.ubuntu.com/g' /etc/apt/sources.list
sudo sed -i 's/security.ubuntu.com/old-releases.ubuntu.com/g' /etc/apt/sources.list
sudo apt-get update
```

## 4. Systempakete installieren

```bash
sudo apt-get update
sudo apt-get install -y build-essential git curl ca-certificates python g++ make
```

Optional nuetzlich:

```bash
sudo apt-get install -y unzip pkg-config
```

## 5. Node.js per `nvm` installieren

Fuer dieses Repo ist **Node 14** ein sinnvoller Startpunkt.

`nvm` installieren:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
```

Node 14 installieren und aktivieren:

```bash
nvm install 14
nvm use 14
nvm alias default 14
node -v
npm -v
```

## 6. Zenbot klonen

```bash
cd ~
git clone https://github.com/dwhr-pi/zenbot.git
cd zenbot
```

## 7. Historische MongoDB 3.2.22 fuer Ubuntu 14.04 laden

Download:

```bash
cd ~
curl -LO https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1404-3.2.22.tgz
tar -xzf mongodb-linux-x86_64-ubuntu1404-3.2.22.tgz
mv mongodb-linux-x86_64-ubuntu1404-3.2.22 mongodb-3.2.22
```

Verzeichnisse anlegen:

```bash
mkdir -p ~/mongodb-3.2.22-data
mkdir -p ~/mongodb-3.2.22-log
```

Pfad fuer die laufende Shell setzen:

```bash
export PATH="$HOME/mongodb-3.2.22/bin:$PATH"
```

Dauerhaft in `~/.bashrc`:

```bash
echo 'export PATH="$HOME/mongodb-3.2.22/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## 8. MongoDB manuell starten

Empfohlener Start unter WSL:

```bash
mongod \
  --dbpath "$HOME/mongodb-3.2.22-data" \
  --logpath "$HOME/mongodb-3.2.22-log/mongod.log" \
  --fork \
  --bind_ip 127.0.0.1 \
  --port 27017
```

Pruefen:

```bash
mongo --eval 'db.runCommand({ ping: 1 })'
```

Erwartung:

- Antwort mit `ok : 1`

Stoppen:

```bash
mongo admin --eval 'db.shutdownServer()'
```

## 9. Zenbot konfigurieren

Im Repo:

```bash
cd ~/zenbot
cp conf-sample.js conf.js
```

In [conf.js](../../conf.js) die MongoDB-Werte pruefen oder setzen:

```javascript
c.mongo = {}
c.mongo.db = 'zenbot4'
c.mongo.connectionString = null
c.mongo.host = '127.0.0.1'
c.mongo.port = 27017
c.mongo.username = null
c.mongo.password = null
```

Wichtig:

- Fuer den Legacy-Pfad zunaechst **ohne Authentifizierung** starten.
- Erst wenn Zenbot stabil laeuft, spaeter Benutzer/Passwort nachruesten.

## 10. Zenbot-Abhaengigkeiten installieren

```bash
cd ~/zenbot
npm install
```

Falls alte Native-Module meckern:

```bash
npm rebuild
```

Falls `node-gyp` ueber Python stolpert:

```bash
npm config set python /usr/bin/python
```

## 11. Erste Funktionstests

Mongo pruefen:

```bash
mongo zenbot4 --eval 'db.stats()'
```

Zenbot-Hilfe:

```bash
./zenbot.sh --help
```

Strategien auflisten:

```bash
./zenbot.sh list-strategies
```

Wenn das laeuft, steht der Grundaufbau:

- Node ok
- Mongo ok
- Zenbot CLI ok

## 12. MongoDB bei jeder Sitzung starten

Einfacher WSL-Weg ohne Service-Datei:

```bash
mongod \
  --dbpath "$HOME/mongodb-3.2.22-data" \
  --logpath "$HOME/mongodb-3.2.22-log/mongod.log" \
  --fork \
  --bind_ip 127.0.0.1 \
  --port 27017
```

Wenn du willst, kannst du dafuer spaeter ein kleines Shell-Skript wie `~/bin/start-mongo-zenbot.sh` anlegen.

## 13. Typische Fehler und Gegenmassnahmen

### Problem: `apt-get update` liefert 404

Ursache:

- Ubuntu 14.04 verwendet oft veraltete Standard-Mirror

Loesung:

- auf `old-releases.ubuntu.com` umstellen

### Problem: `systemctl` funktioniert in WSL nicht

Ursache:

- `systemd` ist in WSL nicht automatisch aktiv

Loesung:

- `wsl.conf` setzen und `wsl --shutdown`
- oder Mongo wie oben direkt per `mongod --fork` starten

### Problem: MongoDB startet, aber Zenbot verbindet sich nicht

Pruefen:

```bash
mongo --eval 'db.runCommand({ ping: 1 })'
grep mongo conf.js
ss -ltnp | grep 27017
```

### Problem: `npm install` scheitert bei alten Modulen

Loesung:

```bash
sudo apt-get install -y build-essential python g++ make
npm rebuild
```

### Problem: aktuelle MongoDB-Pakete lassen sich nicht installieren

Das ist unter Ubuntu 14.04 erwartbar.

Benutze in diesem Setup **nicht** die aktuellen `mongodb-org`-Anleitungen fuer Ubuntu 20.04 oder 22.04 direkt auf 14.04. Genau dort entstehen die typischen Sackgassen.

## 14. Was ich fuer diesen Legacy-Pfad nicht empfehle

- MongoDB 7.x oder 8.x auf Ubuntu 14.04 erzwingen
- aktuelle Ubuntu-MongoDB-APT-Listen blind auf 14.04 anwenden
- zuerst Auth, ReplicaSet oder systemd-Automation bauen
- gleichzeitig Zenbot, MongoDB und alternative DB-Interfaces umbauen

## 15. Sinnvolle spaetere Verbesserung

Wenn der Legacy-Aufbau laeuft, ist der naechste vernuenftige Schritt:

1. Zenbot auf diesem Setup nur stabil starten
2. danach pruefen, ob `zenbot-db-interfaces` die MongoDB mittelfristig ersetzen kann
3. erst dann Installationsaufwand fuer MongoDB weiter reduzieren

## Quellen

- Ubuntu 14.04 ESM-Hinweis von Canonical:
  - https://ubuntu.com/blog/ubuntu-14-04-esm-support
- WSL Installation:
  - https://learn.microsoft.com/en-us/windows/wsl/install
- WSL `systemd`:
  - https://learn.microsoft.com/en-us/windows/wsl/systemd
- Aktuelle MongoDB-Unterstuetzung fuer Ubuntu 7.0:
  - https://www.mongodb.com/docs/v7.0/tutorial/install-mongodb-on-ubuntu/
- MongoDB Tarball-Installationsprinzip:
  - https://www.mongodb.com/docs/current/tutorial/install-mongodb-on-ubuntu-tarball/
- Lokale Zenbot-Vorgaben in diesem Repo:
  - `package.json`
  - `conf-sample.js`
  - `MongoDB/README.md`
