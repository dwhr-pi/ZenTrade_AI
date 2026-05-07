# Vorbereitete Access-Abfragen

## Ziel

Diese Sammlung liefert direkt nutzbare Access-Abfragen fuer typische ZenTrade_AI-Auswertungen nach dem Import eines Exportpakets.

Die SQL-Vorlagen liegen in [access-query-pack.sql](C:/Users/danie/.codex/worktrees/7dbf/ZenTrade_AI/docs/installation/access-query-pack.sql).

## Enthaltene Abfragen

- `q_TradesWithContext`
  Zeigt Trades zusammen mit Asset und Strategie.
- `q_StrategySessionPerformance`
  Zeigt Sitzungen und ihre Performance pro Strategie.
- `q_PortfolioLatest`
  Zeigt den aktuellen Portfolio-Snapshot mit Symbolen.
- `q_RecentCandles`
  Zeigt die neuesten Candles aus `Candlestick_Data`.
- `q_DerivedIndicatorSnapshot`
  Zeigt wichtige native oder abgeleitete Indikatorwerte.
- `q_TradeVolumeByDay`
  Verdichtet Trades auf Tagesebene.

## So legst du die Abfragen in Access an

1. Access-Datenbank oeffnen.
2. `Erstellen` waehlen.
3. `Abfrageentwurf` oeffnen.
4. Das Fenster `Tabelle anzeigen` schliessen.
5. In die `SQL-Ansicht` wechseln.
6. Eine einzelne SELECT-Abfrage aus `access-query-pack.sql` einfuegen.
7. Speichern und den vorgeschlagenen Namen wie `q_TradesWithContext` uebernehmen.
8. Fuer die weiteren Abfragen wiederholen.

## Hinweise zu den Abfragen

- `q_RecentCandles` nutzt `TOP 500`, damit Access bei groesseren Datenmengen nicht sofort zu schwer wird.
- `q_DerivedIndicatorSnapshot` ist absichtlich sowohl fuer native Periodendaten als auch fuer unsere abgeleiteten Trade-Exporte geeignet.
- `q_TradeVolumeByDay` nutzt `Nz(...)`, damit leere Werte Access-seitig nicht sofort stoeren.

## Wann diese Abfragen besonders nuetzlich sind

- nach einem SQL-Backtestexport zur schnellen Sichtpruefung
- bei Access-Analysen ohne direkte SQL-Kenntnis
- zum Vergleich verschiedener Strategielaeufe
- um zu erkennen, ob native oder abgeleitete Exportdaten im Paket gelandet sind

## Verbindung zum Exportpaket

Der Exporter kann den Query-Pack zusaetzlich mit in das Paket legen. Wenn im Exportordner eine Datei `access_query_pack.sql` vorhanden ist, ist das dieselbe Sammlung in paketierter Form.
