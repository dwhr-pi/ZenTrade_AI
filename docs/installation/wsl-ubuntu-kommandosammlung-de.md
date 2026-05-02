# WSL-Ubuntu Kommandosammlung fuer den ersten Zenbot-Tag

## Zweck

Diese Datei sammelt die wichtigsten Befehle fuer den ersten praktischen Arbeitstag mit Zenbot unter WSL und Ubuntu.

Sie ist als schnelle Referenz gedacht fuer:

- Repo holen
- Umgebung pruefen
- Abhaengigkeiten installieren
- CSV-Testlauf starten
- einfachen Fehlern nachgehen

## 1. WSL und Ubuntu pruefen

```powershell
wsl --status
```

```bash
pwd
uname -a
```

## 2. Ins Home-Verzeichnis wechseln

```bash
cd ~
pwd
```

## 3. Git pruefen oder installieren

```bash
git --version
```

```bash
sudo apt-get update
sudo apt-get install -y git
```

## 4. Dieses Repo klonen

```bash
cd ~
git clone https://github.com/dwhr-pi/zenbot.git
cd zenbot
```

## 5. Repo-Stand pruefen

```bash
pwd
git remote -v
git branch --show-current
git status
```

## 6. Node.js und npm pruefen

```bash
node -v
npm -v
```

## 7. `nvm` und aktuelles LTS-Node installieren

```bash
sudo apt-get install -y curl
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
nvm use --lts
node -v
npm -v
```

## 8. Build-Werkzeuge installieren

```bash
sudo apt-get install -y build-essential python3 make g++
```

## 9. Zenbot-Abhaengigkeiten installieren

```bash
npm install
```

## 10. Schneller Grundtest

```bash
node ./zenbot.js --help
```

## 11. CSV-Backfill-Test

```bash
node ./zenbot.js backfill --conf ./conf-examples/csv.conf.js --days 1
```

## 12. CSV-Simulations-Test

```bash
node ./zenbot.js sim --conf ./conf-examples/csv.conf.js
```

## 13. CSV-Paper-Test

```bash
node ./zenbot.js trade --paper --conf ./conf-examples/csv.conf.js --run_for 0.05 --non_interactive --filename none
```

## 14. CSV mit echtem Selector

```bash
node ./zenbot.js backfill gdax.BTC-USD --conf ./conf-examples/csv-live.conf.js --days 14
```

## 15. Datenordner ansehen

```bash
ls -la ./data
ls -la ./data/csv
```

## 16. Wichtige Git-Befehle spaeter

```bash
git fetch
git pull
git status
```

## 17. Typische Schnellhilfen

Wenn `node` fehlt:

```bash
source ~/.nvm/nvm.sh
nvm use --lts
node -v
```

Wenn `npm install` haengt oder scheitert:

```bash
sudo apt-get install -y build-essential python3 make g++
npm install
```

Wenn du wissen willst, in welchem Repo du stehst:

```bash
pwd
git remote -v
```

Wenn du vor einem Update erst den Stand sehen willst:

```bash
git fetch
git status
```

## 18. Empfohlene Lesereihenfolge

- `docs/installation/wsl-ubuntu-repo-clone-update-de.md`
- `docs/installation/wsl-ubuntu-erster-test-checkliste-de.md`
- `docs/installation/wsl-ubuntu-setup-csv-de.md`
- `docs/installation/csv-de.md`
