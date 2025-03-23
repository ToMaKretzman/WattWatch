import { InfluxDB } from '@influxdata/influxdb-client';

// Definiere mögliche URLs für verschiedene Umgebungen
const getInfluxDBUrl = () => {
  const configuredUrl = import.meta.env.VITE_INFLUXDB_URL;
  if (!configuredUrl) {
    console.warn('Keine InfluxDB-URL konfiguriert, verwende Standard-URL');
    return 'http://localhost:8086';
  }
  return configuredUrl;
};

const getInfluxDBConfig = () => {
  const url = getInfluxDBUrl();
  const token = import.meta.env.VITE_INFLUXDB_TOKEN;
  const org = import.meta.env.VITE_INFLUXDB_ORG;
  const bucket = import.meta.env.VITE_INFLUXDB_BUCKET;

  if (!token || !org || !bucket) {
    console.error('Fehlende InfluxDB-Konfiguration:', {
      tokenVorhanden: !!token,
      org,
      bucket
    });
    throw new Error('Unvollständige InfluxDB-Konfiguration');
  }

  return { url, token, org, bucket };
};

const config = getInfluxDBConfig();

console.log('InfluxDB Konfiguration:', {
  url: config.url,
  tokenVorhanden: !!config.token,
  org: config.org,
  bucket: config.bucket
});

const client = new InfluxDB({
  url: config.url,
  token: config.token
});

const writeApi = client.getWriteApi(config.org, config.bucket);
const queryApi = client.getQueryApi(config.org);

export { writeApi, queryApi, config }; 