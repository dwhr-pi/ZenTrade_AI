# Trading Analysis Profile

## Zweck

Dieses Repo soll fuer Trading-bezogene Arbeit nur in einem **Analyse- und Testmodus** verwendet werden.

Der Schwerpunkt liegt auf:

- Datenanalyse
- Indikatoren
- Backtesting
- Simulation
- `trade --paper`
- Monitoring
- manuell bewertbaren Signalen

## Nicht Bestandteil dieses Profils

Dieses Profil schliesst bewusst aus:

- automatische Live-Orders durch KI oder LLMs
- autonome Kauf- oder Verkaufsentscheidungen
- eingebaute Finanzberatung
- Anlageempfehlungen mit Beratungscharakter
- verdeckte Orderausfuehrung ueber AI-Workflows

## Warum diese Grenze gilt

Die Kombination aus KI, Bot-Logik und Finanzmaerkten schafft ein technisches, rechtliches und sicherheitstechnisches Minenfeld.

Die wichtigsten Gruende:

- regulatorische Risiken
- moegliche Haftung bei Verlusten
- unzuverlaessige LLM-Ausgaben
- API-Key- und Wallet-Risiken
- psychologische Scheinsicherheit
- schwer wartbare Mischarchitektur aus Infrastruktur, KI und Finanzausfuehrung

## Projektregel

In dieses Repo sollen **keine automatischen Trading- oder Finanzberatungsfunktionen** eingebaut werden.

Zulaessig und sinnvoll sind:

- historische Auswertung
- Strategieentwicklung
- Backtests
- Paper Trading
- visuelle oder statistische Analyse
- manuelle Entscheidungsunterstuetzung ohne Ausfuehrungsautomatik

Nicht zulaessig innerhalb dieses Profils sind:

- AI-gesteuerte Live-Orderausfuehrung
- automatische Konto- oder Wallet-Aktionen
- Systeme, die Nutzer zu konkreten Kauf- oder Verkaufsentscheidungen drangen

## Nutzung auf eigene Gefahr

Die Verwendung dieses Repos birgt Risiken und kann zum vollstaendigen Verlust von Vermoegenswerten fuehren.

Es gilt:

- Verwendung auf eigene Gefahr
- keine Haftung fuer finanzielle Verluste
- keine Haftung fuer technische, direkte oder indirekte Schaeden

## Empfohlene Architektur

Sinnvoll ist eine klare Trennung:

- `Trading_Analysis`: Analyse, Backtesting, Simulation, Risikoauswertung
- `Manual Execution`: getrennt, manuell, bewusst, mit eigener Verantwortung

So bleibt das Projekt:

- nachvollziehbarer
- wartbarer
- sicherer
- rechtlich und organisatorisch sauberer eingegrenzt
