# ZenTrade_AI als Windows-EXE

## Ziel

Diese Seite sammelt den aktuellen Stand fuer einen spaeteren Windows-EXE-Pfad. Der normale und heute praktikable Weg bleibt weiterhin:

- ZenTrade_AI klonen
- lokal per Node.js starten
- fuer Windows bevorzugt WSL oder ein sauberes Node-Setup verwenden

## Aktueller Stand

Eine klickbare EXE ist noch kein offizieller Hauptpfad des Projekts. Der EXE-Ansatz ist daher als spaeterer Ausbau zu verstehen und sollte erst verfolgt werden, wenn der normale Windows-/WSL-Betrieb stabil ist.

## Empfohlener Vorweg-Test unter Windows

1. Node.js LTS installieren
2. Git for Windows installieren
3. Repository klonen
4. normalen CLI-Start pruefen

```powershell
git clone https://github.com/dwhr-pi/ZenTrade_AI.git
cd ZenTrade_AI
npm install
node .\zenbot.js --help
```

Wenn diese Hilfeausgabe funktioniert, ist die Basis fuer spaetere Packaging-Schritte deutlich besser.

## WSL bleibt bevorzugt

Gerade fuer Windows gilt im aktuellen Projektstand:

- WSL ist der robustere Weg
- lokale `csv`- und `sql`-Tests sind wichtiger als fruehes EXE-Packaging
- erst die Konsole stabil, dann Packaging

## Möglicher spaeterer EXE-Pfad

Die vorhandene Skizze aus `neue Strategien und Scripte/Zenbot Windows.exe.md` deutet auf folgenden spaeteren Ablauf:

1. CLI-Lauffaehigkeit unter Windows sicherstellen
2. Packaging mit `pkg` pruefen
3. Assets und Konfigurationspfade sauber aufnehmen
4. optional einen Installer bauen

Typische Themen dabei:

- Dateizugriffe ausserhalb des Projektordners
- Schreibrechte fuer Logs und Konfigurationsdateien
- zusaetzliche Pfadlogik fuer Windows
- Firewall und Netzwerkfreigaben

## Wichtiger Hinweis

Die EXE-Idee ist interessant, aber derzeit kein primaerer Testpfad. Fuer Backtesting, Simulation und Paper-Trading sollten zuerst die dokumentierten WSL-/Linux-/CSV-/SQL-Wege verwendet werden.
