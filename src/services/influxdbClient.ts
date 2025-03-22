import { InfluxDB } from '@influxdata/influxdb-client';

// In Docker wird die URL relativ zum nginx-Proxy sein
export const url = import.meta.env.VITE_INFLUXDB_URL;
export const token = import.meta.env.VITE_INFLUXDB_TOKEN;
export const org = import.meta.env.VITE_INFLUXDB_ORG;
export const bucket = import.meta.env.VITE_INFLUXDB_BUCKET;

const client = new InfluxDB({
  url,
  token
});

const writeApi = client.getWriteApi(org, bucket);
const queryApi = client.getQueryApi(org);

export { writeApi, queryApi }; 