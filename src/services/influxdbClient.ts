import { InfluxDB } from '@influxdata/influxdb-client';
import { loadConfig } from './config';
import type { Config } from './config';

let client: InfluxDB | null = null;
let writeApi: any = null;
let queryApi: any = null;
let config: Config | null = null;

export async function initializeClient(): Promise<void> {
    try {
        config = await loadConfig();
        
        client = new InfluxDB({
            url: config.influxdb.url,
            token: config.influxdb.token
        });

        writeApi = client.getWriteApi(config.influxdb.org, config.influxdb.bucket);
        queryApi = client.getQueryApi(config.influxdb.org);

        console.log('InfluxDB Client erfolgreich initialisiert');
    } catch (error) {
        console.error('Fehler bei der Initialisierung des InfluxDB Clients:', error);
        throw error;
    }
}

export function getWriteApi() {
    if (!writeApi) {
        throw new Error('InfluxDB Client wurde noch nicht initialisiert');
    }
    return writeApi;
}

export function getQueryApi() {
    if (!queryApi) {
        throw new Error('InfluxDB Client wurde noch nicht initialisiert');
    }
    return queryApi;
}

export function getConfig() {
    if (!config) {
        throw new Error('InfluxDB Client wurde noch nicht initialisiert');
    }
    return config.influxdb;
}