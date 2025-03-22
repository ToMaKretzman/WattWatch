# Strompreis Projekt

## Projektziel
Eine Webanwendung zur Erfassung und Verwaltung von Zählerständen und Strompreisen.

## Hauptfunktionen
1. OCR-basierte Zählerstanderkennung
2. Verwaltung von Strompreisen
3. Speicherung der Daten in InfluxDB
4. Visualisierung der Daten

## Technischer Stack
- Frontend: React + TypeScript + Vite
- Backend: Express.js Proxy-Server
- Datenbank: InfluxDB
- Container: Docker
- UI Framework: Material-UI

## Architektur
- Frontend-App (Port 5173)
- Proxy-Server (Port 3000)
- InfluxDB (Port 8086)

## Deployment
Die Anwendung wird in Docker-Containern bereitgestellt:
- webapp: Frontend-Container
- influxdb: Datenbank-Container 