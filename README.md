# Digital Growth Command Center

A comprehensive metrics capture, automation, and interactive dashboard for digital growth teams. Built as a production-ready template deployable for any organization's marketing technology stack.

**Live:** [growth.sal.dev.br](https://growth.sal.dev.br)

## Why This Project Exists

Modern digital growth requires visibility across multiple channels — website, SEO, email, social media, CRM, and the marketing technology stack itself. Most dashboards are either too generic (Google Analytics alone) or too expensive (enterprise BI tools).

This project solves that by providing:
- **Unified cross-channel view** — all digital metrics in one place
- **Connector pattern** — swap data sources without changing dashboard code
- **Real + mock data** — works with live APIs and realistic simulated data
- **MCP Server** — AI-queryable interface for Claude Code
- **Enterprise-grade quality** — accessibility, performance, and testing built in

## Architecture

```
+--------------------------------------------------------------+
|                        Dashboard UI                          |
|  9 pages: Overview, Web, SEO, Email, Social, CRM, Channel   |
|  Flow, Martech, About — KPIs, charts, tables, AI chat       |
+-------------------------------+------------------------------+
                                |
+-------------------------------v------------------------------+
|              Connector Registry (registry.ts)                |
|         Env var switches each channel mock <-> real          |
+--+------+------+------+------+------+---+--------------------+
   |      |      |      |      |      |   |
+--v--++--v--++--v--++--v--++--v--++--v--++--v--+
| GA4 || GSC ||Email||Soci-|| CRM ||Mart-|| MCP |
|(live||(live||(mock)||al   ||(mock)||ech  ||Srvr|
|+mock)||+mock)||    ||(mock)||    ||(mock)||(9  |
+-----++-----++-----++-----++-----++-----+|tool)|
   |      |      |      |      |      |  +-----+
+--v------v------v------v------v------v--------+
|              Zod Schema Validation           |
|    Every response validated before UI        |
+----------------------------------------------+
```

### Key Architectural Decisions

- **Connector Pattern** — `IConnector<T>` interface. Adding a source = implementing one interface. Swapping mock to real = one env var.
- **Snapshot Strategy** — Python scripts fetch GA4/GSC data, GitHub Actions commits JSON daily. Zero API calls at build time.
- **MCP Server** — 13 tools (9 read + 4 write) expose dashboard data to AI assistants via stdio.
- **Insights Engine** — 22 rule-based checks (no LLM). Transparent and auditable.

See [CONNECTORS.md](./CONNECTORS.md) for the integration guide.

## Tech Stack

| Technology | Role | Why |
|---|---|---|
| **Astro** | Framework | Static output, TypeScript native, zero JS unless opted in |
| **Apache ECharts** | Charts | Enterprise-grade, dark+light themes, heatmaps/Sankey/funnel |
| **Zod** | Validation | Runtime schema validation on connector responses |
| **MCP SDK** | AI interface | 13 tools queryable from Claude Code |
| **Vitest** | Unit tests | Native TS, fast |
| **Playwright + axe-core** | E2E + a11y | Cross-browser, WCAG 2.1 AA |

## Dashboard Pages

| Page | Route | Features |
|---|---|---|
| **Command Center** | `/` | Cross-channel KPIs, traffic trend, channel mix, automated insights, onboarding |
| **Web Performance** | `/web-performance` | Sessions, users, bounce rate, device breakdown, top pages |
| **SEO / AEO / GEO** | `/seo` | Impressions, clicks, position history, top queries |
| **Email Marketing** | `/email` | Open/click rates, send time heatmap, campaigns, automations |
| **Social Media** | `/social` | Followers, engagement, referral traffic by platform |
| **CRM & Pipeline** | `/crm-pipeline` | Conversion funnel, lead velocity, channel attribution, CAC |
| **Martech Health** | `/martech-health` | System uptime, maturity score, automation success, costs |
| **About** | `/about` | Case study, architecture, multi-tenant guide |

## Features

- **Light/Dark mode** — toggle with localStorage persistence
- **Command Palette** — Ctrl+K / Cmd+K fuzzy search
- **Export CSV** — download any table as CSV
- **PWA** — offline support via Service Worker
- **Tooltips** — hover ? icons for metric explanations
- **Skeleton loaders** — pulse animation while charts render
- **Webhook alerts** — configurable thresholds, Slack-compatible
- **Prefetch** — hover navigation links for instant page loads

## Testing

```
Unit (Vitest):     71 passed
E2E specs:         38 written (9 pages load + KPIs + charts + accessibility WCAG 2.1 AA)
```

```bash
npm run test        # Unit tests
npm run test:e2e    # E2E + accessibility (starts dev server)
npm run ci          # Unit + build
```

## Quick Start

```bash
npm install
npm run dev         # localhost:4321
npm run build       # Static output in dist/
npm run deploy      # Build + deploy to Cloudflare Pages
```

## Multi-tenant

Fork this repo, update mock data to match your stack, add real connectors for your tools, deploy. The connector pattern makes swapping data sources trivial.

## License

Private project — not for redistribution.
