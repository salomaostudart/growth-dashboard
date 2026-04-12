# Digital Growth Command Center

A comprehensive metrics capture, automation, and interactive dashboard tool for digital growth teams. Built as a production-ready template that can be deployed for any organization's marketing technology stack.

## Why This Project Exists

Modern digital growth requires visibility across multiple channels -- website, SEO, email, social media, CRM, and the marketing technology stack itself. Most dashboards are either too generic (Google Analytics alone) or too expensive (enterprise BI tools).

This project solves that by providing:
- **Unified cross-channel view** -- all digital metrics in one place
- **Connector pattern** -- swap data sources without changing dashboard code
- **Real + mock data** -- works with live APIs and realistic simulated data
- **Enterprise-grade quality** -- accessibility, performance, and testing built in

## Architecture

```
+--------------------------------------------------------------+
|                        Dashboard UI                          |
|  +----------+ +----------+ +----------+ +----------+        |
|  | Overview | |   Web    | |   SEO    | |  Email   |  ...   |
|  |(Command  | |Performanc| | AEO/GEO  | |Marketing |        |
|  | Center)  | |    e     | |          | |          |        |
|  +----+-----+ +----+-----+ +----+-----+ +----+-----+        |
|       |             |            |             |              |
|  +----v-------------v------------v-------------v--------+    |
|  |              Connector Registry                      |    |
|  |         (src/connectors/registry.ts)                 |    |
|  |    Env var switches each channel mock <-> real       |    |
|  +--+------+------+------+------+------+------------+---+    |
|     |      |      |      |      |      |                     |
|  +--v--++--v--++--v--++--v--++--v--++--v--+                  |
|  | GA4 || GSC ||Email||Social| CRM ||Mart-|                  |
|  |     ||     ||     ||     ||     ||ech  |                  |
|  +--+--++--+--++--+--++--+--++--+--++--+--+                  |
|     |      |      |      |      |      |                     |
|  +--v------v------v------v------v------v----------------+    |
|  |              Zod Schema Validation                   |    |
|  |    Every response validated before reaching UI       |    |
|  +------------------------------------------------------+    |
+--------------------------------------------------------------+
```

### Key Architectural Decision: Connector Pattern

Every data source implements the same `IConnector<T>` interface:

```typescript
interface IConnector<T> {
  readonly name: string;
  readonly source: 'live' | 'mock' | 'cached';
  fetch(params: DateRangeParams): Promise<ConnectorResult<T>>;
  health(): Promise<ConnectorHealth>;
}
```

**Why this matters:**
- Adding a new data source = implementing one interface (~2 hours)
- Swapping mock to real = changing one environment variable
- Every connector exposes `health()` -- the Martech Health page aggregates these
- Zod validates every response at runtime -- catches API changes before they break the UI

See [CONNECTORS.md](./CONNECTORS.md) for the full integration guide.

## Tech Stack and Justifications

| Technology | Role | Why This Over Alternatives |
|---|---|---|
| **Astro 5** | Framework | Static output (no server needed), TypeScript native, zero JS shipped unless opted in. Deploys to GitHub Pages or Vercel free tier. HTML-like syntax maintainable without framework expertise |
| **Apache ECharts 6** | Data visualization | Enterprise-grade (Apache Foundation), built-in dark theme, supports heatmaps/Sankey/funnel without extra deps. Handles 10K+ data points without performance issues |
| **Zod 4** | Runtime validation | Validates connector responses against typed schemas. Catches data shape changes from external APIs before they reach the UI |
| **TypeScript** | Type safety | Catches errors at build time. Connector interface enforces consistent data contracts |
| **Oswald + Inter** | Typography | Same fonts used by the target organization -- demonstrates research and alignment |
| **CSS Custom Properties** | Design system | Token-based design that's easy to theme. No CSS framework dependency |
| **Vitest 4** | Unit testing | Native TypeScript, 3x faster than Jest, same API |
| **Playwright** | E2E testing | Cross-browser, built-in screenshot comparison, axe-core integration for accessibility |
| **axe-core** | Accessibility | WCAG 2.1 AA compliance validation -- enterprise requirement |

## Dashboard Pages

### 1. Command Center (Overview) -- `/`
The daily starting point. Shows cross-channel KPIs, traffic trends, channel mix, alerts, and data source health at a glance.

**Metrics:** Sessions, Organic Impressions, Email Open Rate, Pipeline Influenced, Conversion Rate, System Health

### 2. Web Performance -- `/web-performance`
Core Web Vitals, traffic analysis, device breakdown, geographic distribution, and conversion tracking.

**Data source:** Google Analytics 4 (real when connected, mock otherwise)

### 3. SEO / AEO / GEO -- `/seo`
Search rankings, impressions, CTR analysis, keyword tracking, and emerging AI search optimization metrics.

**Data source:** Google Search Console (real) + AEO/GEO mock (labeled)

### 4. Email Marketing -- `/email`
Campaign performance, automation health, subscriber engagement, and send time optimization.

**Data source:** Mailchimp-shaped mock (swappable to real Mailchimp API)

### 5. Social Media -- `/social`
Platform comparison, engagement trends, top performing content, and referral traffic analysis.

**Data source:** Social mock + GA4 referral data (real when connected)

### 6. CRM and Pipeline -- `/crm-pipeline`
Full-funnel visibility from lead to closed deal, with multi-touch attribution modeling.

**Data source:** HubSpot-shaped mock (matches target organization's CRM)

### 7. Martech Health -- `/martech-health`
System uptime, integration health, automation execution logs, data freshness, and cost tracking.

**Data source:** Aggregated from all connector `.health()` methods

## Testing Strategy

| Layer | Tool | What It Tests | When It Runs |
|---|---|---|---|
| **Unit** | Vitest | Formatters, Zod schemas, connector registry, date utilities | `npm run test` |
| **E2E** | Playwright | Pages load, KPIs render, charts initialize, navigation works | `npm run test:e2e` |
| **Accessibility** | axe-core via Playwright | WCAG 2.1 AA compliance -- zero critical/serious violations | `npm run test:e2e` |
| **Performance** | Playwright | Page load <3s, no CLS, no console errors, proper meta tags | `npm run test:e2e` |
| **Responsive** | Playwright | Sidebar hides on mobile, components adapt | `npm run test:e2e` |

### Current Test Results

```
Unit (Vitest):     27/27 passed
E2E (Playwright):  15/15 passed
Total:             42/42 green
```

## Project Structure

```
growth-dashboard/
├── src/
│   ├── pages/              # Astro pages -- 1 file = 1 route
│   ├── layouts/            # DashboardLayout (shared shell)
│   ├── components/
│   │   ├── ui/             # MetricCard, DataSourceTag, StatusBadge, AlertBanner
│   │   └── charts/         # ChartContainer (ECharts wrapper)
│   ├── connectors/         # THE ARCHITECTURAL CORE
│   │   ├── base/           # IConnector interface + Zod schemas
│   │   ├── ga4/            # Google Analytics 4 connector
│   │   ├── search-console/ # Google Search Console connector
│   │   ├── hubspot/        # HubSpot CRM connector (mock)
│   │   ├── email/          # Mailchimp connector (mock)
│   │   ├── social/         # Social media connector (mock)
│   │   ├── webflow/        # Martech health connector (mock)
│   │   └── registry.ts     # Central swap point (mock <-> real)
│   ├── styles/             # Design tokens + global styles
│   ├── utils/              # Formatters, mock generator, ECharts theme
│   └── data/snapshots/     # Static JSON data (updated by GitHub Actions)
├── tests/
│   ├── unit/               # Vitest -- schemas, formatters, registry
│   └── e2e/                # Playwright -- pages, accessibility, performance
├── CLAUDE.md               # Project rules for AI-assisted development
├── CONNECTORS.md           # Non-technical integration guide
├── .env.example            # Required environment variables
└── README.md               # This file
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm run test

# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Build for production
npm run build
```

## Design Decisions Log

### Why Astro over Next.js or plain HTML?
- **vs Next.js:** No server needed. Dashboard data is fetched at build time or via static JSON snapshots. No React overhead for what is fundamentally a data display application.
- **vs plain HTML:** Multiple pages with shared layout, component system, TypeScript, build optimization. A Director-level portfolio project needs build tooling.

### Why ECharts over Chart.js or D3?
- **vs Chart.js:** ECharts handles enterprise chart types (Sankey, funnel, heatmap, geographic) natively. Chart.js requires plugins for each.
- **vs D3:** ECharts is declarative configuration. D3 is imperative code. For a dashboard that will be maintained by non-developers via AI tools, declarative wins.

### Why Zod validation on mock data?
Mock data doesn't need validation -- real API data does. By validating mock data against the same schemas, we guarantee that when a real connector replaces a mock, the UI won't break from data shape mismatches. The tests catch schema drift before it reaches production.

### Why separate mock connector classes instead of a flag?
Each mock connector can have its own data generation logic (realistic variance, domain-specific patterns). A flag approach would centralize all mock logic, making it harder to swap individual channels independently.

### Why DataSourceTag on every KPI and chart?
Data governance. When a dashboard mixes real and simulated data, consumers must know which is which. In an enterprise context, presenting mock data without labels is a compliance risk. This is the kind of detail a CMO notices.

## Roadmap

- [x] **Phase 1** -- Foundation: Overview page, connector pattern, design system, 42 tests passing
- [ ] **Phase 2** -- Real data: GA4 + Search Console integration for existing sites
- [ ] **Phase 3** -- Remaining pages: Email, Social, CRM, Martech Health
- [ ] **Phase 4** -- QA polish: Visual regression, Lighthouse CI, full responsive audit
- [ ] **Phase 5** -- Optional: Alerts, CSV export, multi-property, embed mode

## License

Private project -- not for redistribution.
