# ZenTrade_AI automatisch starten

## Ziel

Diese Anleitung uebernimmt den nuetzlichen Kern aus `zenbot_autostart_guide.md` und richtet ihn auf den heutigen ZenTrade_AI-Betrieb aus.

Sie ist vor allem interessant fuer:

- Paper-Trading
- langfristige Testlaeufe
- spaetere produktionsnahe Beobachtung

## Vorher pruefen

Vor jedem Autostart sollte ZenTrade_AI manuell lauffaehig sein.

Zum Beispiel:

```bash
node ./zenbot.js sim stub.BTC-USD --conf ./conf-examples/sql.conf.js --strategy volume_universal --period_length 1m --days 1
```

Erst wenn der manuelle Start sauber funktioniert, lohnt sich Autostart.

## Linux mit systemd

Beispiel fuer einen einfachen Dienst:

```ini
[Unit]
Description=ZenTrade_AI
After=network.target

[Service]
WorkingDirectory=/pfad/zu/ZenTrade_AI
ExecStart=/usr/bin/node /pfad/zu/ZenTrade_AI/zenbot.js sim stub.BTC-USD --conf /pfad/zu/ZenTrade_AI/conf-examples/sql.conf.js --strategy volume_universal --period_length 1m --days 1
Restart=always
RestartSec=10
User=BENUTZERNAME
Group=BENUTZERGRUPPE

[Install]
WantedBy=multi-user.target
```

Danach:

```bash
sudo systemctl daemon-reload
sudo systemctl enable zentrade-ai.service
sudo systemctl start zentrade-ai.service
sudo systemctl status zentrade-ai.service
```

## macOS mit launchd

Auch hier gilt: zuerst den CLI-Start manuell pruefen, dann automatisieren.

Der Grundgedanke aus der Vorlage bleibt:

- Startkommando definieren
- beim Login oder Systemstart laden
- Standardausgabe und Fehler in Logdateien schreiben

Wenn wir diesen Pfad spaeter aktiv benoetigen, koennen wir daraus noch eine konkrete `.plist` fuer ZenTrade_AI bauen.

## Windows mit Aufgabenplaner

Fuer Windows ist der Aufgabenplaner der naheliegende Weg.

Empfehlung:

1. eine Aufgabe beim Systemstart oder bei der Anmeldung anlegen
2. als Programm `node.exe` verwenden
3. als Argumente den gewuenschten ZenTrade_AI-Befehl eintragen
4. als Arbeitsverzeichnis das Repo setzen

Beispielargumente:

```powershell
.\zenbot.js sim stub.BTC-USD --conf .\conf-examples\sql.conf.js --strategy volume_universal --period_length 1m --days 1
```

## Empfehlung fuer den aktuellen Projektstand

Autostart ist sinnvoll, wenn:

- ein SQL- oder CSV-Testpfad bereits stabil ist
- der Rechner dauerhaft verfuegbar ist
- Logs und Restart-Verhalten bewusst beobachtet werden

Weniger sinnvoll ist Autostart, wenn die Installation oder die Strategiebasis noch haeufig umgebaut wird.
