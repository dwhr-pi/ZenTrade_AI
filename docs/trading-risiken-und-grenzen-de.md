# Trading-Risiken und Projektgrenzen

## Ziel

Diese Notiz beschreibt die bewusst gesetzten Grenzen fuer Trading-nahe Nutzung in diesem Repo.

Sie soll klarstellen, was dieses Projekt leisten darf und was nicht.

## Grundsatz

Dieses Repo ist fuer:

- Analyse
- Strategieentwicklung
- historische Tests
- Simulation
- `trade --paper`
- Beobachtung und Monitoring

gedacht.

Dieses Repo ist **nicht** dafuer gedacht, automatische Trading- oder Finanzberatungsfunktionen als festen Projektbestandteil bereitzustellen.

## Warum diese Grenze sinnvoll ist

## 1. Regulierung

Sobald ein System automatisiert Trading-Entscheidungen trifft oder konkrete Kauf-/Verkaufsempfehlungen erzeugt, kann es sich in Richtung regulierter Finanzdienstleistung bewegen.

Das gilt besonders dann, wenn:

- Signale als Empfehlung verstanden werden koennen
- Nutzer sich auf diese Ausgaben verlassen
- eine faktische Beratungswirkung entsteht

## 2. Haftung

Automatische Entscheidungen oder scheinbar beratende Signale koennen bei Verlusten zu erheblichen Haftungsfragen fuehren.

## 3. Technische Unzuverlaessigkeit von LLMs

LLMs arbeiten probabilistisch und koennen:

- halluzinieren
- falsche Zusammenhaenge behaupten
- Begruendungen erfinden
- unstet auf denselben Input reagieren

Fuer echte Live-Trading-Ausfuehrung ist das ein unnoetiges Risiko.

## 4. Sicherheitsrisiken

Automatisierung im Finanzkontext vergroessert die Angriffsoberflaeche:

- API-Key-Leaks
- Wallet-Zugriffe
- Prompt Injection
- kompromittierte Tools oder Container

## 5. Psychologischer Fehlanreiz

Systeme mit KI-Anmutung verleiten leicht dazu, ihnen zu viel Vertrauen zu schenken.

Das kann fuehren zu:

- Overtrading
- zu schwacher Kontrolle
- falscher Risikoeinschaetzung

## Erlaubter und sinnvoller Nutzungsrahmen

Geeignet sind:

- Datenanalyse
- Chart- und Indikatorauswertung
- Backtesting
- Paper Trading
- Marktbeobachtung
- Alarmierung
- manuelle Auswertung von Strategien

## Bewusst ausgeschlossen

Bewusst nicht Teil des Projektprofils sind:

- AI-autonome Live-Orders
- LLM-basierte Kauf- oder Verkaufsempfehlungen mit Beratungscharakter
- vollautomatische Finanzentscheidungen

## Haftungshinweis

Die Nutzung dieses Repos erfolgt auf eigene Gefahr.

Es besteht keine Haftung fuer:

- finanzielle Verluste
- entgangene Gewinne
- direkte oder indirekte Schaeden
- Folgeschaeden durch Fehlkonfiguration, Fehlinterpretation oder Ausfaelle

## Passende Referenz im Repo

Die zusammengefasste Projektlinie steht auch in:

- `Trading_Analysis.md`
