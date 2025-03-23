import { InfluxDB } from '@influxdata/influxdb-client';

// Definiere mögliche URLs für verschiedene Umgebungen
const getInfluxDBUrl = () => {
  const configuredUrl = import.meta.env.VITE_INFLUXDB_URL;
  if (!configuredUrl) {
    // Fallback für lokale Entwicklung
    return 'http://localhost:8086';
  }
  return configuredUrl;
};

export const url = getInfluxDBUrl();
export const token = import.meta.env.VITE_INFLUXDB_TOKEN;
export const org = import.meta.env.VITE_INFLUXDB_ORG;
export const bucket = import.meta.env.VITE_INFLUXDB_BUCKET;

console.log('InfluxDB Konfiguration:', {
  url,
  tokenVorhanden: !!token,
  org,
  bucket
});

const client = new InfluxDB({
  url,
  token
});

const writeApi = client.getWriteApi(org, bucket);
const queryApi = client.getQueryApi(org);

export { writeApi, queryApi }; 