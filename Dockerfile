# Build stage
FROM node:18 as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Set build-time arguments
ARG VITE_INFLUXDB_URL
ARG VITE_INFLUXDB_TOKEN
ARG VITE_INFLUXDB_ORG
ARG VITE_INFLUXDB_BUCKET
ARG VITE_OPENAI_API_KEY

# Set environment variables for build
ENV VITE_INFLUXDB_URL=${VITE_INFLUXDB_URL}
ENV VITE_INFLUXDB_TOKEN=${VITE_INFLUXDB_TOKEN}
ENV VITE_INFLUXDB_ORG=${VITE_INFLUXDB_ORG}
ENV VITE_INFLUXDB_BUCKET=${VITE_INFLUXDB_BUCKET}
ENV VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY}

# Build the application
RUN node --experimental-modules node_modules/typescript/bin/tsc -p tsconfig.app.json
RUN NODE_ENV=production node --experimental-modules node_modules/vite/bin/vite.js build

# Production stage
FROM nginx:alpine

# Copy the startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy the built application
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Set environment variables
ENV VITE_INFLUXDB_URL=http://wattwatch-db:8086 \
    VITE_INFLUXDB_TOKEN="" \
    VITE_INFLUXDB_ORG="" \
    VITE_INFLUXDB_BUCKET="" \
    VITE_OPENAI_API_KEY=""

# Use the startup script as entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"] 