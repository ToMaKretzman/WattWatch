# WattWatch Deployment-Anleitung

## Voraussetzungen

- Docker und Docker Compose installiert
- Git installiert
- GitHub-Konto mit Zugriff auf das Repository
- GitHub Personal Access Token (PAT) mit folgenden Berechtigungen:
  - `read:packages`
  - `write:packages`
  - `delete:packages`

## Ersteinrichtung auf dem Produktionsserver

1. **GitHub Personal Access Token erstellen**
- Gehen Sie zu GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Erstellen Sie einen neuen Token mit den oben genannten Berechtigungen
- Speichern Sie den Token sicher ab

2. **Umgebungsvariablen setzen**
```bash
# Setzen Sie diese Variablen in Ihrer Shell oder in ~/.bashrc / ~/.zshrc
export GITHUB_USERNAME="IhrGitHubUsername"
export GITHUB_PAT="IhrPersonalAccessToken"
```

3. **Repository klonen**
```bash
git clone <repository-url>
cd wattwatch
```

4. **Produktionsumgebung konfigurieren**
- Kopieren Sie `.env.production.example` nach `.env.production`
```bash
cp .env.production.example .env.production
```
- Bearbeiten Sie `.env.production` und setzen Sie die folgenden Werte:
  - `VITE_OPENAI_API_KEY`: Ihr OpenAI API-Schlüssel
  - `INFLUXDB_PASSWORD`: Ein sicheres Passwort
  - `INFLUXDB_TOKEN`: Ein sicherer Token
  - `GITHUB_REPOSITORY`: Ihr GitHub Repository (z.B. username/wattwatch)

5. **Deployment-Skript ausführbar machen**
```bash
chmod +x deploy.sh
```

## Automatisches Deployment

Das Projekt verwendet GitHub Actions für CI/CD:

1. **Bei Push auf main oder Pull Request**:
   - Code wird getestet
   - Docker Image wird gebaut
   - Bei erfolgreichem Push wird das Image privat in die GitHub Container Registry hochgeladen

2. **Bei Release (Tag)**:
   - Version wird als Tag gesetzt
   - Production Image wird gebaut und privat gepusht

## Deployment auf dem Produktionsserver

1. **Initiales Deployment**
```bash
./deploy.sh
```

2. **Update auf neue Version**
- Setzen Sie einen neuen Tag im Repository
- GitHub Actions baut und pusht das neue Image
- Führen Sie auf dem Server aus:
```bash
./deploy.sh
```

## Überprüfung der Installation

1. **Container-Status prüfen**
```bash
docker compose -f docker-compose.prod.yml ps
```

2. **Logs überprüfen**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

3. **Anwendung testen**
- Öffnen Sie die Anwendung im Browser: `http://ihre-domain.com`
- Testen Sie die Kamera-Funktion
- Prüfen Sie die InfluxDB-Verbindung

## Backup und Wartung

1. **InfluxDB-Backup erstellen**
```bash
docker compose -f docker-compose.prod.yml exec wattwatch-db influx backup /backup
```

2. **Logs rotieren**
Die Container sind mit Log-Rotation konfiguriert (max 3x10MB pro Container)

## Fehlerbehebung

1. **GitHub Container Registry Authentifizierung prüfen**
```bash
docker login ghcr.io -u $GITHUB_USERNAME
```

2. **Container neu starten**
```bash
docker compose -f docker-compose.prod.yml restart
```

3. **Kompletter Neustart**
```bash
./deploy.sh
```

4. **Logs prüfen**
```bash
docker compose -f docker-compose.prod.yml logs -f wattwatch-frontend
docker compose -f docker-compose.prod.yml logs -f wattwatch-db
```

## Sicherheitshinweise

1. **Wichtige Punkte**
   - GitHub PAT sicher aufbewahren und regelmäßig rotieren
   - `.env.production` schützen
   - Regelmäßige Backups durchführen
   - Logs überwachen

2. **Firewall-Einstellungen**
   - Port 80/443 für Frontend
   - Keine direkten Zugriffe auf Port 8086 (InfluxDB) von außen