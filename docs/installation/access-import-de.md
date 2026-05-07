# Access-Import aus dem Exportpaket

## Ziel

Diese Anleitung beschreibt den praktischen Import eines mit `npm run export:access` erzeugten Access-Pakets in eine lokale Microsoft-Access-Datenbank.

Sie passt zum aktuellen Stand von ZenTrade_AI:

- Zenbot arbeitet lokal mit `sql` oder `csv`
- fuer Microsoft Access wird ein Exportpaket erzeugt
- ein nativer `access`-Kernmodus existiert aktuell noch nicht

## Voraussetzungen

- Microsoft Access unter Windows
- ein erzeugtes Exportpaket aus ZenTrade_AI
- die Dateien `access_schema.sql`, `manifest.json` und die CSV-Dateien aus dem Exportordner

## Empfohlener Ablauf

1. Neue Access-Datenbank anlegen.
   Beispiel: `ZenTrade_AI.accdb`
2. Eine Sicherheitskopie des Exportpakets behalten.
3. Zuerst das Schema anlegen.
4. Danach die Stammdaten importieren.
5. Anschliessend die Bewegungsdaten importieren.
6. Zum Schluss stichprobenartig Tabellen und Beziehungen pruefen.

## Reihenfolge fuer den Import

Diese Reihenfolge vermeidet die meisten Fremdschluessel- und Nachschlageprobleme:

1. `Assets.csv`
2. `Strategies.csv`
3. `Bot_Configuration.csv`
4. `Portfolio.csv`
5. `Trading_Sessions.csv`
6. `Trades.csv`
7. `Candlestick_Data.csv`
8. `Market_Indicators.csv`
9. `Error_Logs.csv`

## Schema in Access anlegen

1. Microsoft Access oeffnen.
2. Eine neue leere Datenbank erstellen.
3. Auf `Erstellen` wechseln.
4. `Abfrageentwurf` oeffnen.
5. Das Dialogfenster `Tabelle anzeigen` schliessen.
6. In die `SQL-Ansicht` wechseln.
7. Den Inhalt aus `access_schema.sql` einfuegen.
8. Die SQL-Anweisung ausfuehren.

Hinweis:
Manche Access-Versionen verarbeiten laengere SQL-Skripte ungern in einem Rutsch. Falls noetig, das Schema blockweise ausfuehren.

## CSV-Dateien importieren

Fuer jede CSV-Datei:

1. In Access `Externe Daten` oeffnen.
2. `Textdatei` oder `Neue Datenquelle > Aus Datei > Textdatei` waehlen.
3. Die jeweilige CSV-Datei aus dem Exportpaket auswaehlen.
4. `An vorhandene Tabelle anhaengen` verwenden, wenn das Schema schon erzeugt wurde.
5. Als Ziel die passende Tabelle waehlen.
6. `Getrennt` als Format lassen.
7. `Komma` als Trennzeichen bestaetigen.
8. `Erste Zeile enthaelt Feldnamen` aktiv lassen.
9. Import abschliessen.

## Welche Tabellen was enthalten

- `Assets`: Selector- und Marktgrunddaten
- `Strategies`: erkannte Strategien aus `sim_results`
- `Trades`: echte Trade-Zeilen aus `my_trades` oder notfalls aus `trades`
- `Candlestick_Data`: native `periods` oder aus Rohtrades abgeleitete `1m_derived`-Candles
- `Market_Indicators`: native Periodenindikatoren oder abgeleitete Kennzahlen
- `Portfolio`: Balance-Snapshots oder abgeleitete Werte aus `sim_results`
- `Trading_Sessions`: echte Sessions oder aus `sim_results` abgeleitete Sitzungen
- `Bot_Configuration`: Exportquelle und wichtige Metadaten
- `Error_Logs`: aktuell meist leer, als Platzhalter fuer spaetere Erweiterung

## Bedeutung der Fallback-Daten

Wenn im Exportpaket in `README.md` oder `manifest.json` ein abgeleiteter Exportmodus steht, bedeutet das:

- `Candlestick_Data` stammt aus Rohtrades und nicht direkt aus `periods`
- `Market_Indicators` sind einfache Hilfswerte wie `VWAP_DERIVED`, `TRADE_COUNT`, `VOLUME_DERIVED` oder `LAST_PRICE`
- `Portfolio` und `Trading_Sessions` koennen aus `sim_results` erzeugt worden sein

Das ist fuer Analyse, Reporting und Access-Abfragen gut nutzbar, aber nicht identisch mit einem vollstaendigen nativen Periodenbestand.

## Schnellpruefung nach dem Import

Nach dem Import sollten mindestens diese Punkte stimmen:

1. `Assets` und `Strategies` enthalten Stammdaten.
2. `Trades` und `Candlestick_Data` sind nicht leer.
3. `manifest.json` passt grob zu den importierten Zeilenzahlen.
4. `Trading_Sessions` enthaelt pro Sim-Lauf nachvollziehbare Sitzungen.
5. `Bot_Configuration` zeigt `EXPORT_SOURCE_DB` und `ACCESS_EXPORT_MODE`.

## Typische Probleme

### Datumsfelder leer

Dann hat Access die Spalte eventuell nicht als Datum erkannt. In diesem Fall:

- Importassistent erneut durchlaufen
- Zielspalte kontrollieren
- bei Bedarf zuerst in eine Zwischentabelle importieren

### Fremdschluessel wirken leer

Dann wurden Tabellen wahrscheinlich in der falschen Reihenfolge importiert oder der Import lief in neue statt bestehende Tabellen. In diesem Fall:

- `Assets` und `Strategies` zuerst neu importieren
- danach `Trades`, `Portfolio`, `Trading_Sessions`, `Candlestick_Data`, `Market_Indicators`

### Sehr viele Indikatorzeilen

Das ist bei abgeleiteten Rohtrade-Exporten normal, weil pro Zeitbucket mehrere Kennzahlen erzeugt werden.

## Rohdaten nutzen

Der Ordner `raw/` ist bewusst Teil des Pakets. Er hilft, wenn:

- eine Access-Tabelle spaeter anders befuellt werden soll
- eine Spezialauswertung direkt auf Zenbot-Rohdaten erfolgen soll
- man Importprobleme gegen den Originalzustand pruefen will

## Weiterer Ausbau

Der naechste sinnvolle Schritt nach diesem Importworkflow ist:

- Access-Tabellen optional ueber gespeicherte Access-Abfragen oder Makros vorzubereiten
- spaeter eine direkte ODBC-/ACE-Integration zu evaluieren

Fuer die ersten typischen Auswertungen gibt es bereits vorbereitete Vorlagen in [access-queries-de.md](C:/Users/danie/.codex/worktrees/7dbf/ZenTrade_AI/docs/installation/access-queries-de.md).
