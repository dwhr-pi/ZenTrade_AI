# Backtest-Automatisierung unter Zenbot

## Ziel

Diese Anleitung beschreibt das eingearbeitete Backtest-Hilfsskript fuer dieses Repo.

Es basiert auf einer lokalen Zusatzquelle und wurde fuer den aktuellen Projektstand angepasst:

- auf automatische Strategie-Erkennung umgestellt
- fuer den CSV-Testpfad vorbereitet
- auf `node ./zenbot.js` statt blinden Shell-Wrapper vereinheitlicht
- auf Analyse und Simulation begrenzt

## Dateipfad

Das Skript liegt unter:

- `scripts/run_backtests.sh`

## Was das Skript tut

Es startet mehrere `sim`-Laeufe nacheinander und schreibt einen zusammengefassten Ergebnisbericht.

Dabei liest es standardmaessig alle Strategien automatisch ein, die aktuell **direkt** unter `extensions/strategies` liegen und dort eine `strategy.js` besitzen.

Zusatz im aktuellen Stand:

- automatische Erkennung verfuetbarer Handelspaare ueber das jeweilige Exchange-`products.json`
- manuelle Eingrenzung auf bestimmte Handelspaare oder volle Selector-Listen
- getrennte Ergebnisdateien fuer Detaildaten, Rohbericht und Ranking

Geeignet fuer:

- Strategievergleich
- CSV-Testbetrieb
- schnelle serielle Backtests
- WSL/Ubuntu

Nicht gedacht fuer:

- Live-Trading
- automatische Orderausfuehrung
- Finanzberatung

## Automatische Strategie-Erkennung

Wenn keine Strategien auf der Kommandozeile angegeben werden, entdeckt das Skript selbst alle gegenwaertig direkt nutzbaren Strategien.

Direkt nutzbar bedeutet hier:

- der Ordner liegt direkt unter `extensions/strategies`
- der Ordnername beginnt nicht mit `_`
- im Ordner liegt eine `strategy.js`

Dadurch gilt automatisch:

- neu hinzukommende direkt nutzbare Strategien werden beim Backtest mit beruecksichtigt
- in tiefere Unterordner verschobene oder geparkte Strategien werden nicht mit einbezogen
- zum Ausschliessen aus dem Backtest reicht es, eine Strategie aus der direkt nutzbaren Struktur herauszunehmen

## Warnung zu verschobenen Strategien

Das Ausschliessen ueber Verschieben ist technisch gewollt, aber nicht folgenlos.

Wichtig:

- andere Nutzer koennen dadurch Strategien ploetzlich nicht mehr finden
- laufende Prozesse, Skripte oder Automationen koennen fehlschlagen
- wenn davon Handelsablaeufe abhaengen, koennen daraus auch finanzielle Schaeden oder Verluste entstehen

Deshalb sollte das Verschieben von Strategien bewusst und kontrolliert erfolgen.

## Verfuegbare Strategien anzeigen

```bash
./scripts/run_backtests.sh --list
```

Damit kann jederzeit geprueft werden, welche Strategien der Backtest aktuell automatisch verwenden wuerde.

## Verfuegbare Handelspaare eines Exchange anzeigen

Standardmaessig wird aus dem gesetzten `EXCHANGE` gelesen.

Beispiel:

```bash
EXCHANGE=gdax ./scripts/run_backtests.sh --list-selectors
```

Damit siehst du, welche Selector-Kombinationen der Backtest aktuell fuer diesen Exchange automatisch aufloesen kann.

## Freie Auswahl bestimmter Strategien

Wenn nur bestimmte Strategien getestet werden sollen, koennen sie direkt angegeben werden:

```bash
./scripts/run_backtests.sh trend_ema macd volume_universal
```

Damit ist die freie Auswahl der zu beruecksichtigenden Strategien bereits moeglich.

## Handelspaare automatisch oder manuell waehlen

### Automatisch alle aktuell aufloesbaren Paare eines Exchange

```bash
EXCHANGE=stub ./scripts/run_backtests.sh
```

Oder begrenzt:

```bash
EXCHANGE=gdax MAX_PRODUCTS=5 ./scripts/run_backtests.sh
```

### Nur bestimmte Produkte eines Exchange

```bash
EXCHANGE=gdax PRODUCTS=BTC-USD,ETH-USD ./scripts/run_backtests.sh
```

### Frei gesetzte Selector-Liste

```bash
SELECTORS=gdax.BTC-USD,binance.ETH-BTC ./scripts/run_backtests.sh volume_universal
```

Damit gibt es bereits die von dir gewuenschte freie Auswahl, welche Handelspaare in den Backtest einfliessen sollen.

## Standardkonfiguration

Das Skript nutzt ohne weitere Angaben:

- `STRATEGY_ROOT=./extensions/strategies`
- `EXCHANGE=stub`
- `CONF_PATH=./conf-examples/csv.conf.js`
- automatische Selector-Erkennung ueber `products.json`
- `DAYS=30`
- `PERIOD_LENGTH=1m`
- `MIN_PERIODS=52`

Damit ist der erste Lauf lokal und ohne MongoDB moeglich.

## Einfacher Start

Unter WSL oder Linux:

```bash
chmod +x ./scripts/run_backtests.sh
./scripts/run_backtests.sh
```

## Nur die aktuell erkannten Strategien anzeigen

```bash
./scripts/run_backtests.sh --list
```

## Einzelne Strategien gezielt testen

```bash
./scripts/run_backtests.sh trend_ema macd volume_universal
```

## Mit echtem Selector und CSV-Live-Konfiguration

```bash
SELECTOR=gdax.BTC-USD CONF_PATH=./conf-examples/csv-live.conf.js ./scripts/run_backtests.sh
```

## Optionaler Auto-Backfill fuer Selector-Tests

Fuer `stub` versucht das Skript im Modus `AUTO_BACKFILL=auto` fehlende Daten selbst vorzubereiten.

Fuer echte Exchanges ist es meist besser, gezielt nur kleine Produktmengen mit Auto-Backfill zu fahren:

```bash
AUTO_BACKFILL=1 EXCHANGE=gdax PRODUCTS=BTC-USD CONF_PATH=./conf-examples/csv-live.conf.js ./scripts/run_backtests.sh
```

## Berichtsausgabe

Standardmaessig schreibt das Skript den Bericht nach:

- `./simulations/reports/backtest_report_YYYYMMDD_HHMMSS.txt`

Zusaetzlich entstehen:

- `./simulations/reports/backtest_YYYYMMDD_HHMMSS.json`
- `./simulations/reports/backtest_YYYYMMDD_HHMMSS.csv`
- `./simulations/reports/backtest_YYYYMMDD_HHMMSS_ranking.md`

Damit stehen die Backtest-Ergebnisse getrennt zur Verfuegung:

- als Rohbericht
- als strukturierte Datendatei
- als Ranking der besten und schlechtesten Ergebnisse

## Ranking und Auswertung

Das Ranking dokumentiert unter anderem:

- beste Ergebnisse nach Gewinn
- schwaechste Ergebnisse nach Gewinn
- beste und schwaechste Ergebnisse gegen Buy-and-Hold
- bestes Ergebnis je Handelspaar
- bestes Ergebnis je Strategie
- fehlgeschlagene Laeufe

Dadurch ist spaeter nachvollziehbar:

- welche Handelspaare mit welchen Einstellungen am besten abschnitten
- welche am schlechtesten abschnitten
- welche Strategien oder Paare aktuell fehlschlagen

## Wichtige Hinweise

- Fehlende oder nicht direkt nutzbare Strategien werden sauber uebersprungen.
- Das Skript ist fuer serielle Backtests gedacht, nicht fuer parallele Lastlaeufe.
- Es passt zum Projektprofil in `Trading_Analysis.md`.

## Erinnerung fuer den weiteren Ausbau

Der aktuelle Stand unterstuetzt bereits:

- automatische Beruecksichtigung neuer direkt nutzbarer Strategien
- freie Auswahl einzelner Strategien ueber die Kommandozeile
- automatische Erkennung aktuell verfuegbarer Handelspaare
- freie Auswahl bestimmter Handelspaare oder Selector-Listen
- Ausblendung geparkter Strategien durch Verschieben aus der direkt nutzbaren Struktur

Spaeter sinnvoll ausbaubar sind noch:

- interaktive Auswahlmenues fuer Strategiegruppen
- interaktive Auswahlmenues fuer Handelspaare
- Parameterprofile pro Strategie
- gespeicherte Ausschlusslisten ohne Verschieben
- komfortablere Berichtsauswertung und Ranglisten

## Uebernommene Quelle

Die lokale Quelle unter `Zenbot-Zusatz/Backtest-Automatisierungsskript` wurde **nicht blind kopiert**, sondern in eine projektpassende Fassung ueberfuehrt.

Der wichtigste Grund:

- die dort referenzierten `mq4_*`-Strategien sind im aktuellen Repo nicht vorhanden

Deshalb wurde die Idee uebernommen, aber technisch an das reale Repo angepasst.
