# WSL-Ubuntu Anleitung fuer Repo-Clone und Updates

## Zweck

Diese Anleitung beschreibt nur den Git-Teil fuer dieses Zenbot-Repo unter WSL mit Ubuntu:

- Repo erstmals holen
- richtigen Remote pruefen
- aktuellen Stand aktualisieren
- lokalen Arbeitsstand kontrollieren

Sie ist bewusst kurz gehalten und kann vor der eigentlichen Zenbot-Installation verwendet werden.

## Empfohlener Zielpfad

Unter WSL ist ein Linux-Pfad wie `~/zenbot` meist die bessere Wahl als ein Arbeitsverzeichnis unter `/mnt/c/...`.

Empfehlung:

```bash
cd ~
```

## 1. Git pruefen

```bash
git --version
```

Falls Git fehlt:

```bash
sudo apt-get update
sudo apt-get install -y git
```

## 2. Repo erstmals klonen

Dieses deutsch angepasste Repo holst du so:

```bash
cd ~
git clone https://github.com/dwhr-pi/zenbot.git
cd zenbot
```

## 3. Nach dem Klonen pruefen

### Arbeitsverzeichnis pruefen

```bash
pwd
```

Erwartet wird ein Pfad in dieser Art:

```bash
/home/DEINNAME/zenbot
```

### Remote pruefen

```bash
git remote -v
```

Erwartet wird `origin` mit:

```bash
https://github.com/dwhr-pi/zenbot.git
```

### Branch pruefen

```bash
git branch --show-current
```

Wenn du nur den aktuellen Stand ansehen willst, reicht das bereits.

## 4. Spaeter den neuesten Stand holen

Wenn das Repo schon vorhanden ist:

```bash
cd ~/zenbot
git pull
```

## 5. Vor einem Update den lokalen Stand pruefen

Wenn du eigene Aenderungen gemacht hast, ist vor `git pull` dieser Blick sinnvoll:

```bash
git status
```

Wenn dort lokale Aenderungen auftauchen, sollte zuerst entschieden werden, ob sie:

- committed werden sollen
- temporaer gesichert werden sollen
- oder bewusst unveraendert bleiben

## 6. Nur den Remote-Stand ansehen

Wenn du zuerst nur vergleichen willst:

```bash
cd ~/zenbot
git fetch
git status
```

Damit siehst du in der Regel schon, ob dein lokaler Stand hinter `origin` liegt.

## 7. Einen bestimmten Remote noch einmal setzen

Falls der Remote spaeter falsch ist oder geaendert werden soll:

```bash
git remote set-url origin https://github.com/dwhr-pi/zenbot.git
git remote -v
```

## 8. Frischen Clone statt Problemverzeichnis

Wenn ein altes Repo unter `/mnt/c/...` seltsam reagiert, ist oft dieser Weg schneller als langes Reparieren:

```bash
cd ~
git clone https://github.com/dwhr-pi/zenbot.git zenbot-frisch
cd zenbot-frisch
```

## 9. Danach mit der Zenbot-Einrichtung weitermachen

Nach erfolgreichem Clone oder Update sind die naechsten passenden Dokus:

- `docs/installation/wsl-ubuntu-erster-test-checkliste-de.md`
- `docs/installation/wsl-ubuntu-setup-csv-de.md`
- `docs/installation/csv-de.md`

## Kurzfassung

Erst holen:

```bash
cd ~
git clone https://github.com/dwhr-pi/zenbot.git
cd zenbot
```

Spaeter aktualisieren:

```bash
cd ~/zenbot
git status
git pull
```
