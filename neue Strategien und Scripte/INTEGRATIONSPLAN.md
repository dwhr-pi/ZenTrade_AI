# Integrationsplan fuer `neue Strategien und Scripte`

## Ziel

Die Inhalte in diesem Verzeichnis werden vor der Uebernahme in drei Gruppen getrennt:

1. Direkt integrierbare Zenbot-Strategien
2. Zenbot-Erweiterungen oder Nebensysteme
3. Reine Referenz, Doku oder Ideensammlungen

Nach erfolgreicher Pilot-Einarbeitung wird die jeweils bearbeitete Strategie in den Ordner `_eingearbeitet_pilot` verschoben.

## Erste Einordnung

### Direkt integrierbare Strategie-Kandidaten

- `zenbot_volume_strategy/volume_universal`
  - Positiv: einfache Einzelstrategie, nativer Zenbot-Stil mit `getOptions`, `calculate`, `onPeriod`, `onReport`
  - Risiko: vermutlich noch Feinschliff bei Signal-Logik und Dateistruktur noetig
  - Prioritaet: hoch

- `zenbot_chatgpt_strategy/chatgpt_strategy`
  - Positiv: bereits als Zenbot-Strategie exportiert
  - Risiko: externer API-Aufruf, veraltetes Modell-Default, Laufzeit- und Kostenabhaengigkeit
  - Prioritaet: mittel

- `bitcoin_ai_strategy/src/bitcoin_ai_strategy.js`
  - Positiv: umfangreiche Strategie-Idee
  - Risiko: falsche relative Pfade fuer Zenbot-Einbau, offenbar eher Prototyp als direkt einsetzbare Strategie
  - Prioritaet: mittel

### Eher Erweiterungen als Strategien

- `zenbot-ai-risk-analysis`
  - enthaelt API, Web-Oberflaeche und separate Strategie-Komponente

- `zebot-api-v1.0.0`
  - eigenstaendige API-Struktur

- `zenbot-db-interfaces`
  - Datenbank- und Integrationscode

- `zenbot-multi-user-solutions`
  - Multi-User-Betrieb statt Einzelstrategie

- `zenbot-multitrading`
  - groesseres Subsystem, kein guter Pilot

- `zenbot_copy_trading`
  - Funktionsmodul statt klar isolierter Standardstrategie

### Vorwiegend Referenz, Doku oder Materialsammlung

- `FinTec`
- `MetaTrader`
- `template`
- `Termux`
- `zenbot_finance_charts_enhanced_(Manus)`
- `zenbot_macd_strategie(Manus)-Bester_Trading_Aglo`
- `zenbot_microsoft_access_database`
- `zenbot_strategies_documentation`
- `zenbot-config-editor`
- `Zenbot-Zusatz(Manus)`

## Empfohlene erste Massnahme

Als erster Pilot sollte `zenbot_volume_strategy/volume_universal` eingearbeitet werden.

### Warum genau diese zuerst

- Sie ist am naechsten am vorhandenen Zenbot-Strategieformat.
- Sie braucht keinen externen KI- oder API-Dienst.
- Sie ist klein genug, um Integration, Test und anschliessendes Verschieben sauber zu ueben.
- Sie ist fachlich klar umrissen und beruehrt keine grossen Nebensysteme.

## Pilot-Ablauf

1. Strategie technisch an das Format unter `extensions/strategies/<name>/strategy.js` anpassen.
2. Namenskonflikte und benoetigte Imports pruefen.
3. Basis-Test durch Laden der Strategie und Syntaxpruefung.
4. Strategie-Dokumentation kurz im Zielordner ergaenzen.
5. Ursprungsstrategie nach `_eingearbeitet_pilot` verschieben.

## Naechste sinnvolle Reihenfolge

1. `zenbot_volume_strategy/volume_universal`
2. `bitcoin_ai_strategy`
3. `zenbot_chatgpt_strategy`
4. Groessere Subsysteme erst danach einzeln zerlegen

## Pilot-Status

- `volume_universal`
  - in `extensions/strategies/volume_universal/strategy.js` eingearbeitet
  - Originalmaterial wird nach `_eingearbeitet_pilot` verschoben

- `bitcoin_ai_strategy`
  - in `extensions/strategies/bitcoin_ai_strategy/strategy.js` als bereinigte Zenbot-Variante eingearbeitet
  - Originalmaterial wird nach `_eingearbeitet_pilot` verschoben

- `chatgpt_strategy`
  - in `extensions/strategies/chatgpt_strategy/strategy.js` als robuste OpenAI-kompatible Variante eingearbeitet
  - Originalmaterial wird nach `_eingearbeitet_pilot` verschoben

## Bewertung naechster Kandidaten

### `zenbot_copy_trading`

- Status: als Zenbot-Strategie denkbar, aber in vorliegender Form nur Demo-Prototyp
- Positiv:
  - folgt grob dem Zenbot-Strategiemuster
  - klarer Einsatzzweck
  - laesst sich vermutlich auf dateibasierte Signale reduzieren und dadurch beherrschbar machen
- Probleme:
  - falscher Import `../../../lib/zero`
  - `onReport()` gibt keine zenbot-typischen Spalten zurueck
  - Signalquellen `api` und `webhook` sind nur Platzhalter
  - arbeitet mit Demo-Zufallssignalen statt echten Daten
  - Trade- und Positionsverwaltung ist vom Zenbot-Kern entkoppelt und dadurch fehleranfaellig
- Empfehlung:
  - nur als stark vereinfachte `file`-Variante integrieren
  - `api` und `webhook` erst spaeter oder separat

### `zenbot-ai-risk-analysis`

- Status: kein direkter Strategie-Kandidat, sondern Subsystem
- Positiv:
  - gutes Architekturkonzept fuer Risikoaufschaltung
  - klare Trennung zwischen API und Analyseidee
- Probleme:
  - exportiert keine normale Zenbot-Strategie
  - basiert auf separater Python-API, eigenem Laufzeitmodell und Zusatzinfrastruktur
  - nutzt Methoden wie `onTick()` statt des ueblichen Zenbot-Musters
  - erwartet Analysefelder und Steuerstrukturen, die Zenbot so nicht direkt konsumiert
- Empfehlung:
  - vorerst nicht in `extensions/strategies` integrieren
  - spaeter als separates Add-on oder Middleware betrachten

## Empfohlene Reihenfolge ab jetzt

1. `zenbot_copy_trading` als minimalen `file`-Signaladapter bereinigen
2. grosse Subsysteme wie `zenbot-ai-risk-analysis` nur dokumentieren und auslagern
3. danach `zebot-api-v1.0.0`, `zenbot-db-interfaces` und `zenbot-multitrading` einzeln zerlegen

## Pilot-Status

- `copy_trading`
  - in `extensions/strategies/copy_trading/strategy.js` als dateibasierter Minimaladapter eingearbeitet
  - Zusatzdoku in `extensions/strategies/copy_trading/README.md`
  - Originalmaterial wird nach `_eingearbeitet_pilot` verschoben

- `zenbot-ai-risk-analysis`
  - als separates Zusatzsystem bewertet, nicht integriert
  - Detailbewertung in `neue Strategien und Scripte/zenbot-ai-risk-analysis/INTEGRATIONSBEWERTUNG.md`

- `zebot-api-v1.0.0`
  - als Hilfsbibliothek bewertet, nicht integriert
  - Detailbewertung in `neue Strategien und Scripte/zebot-api-v1.0.0/INTEGRATIONSBEWERTUNG.md`

- `zenbot-db-interfaces`
  - als naechster groesserer Kernkandidat bewertet, noch nicht integriert
  - Detailbewertung in `neue Strategien und Scripte/zenbot-db-interfaces/INTEGRATIONSBEWERTUNG.md`
  - Schnittstellenvergleich in `neue Strategien und Scripte/zenbot-db-interfaces/SCHNITTSTELLENANALYSE.md`
  - bevorzugter erster Backend-Pfad: `csv`
  - erster CSV-Kernslice in `boot.js`, `conf-sample.js`, `lib/services/collection-service.js` und `lib/db/*` umgesetzt
  - CSV-Kompatibilitaetstest in `scripts/test-csv-compat.js` erfolgreich
  - CSV-Cursor danach fuer `count(true)`, `stream()` und `stream.close()` erweitert
  - `zenbot.js` auf schmaleren Kommando-Ladepfad umgestellt, um CLI-Tests trotz teildefekter Alt-Abhaengigkeiten zu ermoeglichen
  - `extensions/exchanges/sim/exchange.js` um einen Offline-Fallback fuer CSV-Simulationen erweitert
  - `extensions/exchanges/stub/*` als lokaler Offline-Exchange fuer Backfill- und Paper-Tests angelegt
  - `lib/output.js` macht optionale Output-Module fehlertolerant, damit `trade` nicht mehr an fehlendem `express` scheitert
  - `commands/trade.js` startet den Pre-Roll-Backfill jetzt direkt ueber `process.execPath` und `zenbot.js`
  - echter CLI-Test erfolgreich:
    - `sim stub.BTC-USD --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --filename none --days 1`
    - `backfill stub.BTC-USD --days 1`
    - `trade stub.BTC-USD --paper --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --poll_trades 1000 --run_for 0.05 --non_interactive --filename none`
  - Bedienungsdoku:
    - `docs/exchanges/stub-de.md`
  - Status damit:
    - `sim` mit CSV im echten CLI-Kontext erfolgreich validiert
    - `backfill` mit CSV erfolgreich validiert
    - `trade --paper` mit CSV und Stub erfolgreich validiert
