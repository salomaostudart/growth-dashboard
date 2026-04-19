import { generateMartechHealth } from '../../utils/mock-generator';
import type {
  ConnectorHealth,
  ConnectorResult,
  DateRangeParams,
  IConnector,
} from '../base/connector.interface';
import type { MartechHealth } from '../base/connector.schema';

export class MartechMockConnector implements IConnector<MartechHealth> {
  readonly name = 'Martech Stack (Mock)';
  readonly source = 'mock' as const;

  async fetch(_params: DateRangeParams): Promise<ConnectorResult<MartechHealth>> {
    return {
      data: generateMartechHealth(),
      source: 'mock',
      fetchedAt: new Date(),
      errors: [],
    };
  }

  async health(): Promise<ConnectorHealth> {
    return { status: 'healthy', lastCheck: new Date(), latencyMs: 0, message: 'Mock connector' };
  }
}
