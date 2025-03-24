# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Installiere nur die Produktionsabhängigkeiten
COPY package*.json ./
RUN npm ci --only=production

# Cache-Layer für TypeScript-Kompilierung
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Cache-Layer für Source-Code
COPY src ./src
COPY public ./public
COPY index.html ./

# Set build-time arguments
ARG VITE_INFLUXDB_URL
ARG VITE_INFLUXDB_TOKEN
ARG VITE_INFLUXDB_ORG
ARG VITE_INFLUXDB_BUCKET
ARG VITE_OPENAI_API_KEY

# Set environment variables for build
ENV VITE_INFLUXDB_URL=${VITE_INFLUXDB_URL} \
    VITE_INFLUXDB_TOKEN=${VITE_INFLUXDB_TOKEN} \
    VITE_INFLUXDB_ORG=${VITE_INFLUXDB_ORG} \
    VITE_INFLUXDB_BUCKET=${VITE_INFLUXDB_BUCKET} \
    VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY} \
    NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Optimiere Nginx
RUN rm /etc/nginx/conf.d/default.conf.default || true && \
    rm -rf /usr/share/nginx/html/index.html.default || true && \
    rm -rf /var/cache/nginx/* && \
    rm -rf /var/log/nginx/* && \
    ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]