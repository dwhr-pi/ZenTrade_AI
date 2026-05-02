# WSL-Ubuntu Checkliste fuer den ersten Zenbot-Test

## Zweck

Diese Checkliste ist die kurze Praxisfassung fuer den ersten Testlauf von Zenbot unter WSL mit Ubuntu und CSV.

Sie ist zum direkten Abarbeiten gedacht.

## 1. WSL starten

- Ubuntu unter WSL oeffnen
- pruefen, ob WSL laeuft:

```powershell
wsl --status
```

## 2. In Ubuntu in das Home-Verzeichnis wechseln

```bash
cd ~
pwd
```

Empfohlen ist ein Linux-Pfad wie `~/zenbot` und nicht `/mnt/c/...`.

## 3. Git pruefen

```bash
git --version
```

Falls Git fehlt:

```bash
sudo apt-get update
sudo apt-get install -y git
```

## 4. Dieses Repo holen

Am einfachsten direkt per `git clone`:

```bash
cd ~
git clone https://github.com/dwhr-pi/zenbot.git
cd zenbot
```

Danach kurz pruefen:

```bash
pwd
git remote -v
```

Du solltest dann in einem Pfad wie diesem stehen:

```bash
/home/DEINNAME/zenbot
```

Und `origin` sollte auf `dwhr-pi/zenbot` zeigen.

## 5. Node.js und npm pruefen

```bash
node -v
npm -v
```

Wenn `node` oder `npm` fehlen, ist unter WSL meist `nvm` der sauberste Weg:

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

## 6. Repo-Abhaengigkeiten installieren

Im Repo:

```bash
npm install
```

Optionaler Schnelltest:

```bash
node ./zenbot.js --help
```

## 7. Ersten CSV-Backfill testen

```bash
node ./zenbot.js backfill --conf ./conf-examples/csv.conf.js --days 1
```

## 8. Erste CSV-Simulation testen

```bash
node ./zenbot.js sim --conf ./conf-examples/csv.conf.js
```

## 9. Ersten CSV-Paper-Test starten

```bash
node ./zenbot.js trade --paper --conf ./conf-examples/csv.conf.js --run_for 0.05 --non_interactive --filename none
```

## 10. Wenn das funktioniert

Dann ist der erste WSL-Testlauf geglueckt.

Als naechstes kannst du:

- bei CSV bleiben und `csv-live.conf.js` mit echtem Selector testen
- spaeter optional wieder auf MongoDB gehen

## Typische Sofort-Hinweise

- Warnungen zu `./conf` sind im Override-Betrieb mit `--conf` zunaechst normal.
- CSV ist der aktuell einfachste Startweg.
- MongoDB brauchst du fuer diesen ersten Test nicht.

## Passende Langfassungen

- `docs/installation/wsl-ubuntu-kommandosammlung-de.md`
- `docs/installation/wsl-ubuntu-repo-clone-update-de.md`
- `docs/installation/wsl-ubuntu-csv-test-de.md`
- `docs/installation/wsl-ubuntu-setup-csv-de.md`
- `docs/installation/csv-de.md`
- `docs/installation/database-modes-de.md`
