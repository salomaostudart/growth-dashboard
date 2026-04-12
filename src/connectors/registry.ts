/**
 * Connector Registry — the single swap point for all data sources.
 * Change one env var to switch a channel from mock to real.
 *
 * Usage:
 *   import { getConnector } from './registry';
 *   const web = getConnector('web');
 *   const result = await web.fetch({ range: '30d', ... });
 */

import type { IConnector } from './base/connector.interface';
import type {
  WebMetrics,
  SeoMetrics,
  EmailMetrics,
  SocialMetrics,
  CrmMetrics,
  MartechHealth,
} from './base/connector.schema';

import { WebMockConnector } from './ga4/ga4.mock';
import { SeoMockConnector } from './search-console/gsc.mock';
import { EmailMockConnector } from './email/email.mock';
import { SocialMockConnector } from './social/social.mock';
import { CrmMockConnector } from './hubspot/hubspot.mock';
import { MartechMockConnector } from './webflow/martech.mock';

export interface ConnectorMap {
  web: IConnector<WebMetrics>;
  seo: IConnector<SeoMetrics>;
  email: IConnector<EmailMetrics>;
  social: IConnector<SocialMetrics>;
  crm: IConnector<CrmMetrics>;
  martech: IConnector<MartechHealth>;
}

// Registry: env var switches mock → real
function createRegistry(): ConnectorMap {
  return {
    web: new WebMockConnector(),
    seo: new SeoMockConnector(),
    email: new EmailMockConnector(),
    social: new SocialMockConnector(),
    crm: new CrmMockConnector(),
    martech: new MartechMockConnector(),
  };
}

const registry = createRegistry();

export function getConnector<K extends keyof ConnectorMap>(key: K): ConnectorMap[K] {
  return registry[key];
}

export function getAllConnectors(): ConnectorMap {
  return registry;
}
