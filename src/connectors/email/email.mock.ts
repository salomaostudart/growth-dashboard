import type { IConnector, ConnectorResult, ConnectorHealth, DateRangeParams } from '../base/connector.interface';
import type { EmailMetrics } from '../base/connector.schema';
import { generateEmailMetrics } from '../../utils/mock-generator';

export class EmailMockConnector implements IConnector<EmailMetrics> {
  readonly name = 'Mailchimp (Mock)';
  readonly source = 'mock' as const;

  async fetch(_params: DateRangeParams): Promise<ConnectorResult<EmailMetrics>> {
    return {
      data: generateEmailMetrics(),
      source: 'mock',
      fetchedAt: new Date(),
      errors: [],
    };
  }

  async health(): Promise<ConnectorHealth> {
    return { status: 'healthy', lastCheck: new Date(), latencyMs: 0, message: 'Mock connector' };
  }
}
