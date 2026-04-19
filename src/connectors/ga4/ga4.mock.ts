import { generateWebMetrics } from '../../utils/mock-generator';
import type {
  ConnectorHealth,
  ConnectorResult,
  DateRangeParams,
  IConnector,
} from '../base/connector.interface';
import type { WebMetrics } from '../base/connector.schema';

export class WebMockConnector implements IConnector<WebMetrics> {
  readonly name = 'Google Analytics 4 (Mock)';
  readonly source = 'mock' as const;

  async fetch(_params: DateRangeParams): Promise<ConnectorResult<WebMetrics>> {
    return {
      data: generateWebMetrics(),
      source: 'mock',
      fetchedAt: new Date(),
      errors: [],
    };
  }

  async health(): Promise<ConnectorHealth> {
    return { status: 'healthy', lastCheck: new Date(), latencyMs: 0, message: 'Mock connector' };
  }
}
