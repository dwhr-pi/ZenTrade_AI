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
  "side": "buy",
  "confidence": 0.84,
  "source": "manual-review",
  "symbol": "BTC-USD",
  "timestamp": "2026-05-14T10:15:00Z",
  "expires_at": "2026-05-15T10:15:00Z",
  "reasoning": "Breakout bestaetigt durch externen Beobachtungspfad",
  "tags": ["breakout", "reviewed"]
}
```

Erweiterte Felder:

- `symbol`: optionaler Marktbezug fuer Dokumentation und Reporting
- `side`: explizite Handelsrichtung, wenn sie getrennt von `signal` gepflegt werden soll
- `expires_at`: Ablaufzeit fuer zeitkritische Signale
- `tags`: freie Marker fuer Herkunft, Reviewstatus oder Signaltyp

Wichtige Hinweise:

- gedacht fuer Analyse, Backtests, Simulation und Paper-Trading
- nicht als Freigabe fuer autonome Live-Ausfuehrung verstehen
- veraltete oder schwache Signale werden ignoriert

Schneller lokaler Test:

```powershell
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\copy-trading-file.conf.js --strategy copy_trading_file --days 1
```

SQL-Variante:

```powershell
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\copy-trading-file-sql.conf.js --strategy copy_trading_file --days 1
```

Signaldatei validieren:

```powershell
node .\scripts\validate-copy-trading-signal.js
```
