import { generateSeoMetrics } from '../../utils/mock-generator';
import type {
  ConnectorHealth,
  ConnectorResult,
  DateRangeParams,
  IConnector,
} from '../base/connector.interface';
import type { SeoMetrics } from '../base/connector.schema';

export class SeoMockConnector implements IConnector<SeoMetrics> {
  readonly name = 'Google Search Console (Mock)';
  readonly source = 'mock' as const;

  async fetch(_params: DateRangeParams): Promise<ConnectorResult<SeoMetrics>> {
    return {
      data: generateSeoMetrics(),
      source: 'mock',
      fetchedAt: new Date(),
      errors: [],
    };
  }

  async health(): Promise<ConnectorHealth> {
    return { status: 'healthy', lastCheck: new Date(), latencyMs: 0, message: 'Mock connector' };
  }
}
