# copy_trading_file

Vereinfachte dateibasierte Signalstrategie fuer ZenTrade_AI.

Zweck:

- externe oder manuell erzeugte Signale aus einer JSON-Datei einlesen
- fuer Analyse, Simulation und `trade --paper` nutzbar machen
- kein eigenes API-, Webhook- oder Live-Copy-Trading-Subsystem voraussetzen

Beispiel fuer die Signaldatei:

```json
{
  "signal": "buy",
  "confidence": 0.84,
  "source": "manual-review",
  "timestamp": "2026-05-14T10:15:00Z",
  "reasoning": "Breakout bestaetigt durch externen Beobachtungspfad"
}
```

Wichtige Hinweise:

- gedacht fuer Analyse, Backtests, Simulation und Paper-Trading
- nicht als Freigabe fuer autonome Live-Ausfuehrung verstehen
- veraltete oder schwache Signale werden ignoriert
