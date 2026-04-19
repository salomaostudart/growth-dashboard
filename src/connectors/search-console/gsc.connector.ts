import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type {
  ConnectorHealth,
  ConnectorResult,
  DateRangeParams,
  IConnector,
} from '../base/connector.interface';
import type { SeoMetrics } from '../base/connector.schema';
import { SeoMetricsSchema } from '../base/connector.schema';

const SNAPSHOT_PATH = fileURLToPath(
  new URL('../../data/snapshots/gsc-snapshot.json', import.meta.url),
);

export class SeoLiveConnector implements IConnector<SeoMetrics> {
  readonly name = 'Google Search Console';
  readonly source = 'live' as const;

  async fetch(_params: DateRangeParams): Promise<ConnectorResult<SeoMetrics>> {
    try {
      const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
      const json = JSON.parse(raw);
      const parsed = SeoMetricsSchema.parse(json.data);

      return {
        data: parsed,
        source: 'live',
        fetchedAt: new Date(json.fetchedAt || Date.now()),
        errors: [],
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return {
        data: null as unknown as SeoMetrics,
        source: 'live',
        fetchedAt: new Date(),
        errors: [
          {
            code: 'SNAPSHOT_ERROR',
            message: `GSC snapshot error: ${message}`,
            timestamp: new Date(),
            recoverable: true,
          },
        ],
      };
    }
  }

  async health(): Promise<ConnectorHealth> {
    try {
      const stat = fs.statSync(SNAPSHOT_PATH);
      const ageMs = Date.now() - stat.mtimeMs;
      const staleHours = 48;

      if (ageMs > staleHours * 3600000) {
        return {
          status: 'degraded',
          lastCheck: new Date(),
          latencyMs: 0,
          message: `Snapshot is ${Math.round(ageMs / 3600000)}h old (stale > ${staleHours}h)`,
        };
      }

      return {
        status: 'healthy',
        lastCheck: new Date(),
        latencyMs: 0,
        message: 'Snapshot up to date',
      };
    } catch {
      return {
        status: 'down',
        lastCheck: new Date(),
        latencyMs: 0,
        message: 'Snapshot file not found',
      };
    }
  }
}
