# Referenz-Backtest 2026-05-03

## Rahmen

- Modus: CSV
- Selector: `stub.BTC-USD`
- Zeitraum: `--days 1`
- Periodenlaenge: `1m`
- Min Periods: `52`
- Startkapital: `1000 USD`
- Asset-Kapital: `0`
- Konfiguration: `conf-examples/csv.conf.js`

## Zweck

Dieser Lauf dient als kleine reproduzierbare Referenz fuer den aktuellen CSV-/Stub-Pfad ohne MongoDB.

SQL ist im aktuellen Repo-Stand weiterhin nur vorbereitet und noch nicht in den Kernbetrieb eingebunden. Der Referenzlauf wurde deshalb absichtlich auf dem heute stabil nutzbaren CSV-Pfad gefahren.

## Verwendete Befehle

```powershell
node .\zenbot.js backfill stub.BTC-USD --conf .\conf-examples\csv.conf.js --days 1
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\csv.conf.js --strategy volume_universal --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --filename none --days 1
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\csv.conf.js --strategy trend_ema --period_length 1m --min_periods 52 --currency_capital 1000 --asset_capital 0 --filename none --days 1
```

## Ergebnisse

| Strategie | Endsaldo | Gewinn % | Buy-and-Hold Endsaldo | Buy-and-Hold % | vs Buy-and-Hold % | Trades | Tage |
|---|---:|---:|---:|---:|---:|---:|---:|
| `volume_universal` | 1000.00 | 0.00 | 1001.47 | 0.15 | -0.15 | 0 | 2 |
| `trend_ema` | 1000.00 | 0.00 | 1001.04 | 0.10 | -0.10 | 0 | 2 |

## Einordnung

- Beide Strategien blieben in diesem kurzen Stub-Fenster ohne Trades.
- `trend_ema` schnitt gegen Buy-and-Hold leicht besser ab als `volume_universal`.
- Der Lauf eignet sich als technische Referenz fuer den CSV-Pfad, aber noch nicht als aussagekraeftiger Strategievergleich.

## Technischer Hinweis

Beim ersten Simulationsversuch ist ein Formatierungsproblem im Konsolenpfad sichtbar geworden, wenn Werte im Anzeigeformat fehlten. Der Lauf wurde nach einer kleinen Haertung in `lib/format.js` erfolgreich wiederholt.

## Artefakte

- `simulations/reports/reference_backtest_20260503/volume_universal.log`
- `simulations/reports/reference_backtest_20260503/trend_ema.log`
- `data/csv/sim_results.json`
