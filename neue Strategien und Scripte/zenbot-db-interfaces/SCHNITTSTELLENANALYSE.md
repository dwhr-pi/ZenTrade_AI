# Schnittstellenanalyse `zenbot-db-interfaces`

## Ziel

Vergleich zwischen:

- aktuellem Mongo-`collection-service`
- alternativem SQL-`collection-service`
- alternativem CSV-`collection-service`

mit Blick auf die tatsaechliche Nutzung im bestehenden Zenbot.

## Aktueller Mongo-Service

Datei:

- `lib/services/collection-service.js`

Aktuelles Muster:

- `getTrades()`
- `getResumeMarkers()`
- `getBalances()`
- `getSessions()`
- `getPeriods()`
- `getMyTrades()`
- `getSimResults()`

Rueckgabe:

- direkt ein Mongo-Collection-Objekt
- Methoden wie `find().limit().sort().toArray(callback)`
- Methoden wie `replaceOne(...).then(...)`

## Tatsaechliche Hauptnutzung im Repo

Besonders relevant:

- `commands/backfill.js`
- `commands/sim.js`
- `commands/trade.js`

### Beobachtete Aufrufmuster

#### Callback-basierte Mongo-Cursor

Beispiele:

- `resume_markers.find({...}).toArray(function (err, results) { ... })`
- `trades.find(query).limit(limit).sort(sort).toArray(function (err, trades) { ... })`
- `sessions.find(...).limit(1).sort(...).toArray(function (err, prev_sessions) { ... })`

#### Promise-basierte Write-Methoden

Beispiele:

- `resume_markers.replaceOne(...).then(...)`

## Bewertung CSV-Service

Datei:

- `neue Strategien und Scripte/zenbot-db-interfaces/lib/db/csv-collection-service.js`

### Positiv

- gleiche High-Level-Methoden wie `getTrades()`, `getSessions()`, usw.
- `find()` liefert direkt ein cursor-aehnliches Objekt
- `limit()`, `sort()`, `toArray()` sind vorhanden
- Write-Methoden geben Promises zurueck

### Bruchstellen

- `toArray()` liefert aktuell ein Promise ohne Node-Callback-Signatur
- bestehender Zenbot-Code ruft mehrfach `toArray(function (err, results) { ... })` auf
- `sort()`-Logik muss auch Sonderfaelle wie `{$natural:-1}` sauber abdecken

### Gesamturteil CSV

CSV ist **der bessere erste Kandidat**, weil die Form grundsaetzlich naeher an der bestehenden Collection-Nutzung liegt.

Noetige Anpassungen vor echtem Einbau:

1. `toArray(cb)` muss Callback **und** Promise koennen
2. `sort()` muss die im Repo genutzten Sortmuster exakt nachbilden
3. `find(...).limit(...).sort(...).toArray(cb)` muss stabil kompatibel werden

## Bewertung SQL-Service

Datei:

- `neue Strategien und Scripte/zenbot-db-interfaces/lib/db/sql-collection-service.js`

### Positiv

- gleiche High-Level-Methoden vorhanden
- Write-Methoden sehen grundsaetzlich brauchbar aus
- SQL waere langfristig sauberer als CSV

### Kritische Bruchstellen

- `find()` gibt **ein Promise** zurueck
- bestehender Zenbot-Code erwartet aber **sofort** ein cursor-aehnliches Objekt
- Beispiel:
  - Zenbot erwartet `trades.find(query).limit(...).sort(...).toArray(cb)`
  - SQL liefert erst spaeter via Promise ein Objekt mit `sort()` und `toArray()`

### Gesamturteil SQL

SQL ist aktuell **nicht** der beste erste Integrationspfad.

Bevor SQL als erstes Backend eingebaut wird, muesste die Cursor-Kompatibilitaet wesentlich staerker nachgebaut werden.

## Empfehlung fuer den naechsten Umbau

### Phase 1

Erster Integrationsversuch nur mit **CSV**

Warum:

- weniger externe Abhaengigkeiten
- naeher an der aktuellen Collection-Service-Form
- leichter lokal testbar

### Phase 2

`boot.js` so vorbereiten, dass `db.type = 'csv'` sauber aktivierbar ist

### Phase 3

erst danach SQL nachziehen

## Konkrete technische Aufgaben vor Einbau

1. CSV-`toArray()` auf Callback-Kompatibilitaet umbauen
2. CSV-`sort()` gegen reale Zenbot-Sortmuster pruefen
3. `boot.js` minimal-invasiv fuer `db.type = 'csv'` vorbereiten
4. Testpfad definieren:
   - `backfill`
   - `sim`
   - `trade --paper`

## Umgesetzter erster Integrationsslice

Bereits im Repo umgesetzt:

- `lib/db/csv-adapter.js`
- `lib/db/csv-connection-manager.js`
- `lib/db/csv-collection-service.js`
- Umschaltung in `boot.js`
- Dispatch in `lib/services/collection-service.js`
- Grundkonfiguration in `conf-sample.js`

Bereits erfolgreich als Smoke-Test geprueft:

- `replaceOne(..., { upsert: true })`
- `find(...).sort(...).limit(...).toArray(callback)`

Bereits erfolgreich als Repo-Test geprueft:

- `scripts/test-csv-compat.js`
- prueft reale Mongo-Nutzungsmuster aus `backfill`, `sim` und `trade`
- inklusive:
  - `findOne(cb)`
  - `count()`
  - `$natural: -1`
  - `replaceOne(..., { upsert: true })`

Zusatzlich inzwischen im CSV-Cursor umgesetzt:

- `count(true)` auf Cursor-Ebene
- `stream()` fuer den Simulationspfad
- `stream.close()` als Mongo-aehnliche Kompatibilitaetsmethode

## Noch offen

- reale End-to-End-Tests mit `backfill`
- reale End-to-End-Tests mit `trade --paper`
- Feinschliff fuer seltenere Mongo-Verhaltensweisen

## Zwischenstand CLI-Volltest

Die Laufzeitumgebung wurde teilweise repariert:

- mehrere kaputte Kernmodule wurden gezielt aus einer sauberen Temp-Installation nachgezogen
- `zenbot.js` wurde auf einen schmaleren Kommando-Ladepfad umgestellt, damit nicht mehr immer alle Befehle gleichzeitig geladen werden muessen
- die `sim`-Boerse besitzt jetzt einen Offline-Fallback fuer CSV-Tests ohne vollstaendig installierte Exchange-Adapter

Erfolgreich validiert:

- echter CLI-Lauf mit
  - `node zenbot.js sim stub.BTC-USD --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --filename none --days 1`
- echter CLI-Lauf mit
  - `node zenbot.js backfill stub.BTC-USD --days 1`
- echter CLI-Lauf mit
  - `node zenbot.js trade stub.BTC-USD --paper --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --poll_trades 1000 --run_for 0.05 --non_interactive --filename none`
- Datenquelle:
  - vorbereiteter CSV-Testdatensatz unter `ZENBOT_DB_TYPE=csv`
  - sowie lokaler Offline-Exchange `stub`
- Ergebnis:
  - Simulation laeuft bis zum regulären Abschluss durch
  - Backfill laeuft mit CSV bis zum regulaeren Abschluss durch
  - Paper-Trading laeuft mit CSV und Stub bis zum regulaeren Abschluss durch
  - Sim-Ergebnis wird gespeichert
  - Sessions-, Marker- und Trade-Schreibpfade funktionieren im echten CLI-Kontext
  - CSV-Lese- und Schreibpfad ist im echten CLI-Kontext funktionsfaehig

Weiterhin offen:

- Validierung gegen echte historische Boersenadapter
- Validierung gegen echtes Live-/Paper-Verhalten mit vollstaendiger Output- und Dependency-Umgebung

## Aktueller Volltest-Blocker

Die echte Zenbot-CLI-Vollvalidierung ist im aktuellen Workspace noch teilweise durch fehlende oder beschaedigte Node-Abhaengigkeiten blockiert.

Beobachtet:

- der fruehere Startblocker `semver` wurde behoben
- weitere Fremdmodule fehlen je nach Befehl weiterhin, zum Beispiel strategie- oder exchange-spezifische Pakete wie `bollinger-bands`
- optionale Output-Module wie `output.api` koennen weiterhin an fehlenden Paketen wie `express` scheitern, werden jetzt aber nur noch als Warnung behandelt

Das ist nicht mehr der CSV-Kern selbst, sondern vor allem ein Restproblem der historischen Node-Umgebung und einzelner Zusatzmodule.
