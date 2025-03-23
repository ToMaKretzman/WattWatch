export interface Config {
    influxdb: {
        url: string;
        token: string;
        org: string;
        bucket: string;
    };
    openai: {
        apiKey: string;
    };
}

let configCache: Config | null = null;

export async function loadConfig(): Promise<Config> {
    if (configCache) {
        return configCache;
    }

    try {
        const response = await fetch('/config.json');
        if (!response.ok) {
            throw new Error(`Konfiguration konnte nicht geladen werden: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Validiere die Konfiguration
        if (!config.influxdb?.url || !config.influxdb?.token || !config.influxdb?.org || !config.influxdb?.bucket) {
            throw new Error('Unvollständige InfluxDB-Konfiguration');
        }

        // Cache die Konfiguration
        configCache = config;
        
        return config;
    } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        throw error;
    }
} 