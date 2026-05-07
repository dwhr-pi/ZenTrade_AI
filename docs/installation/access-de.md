# Access-Export aus ZenTrade_AI

## Ziel

Diese Integration stellt aktuell keinen nativen `access`-Datenbankmodus im Kern bereit.

Stattdessen gibt es einen stabilen Zwischenschritt:

- Zenbot speichert lokal in `sql`
- daraus wird ein Access-kompatibles Exportpaket erzeugt

Das ist bewusst so, damit die laufende SQL- und Backtest-Basis nicht fuer eine direkte `.accdb`-Anbindung destabilisiert wird.

## Was exportiert wird

Das Exportpaket enthaelt:

- `access_schema.sql`
- Access-kompatible CSV-Dateien fuer die Zieltabelle
- `raw/`-CSV-Dateien mit den originalen Zenbot-Collections
- `manifest.json`
- `README.md`

Wenn im SQL-Bestand keine fertigen `periods`, `balances` oder `sessions` liegen, nutzt der Exporter jetzt zusaetzliche Fallbacks:

- Candles werden aus den Rohtrades als `1m_derived` zusammengefasst
- einfache Indikatoren wie `VWAP_DERIVED`, `TRADE_COUNT`, `VOLUME_DERIVED` und `LAST_PRICE` werden daraus erzeugt
- Portfolio- und Session-Snapshots werden aus `sim_results` und `resume_markers` abgeleitet
- die Tabelle `Trades` kann direkt aus der Zenbot-Collection `trades` gefuellt werden, wenn `my_trades` fehlt

Damit gilt:

- Access-Fans koennen die Daten in ihre Datenbank importieren
- Zenbot-spezifische Rohdaten bleiben trotzdem erhalten

## Aufruf

Beispiel mit einer lokalen SQLite-Datei:

```powershell
npm run export:access -- --db .\simulations\reports\sql_helper_smoke_clean_20260504_data\stub_BTC-USD\zenbot.sqlite --out .\exports\access_stub_package
```

## Typischer Ablauf

1. Backfill oder Simulation mit `db.type='sql'` laufen lassen.
2. Die erzeugte `zenbot.sqlite` auswaehlen.
3. Das Exportpaket erzeugen.
4. Die CSV-Dateien und `access_schema.sql` in Microsoft Access importieren.

Eine praktische Schritt-fuer-Schritt-Anleitung dafuer steht in [access-import-de.md](C:/Users/danie/.codex/worktrees/7dbf/ZenTrade_AI/docs/installation/access-import-de.md).
Vorbereitete Access-Abfragen fuer typische Auswertungen stehen in [access-queries-de.md](C:/Users/danie/.codex/worktrees/7dbf/ZenTrade_AI/docs/installation/access-queries-de.md).

## Wichtige Grenzen

- Noch kein direkter `.accdb`-Schreibmodus aus dem Zenbot-Kern
- Noch keine automatische Access-Installation oder ODBC-Konfiguration
- Nicht jede Zenbot-Collection passt 1:1 in das Access-Schema

Deshalb ist der Rohdaten-Export im Paket wichtig.

## Nächster sinnvoller Ausbauschritt

- Importprozess fuer Access dokumentieren
- Feldmapping fuer weitere Zenbot-Collections weiter verfeinern
- spaeter optional eine direkte ODBC-/Access-Schreibschicht evaluieren
