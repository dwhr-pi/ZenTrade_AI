# Integrationsbewertung `zenbot-db-interfaces`

## Kurzfazit

`zenbot-db-interfaces` ist nach `copy_trading` der **naechste technisch interessante Kandidat**, aber zugleich ein deutlich groesserer Eingriff als alle bisher uebernommenen Strategien.

Es ist kein Strategiepaket, sondern ein Kernumbau fuer:

- alternative Datenbank-Backends
- geaenderte Bootstrapping-Logik
- neue Collection-Services

## Warum dieses Paket relevant ist

Das Repo zeigt bereits, dass MongoDB in diesem Projekt immer wieder Reibung erzeugt. Genau hier setzt dieses Paket an:

- SQL statt MongoDB
- CSV statt MongoDB
- austauschbare Collection-Services

Damit adressiert es ein reales Betriebsproblem und nicht nur eine Komfortfunktion.

## Warum der Eingriff riskant ist

### 1. Boot-Pfad wird veraendert

Das Paket will `boot.js` anpassen. Das ist ein zentraler Startpunkt des gesamten Bots.

### 2. Mehrere Services greifen auf die DB-Schicht zu

Im aktuellen Repo existieren bereits Services rund um `collection-service`. Deshalb muss geprueft werden, ob die neuen SQL- und CSV-Services wirklich dieselbe Schnittstelle bedienen.

### 3. Kein kleiner Teilumbau

Anders als bei einer Strategie ist hier kein isolierter Zielordner ausreichend. Ein realistischer Umbau betrifft mindestens:

- `boot.js`
- Konfiguration
- neue Dateien unter `lib/db`
- eventuell Stellen, die implizit MongoDB-Verhalten erwarten

## Was fuer eine Integration spricht

- vorhandenes `boot-modified.js` zeigt den beabsichtigten Einstiegspunkt
- vorhandene `sql-collection-service.js` und `csv-collection-service.js` deuten auf eine Service-Schicht statt auf Wildwuchs hin
- koennte das MongoDB-Problem im Repo strukturell entspannen

## Empfehlung

Dieses Paket ist der **naechste groessere Arbeitsblock**, aber nicht als Schnellintegration.

Sinnvolle Reihenfolge:

1. bestehende `collection-service`-Nutzung im Repo kartieren
2. Schnittstelle von Mongo-Service gegen SQL/CSV-Service vergleichen
3. erst dann `boot.js` vorsichtig anpassbar machen
4. zunaechst nur einen alternativen Backend-Typ aktivieren, vorzugsweise `csv` oder `sqlite`

## Entscheidung fuer den aktuellen Stand

Aktueller Status:

- bewertet
- dokumentiert
- noch nicht eingebaut

Dieses Paket ist der beste Kandidat fuer den naechsten Architektur-Schritt, aber nicht fuer einen blinden Copy-Paste-Einbau.

## Bisherige Detailanalyse

Siehe auch:

- `SCHNITTSTELLENANALYSE.md`

Zwischenstand:

- CSV ist der bessere erste Migrationspfad
- SQL ist derzeit weiter von der tatsaechlichen Mongo-Cursor-Nutzung entfernt
