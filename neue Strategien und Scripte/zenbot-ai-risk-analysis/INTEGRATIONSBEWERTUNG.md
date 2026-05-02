# Integrationsbewertung `zenbot-ai-risk-analysis`

## Kurzfazit

`zenbot-ai-risk-analysis` ist kein normaler Zenbot-Strategieordner, sondern ein eigenstaendiges Zusatzsystem mit:

- Python-API
- separater Laufzeit
- eigener Konfiguration
- eigenem Analysemodell
- einer Node-Komponente, die nicht dem ueblichen Zenbot-Strategiemuster folgt

Darum wurde das System bewusst **nicht direkt** nach `extensions/strategies` uebernommen.

## Warum keine Direktintegration

### 1. Falsches Strategie-Lebenszyklusmodell

Die vorhandene Datei `strategy/ai_risk_strategy.js` exportiert eine Klasse mit `onTick()` und `EventEmitter`.

Zenbot-Strategien in diesem Repo arbeiten dagegen typischerweise mit:

- `getOptions()`
- `calculate()`
- `onPeriod()`
- `onReport()`

Die vorhandene AI-Risk-Datei ist deshalb architektonisch kein Drop-in-Ersatz fuer eine normale Strategie.

### 2. Abhaengigkeit von externer Infrastruktur

Das System erwartet standardmaessig:

- eine laufende Python-API unter `http://localhost:5000/api/risk`
- optional OpenAI oder Ollama
- eigene Python-Abhaengigkeiten
- eigene API-Konfiguration

Damit haengt der Handelsablauf nicht mehr nur von Zenbot ab, sondern von einem zweiten Dienst.

### 3. Rueckgabeformat passt nicht direkt zu Zenbot

Die Strategie erzeugt Steuerinformationen wie:

- `cancel_order`
- `close_position`
- `position_adjustment`
- `stop_loss_adjustment`

Diese Struktur ist sinnvoll als Risiko-Middleware, aber nicht als normale Zenbot-Signalstrategie im Stil von `buy`, `sell` oder `null`.

### 4. Datenmodell weicht vom vorhandenen Repo ab

Die Datei erwartet Analysefelder wie:

- `s.period.bollinger_upper`
- `s.period.bollinger_lower`

Im vorhandenen Repo liefert die Bollinger-Hilfsfunktion jedoch ein Objekt unter `s.period.bollinger` mit:

- `upperBound`
- `midBound`
- `lowerBound`

Ohne Adapter wuerde die Risikoanalyse damit bereits auf falschen Feldern arbeiten.

## Was aus dem System wertvoll ist

Trotzdem ist das Paket fachlich interessant. Wiederverwendbar sind vor allem:

- das Konzept der KI-gestuetzten Risikoaufschaltung
- die Trennung zwischen Marktanalyse und Handelsentscheidung
- die Konfiguration fuer Risiko-, Pause- und Positionslogik
- die Idee eines zusaetzlichen Gatekeepers vor finalen Trades

## Sinnvolle Zielarchitektur

Statt einer Direktintegration ist fuer dieses Repo spaeter folgende Architektur sinnvoller:

1. Normale Zenbot-Strategie erzeugt `buy` oder `sell`
2. Ein separater Risiko-Adapter bewertet diesen Vorschlag
3. Der Adapter entscheidet:
   - Trade erlauben
   - Trade blockieren
   - Positionsgroesse reduzieren
   - Schutzlogik verschaerfen

Das waere eher ein **Pre-Trade-Risk-Filter** als eine eigenstaendige Strategie.

## Empfohlener naechster technischer Schritt

Wenn wir dieses System spaeter wirklich nutzbar machen wollen, sollten wir **nicht** mit der Python-API beginnen, sondern zuerst einen kleinen Node-kompatiblen Adapter entwerfen:

### Phase 1

- Eingabe: `buy`/`sell`-Signal plus Marktstatus
- Ausgabe: `allow`, `block`, `risk_score`
- noch ohne externe KI

### Phase 2

- lokaler HTTP-Adapter fuer API oder Ollama
- klare JSON-Schnittstelle
- definierte Timeouts und Fallbacks

### Phase 3

- Einbindung in eine konkrete Strategie als optionales Risikomodul

## Entscheidung fuer den aktuellen Stand

Aktueller Status in diesem Repo:

- bewertet
- dokumentiert
- **nicht** in `extensions/strategies` uebernommen

Das ist absichtlich so, weil eine vorschnelle Integration hier mehr Scheinfunktion als belastbare Funktion erzeugen wuerde.
