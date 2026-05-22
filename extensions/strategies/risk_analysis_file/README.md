# risk_analysis_file

Vereinfachte dateibasierte Risiko-Strategie fuer ZenTrade_AI.

Zweck:

- externe Risikoanalysen aus einer JSON-Datei einlesen
- Kaufempfehlungen nur unterhalb einer zulaessigen Risikoschwelle freigeben
- bei hoher Risikolage defensiv ein `sell` ausloesen koennen
- fuer Analyse, Simulation und `trade --paper` nutzbar bleiben

Beispiel:

```json
{
  "recommendation": "buy",
  "risk_score": 0.22,
  "confidence": 0.81,
  "source": "risk-analysis-pilot",
  "timestamp": "2026-05-22T09:30:00Z",
  "expires_at": "2026-05-22T10:30:00Z",
  "reasoning": "Momentum positiv, Volatilitaet kontrolliert, kein Risiko-Override aktiv.",
  "tags": ["risk", "pilot", "reviewed"]
}
```

Schneller lokaler Test:

```powershell
node .\zenbot.js sim stub.BTC-USD --conf .\conf-examples\risk-analysis-file.conf.js --strategy risk_analysis_file --days 1
```

Reproduzierbarer Szenario-Test:

```powershell
npm run test:risk-analysis-scenario
node .\zenbot.js backfill stub.BTC-USD --conf .\conf-examples\risk-analysis-file-scenario-sql.conf.js --days 1
npm run sim:risk-analysis-scenario-sql
```

Der Szenario-Test nutzt:

- `data/risk/risk-analysis-scenario.example.json`
- `conf-examples/risk-analysis-file-scenario-sql.conf.js`
- `scripts/test-risk-analysis-scenario.js`
