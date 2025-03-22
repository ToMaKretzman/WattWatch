# Technischer Kontext

## Frontend
- React 18 mit TypeScript
- Vite als Build-Tool
- Material-UI für die Benutzeroberfläche
- Tab-basierte Navigation
- Komponenten für Zählerstand und Preiseingabe

## Backend
- Express.js Proxy-Server
- Leitet Anfragen an InfluxDB weiter
- CORS-Konfiguration
- Error-Handling
- Logging

## Datenbank
- InfluxDB für Zeitreihendaten
- Speichert:
  - Zählerstände
  - Strompreise
  - Metadaten

## Docker-Setup
- Multi-Stage Build für Frontend
- Nginx als Webserver
- InfluxDB Container
- Docker Compose für Orchestrierung

## Entwicklungsumgebung
- Node.js v23.10.0
- npm als Paketmanager
- ESModule-basierte Konfiguration
- TypeScript für Typsicherheit

## API-Endpunkte
- `/api/ocr`: OCR-Verarbeitung
- `/influxdb`: Proxy zu InfluxDB
- `/test`: Server-Status 