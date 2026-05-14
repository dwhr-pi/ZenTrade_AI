# Installations- und Fehlerlogging

Fuer ZenTrade_AI kann ein lokales Log-System genutzt werden, damit Installations- und Integrationsprobleme spaeter leichter nachvollziehbar sind.

## Ziel

Die Logs sollen helfen bei:

- `npm install`-Problemen
- Postinstall-Fehlern
- nativen Modulproblemen
- Problemen mit lokalen Strategie-Integrationen

## Verfuegbare Werkzeuge

Umgebungsdiagnose schreiben:

```powershell
npm run diagnose
```

`npm install` inklusive Logdatei ausfuehren:

```powershell
npm run install:log
```

Integrationsstatus der Strategien pruefen und mitschreiben:

```powershell
npm run test:strategy-integrations:log
```

## Speicherort

Die erzeugten Dateien liegen unter:

- `logs/env-check.log`
- `logs/install.log`
- `logs/strategy-integrations.log`

## Eigene Befehle mitschreiben

Beliebige weitere Befehle koennen ueber das Hilfsskript ausgefuehrt werden:

```powershell
node .\scripts\run-and-log.js runtime.log node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\csv.conf.js --strategy copy_trading_file --days 1
```

## Nutzen fuer Fehlersuche

Die Logs enthalten:

- Zeitstempel
- Arbeitsverzeichnis
- den ausgefuehrten Befehl
- stdout und stderr
- Exit-Code
