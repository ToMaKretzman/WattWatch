# 🔋 WattWatch

WattWatch ist eine Webanwendung zur Erfassung und Analyse von Stromzählerständen. Mit WattWatch können Sie Ihren Stromverbrauch dokumentieren und analysieren.

## 🌟 Features

- 📸 Automatische Zählerstanderkennung mittels Kamera
- 📊 Verbrauchsanalyse und -visualisierung
- 🤖 KI-gestützte Zählerstanderkennung via OpenAI
- 📱 Responsive Design für mobile Nutzung
- 🔒 Sichere Datenspeicherung in InfluxDB
- 🚀 Moderne React + TypeScript Architektur

## 🛠 Technologie-Stack

- **Frontend**: React, TypeScript, Material-UI
- **Datenbank**: InfluxDB
- **KI-Integration**: OpenAI API
- **Container**: Docker, GitHub Container Registry
- **CI/CD**: GitHub Actions
- **Webserver**: Nginx

## 🚀 Schnellstart

### Mit Docker Compose

```bash
# Repository klonen
git clone https://github.com/ToMaKretzman/WattWatch.git
cd WattWatch

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeiten Sie .env und setzen Sie Ihre Konfigurationswerte

# Container starten
docker compose up -d
```

### Mit Dockge

```bash
# Stack erstellen
- Name: wattwatch
- Compose-Datei: docker-compose.prod.yml hochladen
- Env-Datei: .env.dockge nach .env kopieren und anpassen
```

## ⚙️ Konfiguration

### Erforderliche Umgebungsvariablen

```env
# OpenAI API (für KI-Funktionen)
VITE_OPENAI_API_KEY=ihr_api_key

# InfluxDB
INFLUXDB_USER=admin
INFLUXDB_PASSWORD=sicheres_passwort
INFLUXDB_ORG=WattWatch
INFLUXDB_BUCKET=WattWatch
INFLUXDB_TOKEN=sicherer_token
```

## 📊 Datenstruktur

WattWatch speichert Daten in InfluxDB mit folgender Struktur:

- **Measurement**: `zaehlerstand`
- **Fields**:
  - `wert`: Zählerstand in kWh
  - `verbrauch`: Berechneter Verbrauch seit letzter Messung in kWh
- **Tags**:
  - `quelle`: Erfassungsmethode (z.B. "kamera", "manuell")
  - `zaehler_id`: Identifikation des Stromzählers

## 🔒 Sicherheit

- Alle sensiblen Daten werden in Umgebungsvariablen gespeichert
- HTTPS-Verschlüsselung für Produktionsumgebungen
- Regelmäßige Sicherheitsupdates
- Rate Limiting für API-Endpunkte

## 🚀 Deployment

### Produktionsumgebung

1. Konfigurieren Sie Ihre Umgebungsvariablen:
```bash
cp .env.production.example .env.production
# Bearbeiten Sie .env.production
```

2. Starten Sie den Stack:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Updates

```bash
# Neueste Version ziehen
docker compose -f docker-compose.prod.yml pull

# Stack neu starten
docker compose -f docker-compose.prod.yml up -d
```

## 📦 Container Registry

Das Docker Image ist öffentlich verfügbar unter:
```bash
ghcr.io/tomakretzman/wattwatch:latest
```

## 🤝 Beitragen

1. Fork erstellen
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Danksagung

- [InfluxDB](https://www.influxdata.com/) für die Zeitreihendatenbank
- [OpenAI](https://openai.com/) für die KI-Integration
- [Material-UI](https://mui.com/) für die UI-Komponenten

## 📫 Kontakt

Toma Kretzman - [@ToMaKretzman](https://github.com/ToMaKretzman)

Projekt Link: [https://github.com/ToMaKretzman/WattWatch](https://github.com/ToMaKretzman/WattWatch)
