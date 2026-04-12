/**
 * Connector Interface — the architectural core of the dashboard.
 * Every data source (GA4, HubSpot, Mailchimp, etc.) implements this contract.
 * Swapping mock → real = changing one env var in the registry.
 */

export type ConnectorSource = 'live' | 'mock' | 'cached';

export interface DateRangeParams {
  start: Date;
  end: Date;
  range: '7d' | '30d' | '90d' | 'custom';
}

export interface ConnectorHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastCheck: Date;
  latencyMs?: number;
  message?: string;
}

export interface ConnectorError {
  code: string;
  message: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface ConnectorResult<T> {
  data: T;
  source: ConnectorSource;
  fetchedAt: Date;
  errors: ConnectorError[];
}

export interface IConnector<T> {
  readonly name: string;
  readonly source: ConnectorSource;

  fetch(params: DateRangeParams): Promise<ConnectorResult<T>>;
  health(): Promise<ConnectorHealth>;
}
