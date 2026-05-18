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

CSV/SQL-Handover pruefen und mitschreiben:

```powershell
npm run test:db-interface-handover
npm run test:db-interface-handover:log
```

End-to-End-Pfad `backfill -> sim_results` pruefen und mitschreiben:

```powershell
npm run test:backfill-sim-e2e
npm run test:backfill-sim-e2e:log
```

Signalformat fuer `copy_trading_file` pruefen:

```powershell
npm run test:copy-trading-signal
npm run test:copy-trading-signal:log
```

Szenario-Test fuer `copy_trading_file` pruefen:

```powershell
npm run test:copy-trading-scenario
npm run test:copy-trading-scenario:log
```

## Speicherort

Die erzeugten Dateien liegen unter:

- `logs/env-check.log`
- `logs/install.log`
- `logs/strategy-integrations.log`
- `logs/runtime-issues.jsonl`
- `logs/runtime-issues.md`

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

## Allgemeiner Fehlerbericht fuer Laufzeitprobleme

Fuer Abstuerze, Inkompatibilitaeten oder uebermaessige Laufzeiten kann ein Befehl ueber das Reporting-Hilfsskript ausgefuehrt werden:

```powershell
npm run sim:copy-trading-sql:report
```

Das Skript schreibt:

- den normalen Lauf in eine Logdatei
- Fehler und Auffaelligkeiten zusaetzlich als strukturierten Bericht in `logs/runtime-issues.jsonl`
- eine lesbare Historie in `logs/runtime-issues.md`

## Beispiel mit `copy_trading_file`

Fuer den ersten Test der dateibasierten Signalstrategie kann ein Lauf inklusive Log so gestartet werden:

```powershell
node .\scripts\run-and-log.js copy-trading-file-sim.log node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\copy-trading-file.conf.js --strategy copy_trading_file --days 1
```

SQL-Variante mit Log:

```powershell
node .\scripts\run-and-log.js copy-trading-file-sql-sim.log node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\copy-trading-file-sql.conf.js --strategy copy_trading_file --days 1
```

Reproduzierbarer Szenario-Lauf mit echten `buy`- und `sell`-Signalen:

```powershell
node .\zenbot.js backfill stub.BTC-USD --conf .\conf-examples\copy-trading-file-scenario-sql.conf.js --days 1
npm run sim:copy-trading-scenario-sql
```

Mit strukturiertem Fehlerbericht:

```powershell
npm run sim:copy-trading-scenario-sql:report
```
