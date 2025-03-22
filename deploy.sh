#!/bin/bash

# Farben für Ausgaben
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Funktionen
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}Fehler: $1${NC}"
        exit 1
    fi
}

echo -e "${GREEN}Starting deployment...${NC}"

# 1. Prüfe ob .env.production und GitHub Token existieren
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production nicht gefunden!${NC}"
    exit 1
fi

if [ -z "$GITHUB_PAT" ]; then
    echo -e "${RED}Error: GITHUB_PAT Umgebungsvariable nicht gesetzt!${NC}"
    echo -e "${RED}Bitte setzen Sie den GitHub Personal Access Token:${NC}"
    echo -e "${RED}export GITHUB_PAT=ihr_token${NC}"
    exit 1
fi

# 2. Bei GitHub Container Registry anmelden
echo -e "${GREEN}Melde bei GitHub Container Registry an...${NC}"
echo $GITHUB_PAT | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
check_error "GitHub Container Registry Login fehlgeschlagen"

# 3. Backup der aktuellen .env
if [ -f .env ]; then
    mv .env .env.backup
    echo -e "${GREEN}Backup der .env erstellt${NC}"
fi

# 4. Kopiere .env.production nach .env
cp .env.production .env
check_error "Konnte .env.production nicht kopieren"

# 5. Aktualisiere das Frontend-Image
echo -e "${GREEN}Aktualisiere Frontend-Image...${NC}"
docker compose -f docker-compose.prod.yml pull wattwatch-frontend
check_error "Docker Image Pull fehlgeschlagen"

# 6. Stoppe laufende Container
echo -e "${GREEN}Stoppe laufende Container...${NC}"
docker compose -f docker-compose.prod.yml down
check_error "Docker Compose down fehlgeschlagen"

# 7. Starte Container
echo -e "${GREEN}Starte Container...${NC}"
docker compose -f docker-compose.prod.yml up -d
check_error "Docker Compose up fehlgeschlagen"

# 8. Warte auf Gesundheitsprüfungen
echo -e "${GREEN}Warte auf Container-Gesundheitsprüfungen...${NC}"
sleep 10

# 9. Prüfe Container-Status
if [ "$(docker compose -f docker-compose.prod.yml ps --format json | grep -c "\"State\":\"running\"")" -ne "$(docker compose -f docker-compose.prod.yml ps --format json | grep -c "\"Service\"")" ]; then
    echo -e "${RED}Nicht alle Container laufen!${NC}"
    docker compose -f docker-compose.prod.yml logs
    exit 1
fi

echo -e "${GREEN}Deployment erfolgreich abgeschlossen!${NC}"
echo -e "${GREEN}Prüfen Sie die Logs mit: docker compose -f docker-compose.prod.yml logs -f${NC}" 