import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register: client.Registry;

  // ── Custom Metrics ──
  public readonly httpRequestsTotal: client.Counter<string>;
  public readonly httpRequestDuration: client.Histogram<string>;
  public readonly activeConnections: client.Gauge<string>;
  public readonly queryExecutionsTotal: client.Counter<string>;
  public readonly aiTokensUsed: client.Counter<string>;
  public readonly airbytesyncsTotal: client.Counter<string>;

  constructor() {
    this.register = new client.Registry();

    // Default Node.js metrics (GC, event loop, heap, etc.)
    client.collectDefaultMetrics({ register: this.register });

    // HTTP request counter
    this.httpRequestsTotal = new client.Counter({
      name: 'sarai_http_requests_total',
      help: 'Total HTTP requests received',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new client.Histogram({
      name: 'sarai_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    // Active WebSocket connections
    this.activeConnections = new client.Gauge({
      name: 'sarai_active_websocket_connections',
      help: 'Number of active WebSocket connections',
      registers: [this.register],
    });

    // Query execution counter
    this.queryExecutionsTotal = new client.Counter({
      name: 'sarai_query_executions_total',
      help: 'Total query executions',
      labelNames: ['status'],
      registers: [this.register],
    });

    // AI tokens used counter
    this.aiTokensUsed = new client.Counter({
      name: 'sarai_ai_tokens_used_total',
      help: 'Total AI tokens consumed',
      labelNames: ['model'],
      registers: [this.register],
    });

    // Airbyte sync counter
    this.airbytesyncsTotal = new client.Counter({
      name: 'sarai_airbyte_syncs_total',
      help: 'Total Airbyte sync operations',
      labelNames: ['status'],
      registers: [this.register],
    });
  }

  onModuleInit() {
    // Registry ready on module init
  }

  /** Get Prometheus metrics in text format */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /** Get content type for Prometheus */
  getContentType(): string {
    return this.register.contentType;
  }
}
