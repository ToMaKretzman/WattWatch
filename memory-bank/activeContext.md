# Aktiver Kontext

## Aktueller Status
- Frontend läuft auf Port 5173
- Proxy-Server läuft auf Port 3000
- Docker-Container sind aktiv:
  - webapp
  - influxdb

## Letzte Änderungen
- Zurücksetzen auf letzten Git-Commit
- Neuaufbau der Docker-Container
- Behebung von TypeScript-Fehlern
- Neustart des Proxy-Servers

## Bekannte Probleme
- Proxy-Server terminiert manchmal unerwartet
- InfluxDB-URL enthält falsches Format (hamburg8086)

## Nächste Schritte
1. Stabilisierung des Proxy-Servers
2. Korrektur der InfluxDB-URL
3. Implementierung der OCR-Funktionalität
4. Verbesserung der Fehlerbehandlung

## Aktive Entscheidungen
- ESModule-Format für alle JavaScript-Dateien
- Docker für Deployment
- Material-UI für Benutzeroberfläche
- Tab-basierte Navigation 