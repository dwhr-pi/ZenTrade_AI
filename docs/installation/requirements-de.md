### Erforderlich

Die einzigen Voraussetzungen für die Installation und Ausführung von Zenbot sind:

- Linux / macOS 10 / Windows (oder Docker)
- [Node.js](https://nodejs.org/) (version 8.3.0 oder höher)
- [MongoDB](https://www.mongodb.com/) fuer den klassischen Datenbankbetrieb

Alternativ fuer lokale Tests und Pilotlaeufe:

- CSV-Dateibetrieb ohne MongoDB
  - siehe `docs/installation/csv-de.md`

Zur Umschaltung zwischen `mongo`, `csv` und dem reservierten `sql`-Pfad:

- `docs/installation/database-modes-de.md`

#### Empfehlungen

- Es wird empfohlen, einen 64Bit-Prozessor (und ein 64Bit-Betriebssystem) zu verwenden, da ein 32Bit-Betriebssystem die Datenbank auf 2 GB beschränkt.
