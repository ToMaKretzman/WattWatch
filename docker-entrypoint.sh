#!/bin/sh

# Erstelle Konfigurationsdatei aus Umgebungsvariablen
cat > /usr/share/nginx/html/config.json << EOF
{
    "influxdb": {
        "url": "${VITE_INFLUXDB_URL}",
        "token": "${VITE_INFLUXDB_TOKEN}",
        "org": "${VITE_INFLUXDB_ORG}",
        "bucket": "${VITE_INFLUXDB_BUCKET}"
    },
    "openai": {
        "apiKey": "${VITE_OPENAI_API_KEY}"
    }
}
EOF

# Starte Nginx
exec nginx -g 'daemon off;' 