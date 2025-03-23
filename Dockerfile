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
ENV NODE_ENV=production

# Build the application
RUN node --experimental-modules node_modules/typescript/bin/tsc -p tsconfig.app.json
RUN NODE_ENV=production node --experimental-modules node_modules/vite/bin/vite.js build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]