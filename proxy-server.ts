import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Konfigurationstypen
interface ServerConfig {
  port: number;
  corsOptions: cors.CorsOptions;
  influxdb: {
    url: string;
    token: string;
  };
}

// Server-Klasse
class ProxyServer {
  private app: express.Application;
  private config: ServerConfig;
  private server: ReturnType<typeof express.application.listen> | null = null;

  constructor() {
    this.app = express();
    this.config = this.loadConfig();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private loadConfig(): ServerConfig {
    dotenv.config();

    let influxdbUrl = process.env.VITE_INFLUXDB_URL || 'http://localhost:8086';
    if (influxdbUrl.includes('hamburg8086')) {
      influxdbUrl = influxdbUrl.replace('hamburg8086', 'hamburg:8086');
    }

    const token = process.env.VITE_INFLUXDB_TOKEN || '';
    console.log('Loading config with InfluxDB URL:', influxdbUrl);
    console.log('Token available:', !!token);

    return {
      port: 3000,
      corsOptions: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      influxdb: {
        url: influxdbUrl,
        token: token
      }
    };
  }

  private setupMiddleware(): void {
    this.app.use(cors(this.config.corsOptions));
    this.app.use(express.json());
    this.app.use(this.requestLogger.bind(this));
  }

  private setupRoutes(): void {
    this.app.get('/test', this.testEndpoint.bind(this));
    
    if (this.config.influxdb.url) {
      console.log('Setting up InfluxDB proxy with target:', this.config.influxdb.url);
      this.app.use('/influxdb', this.createInfluxDBProxy());
    } else {
      console.error('No InfluxDB URL configured!');
    }
  }

  private setupErrorHandling(): void {
    this.app.use(this.errorHandler.bind(this));
  }

  private requestLogger(req: Request, res: Response, next: NextFunction): void {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request headers:', req.headers);
    next();
  }

  private testEndpoint(_req: Request, res: Response): void {
    res.json({
      status: 'Proxy-Server läuft',
      influxdbUrl: this.config.influxdb.url,
      token: this.config.influxdb.token ? 'Vorhanden' : 'Fehlt'
    });
  }

  private createInfluxDBProxy() {
    const token = this.config.influxdb.token;
    if (!token) {
      console.error('InfluxDB token is missing!');
      throw new Error('InfluxDB token is required');
    }

    return createProxyMiddleware({
      target: this.config.influxdb.url,
      changeOrigin: true,
      pathRewrite: {
        '^/influxdb': ''
      },
      onProxyReq: (proxyReq, req) => {
        // Extrahiere den Token aus der Konfiguration
        const token = this.config.influxdb.token;
        
        // Setze den Authorization-Header
        proxyReq.setHeader('Authorization', `Token ${token}`);
        
        // Setze den Host-Header auf die Ziel-URL
        const targetUrl = new URL(this.config.influxdb.url);
        proxyReq.setHeader('host', targetUrl.host);
        
        // Headers für Debugging loggen
        console.log('Original request headers:', req.headers);
        console.log('Modified proxy request headers:', proxyReq.getHeaders());
      },
      onProxyRes: (proxyRes) => {
        // Response Details loggen
        console.log('Proxy response status:', proxyRes.statusCode);
        console.log('Proxy response headers:', proxyRes.headers);
      },
      onError: (err, _req, res) => {
        console.error('Proxy error:', err);
        const error = err as Error & { code?: string };
        res.writeHead(500, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
          error: 'Proxy Error',
          message: error.message,
          code: error.code
        }));
      }
    });
  }

  private errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error('Global error:', err);
    res.writeHead(500, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
      error: 'Server Error',
      message: err.message
    }));
  }

  public start(): void {
    this.server = this.app.listen(this.config.port, () => {
      console.log(`Proxy-Server läuft auf http://localhost:${this.config.port}`);
      console.log('InfluxDB URL:', this.config.influxdb.url);
      console.log('Token vorhanden:', !!this.config.influxdb.token);
    });

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const shutdown = () => {
      console.log('Server wird beendet...');
      if (this.server) {
        this.server.close(() => {
          console.log('Server wurde sauber beendet.');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

// Server starten
const server = new ProxyServer();
server.start(); 