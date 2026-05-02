# copy_trading

Bereinigte Minimalvariante der Copy-Trading-Idee fuer Zenbot.

## Enthalten

- dateibasierte Signalverarbeitung aus einer JSON-Datei
- Filter nach `symbol`, `quality` und `signal_timeout`
- optionales Handelszeitfenster
- einfache lokale Positionsspur fuer `buy`/`sell`-Abfolge

## Bewusst nicht enthalten

- API-Polling
- Webhook-Server
- eigene Trade-Buchhaltung ausserhalb des Zenbot-Kerns
- Demo-Zufallssignale

## Signalformat

```json
[
  {
    "id": "signal_1",
    "action": "buy",
    "symbol": "BTC-USD",
    "timestamp": 1710000000,
    "source": "example",
    "quality": 85
  }
]
```

## Nutzung

Beispiel:

```bash
./zenbot.sh trade --strategy=copy_trading --signal_file=signals.json
```

Wichtiger Hinweis:
Diese Strategie behandelt die Signaldatei als Adapter. Sie versucht nicht, API- oder Webhook-Infrastruktur im Strategiemodul selbst nachzubilden.
