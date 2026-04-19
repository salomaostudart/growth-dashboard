import { generateSocialMetrics } from '../../utils/mock-generator';
import type {
  ConnectorHealth,
  ConnectorResult,
  DateRangeParams,
  IConnector,
} from '../base/connector.interface';
import type { SocialMetrics } from '../base/connector.schema';

export class SocialMockConnector implements IConnector<SocialMetrics> {
  readonly name = 'Social Media (Mock)';
  readonly source = 'mock' as const;

  async fetch(_params: DateRangeParams): Promise<ConnectorResult<SocialMetrics>> {
    return {
      data: generateSocialMetrics(),
      source: 'mock',
      fetchedAt: new Date(),
      errors: [],
    };
  }

  async health(): Promise<ConnectorHealth> {
    return { status: 'healthy', lastCheck: new Date(), latencyMs: 0, message: 'Mock connector' };
  }
}
