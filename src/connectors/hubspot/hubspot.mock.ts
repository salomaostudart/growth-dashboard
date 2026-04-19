import { generateCrmMetrics } from '../../utils/mock-generator';
import type {
  ConnectorHealth,
  ConnectorResult,
  DateRangeParams,
  IConnector,
} from '../base/connector.interface';
import type { CrmMetrics } from '../base/connector.schema';

export class CrmMockConnector implements IConnector<CrmMetrics> {
  readonly name = 'HubSpot CRM (Mock)';
  readonly source = 'mock' as const;

  async fetch(_params: DateRangeParams): Promise<ConnectorResult<CrmMetrics>> {
    return {
      data: generateCrmMetrics(),
      source: 'mock',
      fetchedAt: new Date(),
      errors: [],
    };
  }

  async health(): Promise<ConnectorHealth> {
    return { status: 'healthy', lastCheck: new Date(), latencyMs: 0, message: 'Mock connector' };
  }
}
