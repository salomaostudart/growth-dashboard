# Growth Dashboard — Regras do Projeto

## O que e
Digital Growth Command Center — ferramenta de captura de metricas, automacao de registro e dashboard interativo.
Serve como portfolio tecnico, prova de competencia e template reutilizavel para a vaga de Director of Digital Growth & Marketing Systems na Demo Enterprise.

## Stack
- **Framework:** Astro 5 + TypeScript (output estatico, zero JS desnecessario)
- **Charts:** Apache ECharts 6 (enterprise-grade, dark theme nativo)
- **Validacao:** Zod 4 (schema validation nos connectors)
- **Testes:** Vitest 4 (unit) + Playwright (E2E + acessibilidade + performance)
- **Design:** Oswald + Inter (mesmas fontes da Demo Enterprise) + CSS tokens

## Arquitetura
Connector Pattern — cada fonte de dados implementa `IConnector<T>`.
- Swap mock → real = mudar 1 env var no `src/connectors/registry.ts`
- Schemas Zod validam dados em runtime
- `DataSourceTag` em toda KPI mostra "Live" ou "Mock"

## Comandos
```bash
npm run dev        # Dev server (localhost:4321)
npm run build      # Build estatico
npm run test       # Unit tests (Vitest)
npm run test:e2e   # E2E + acessibilidade + performance (Playwright)
```

## Testes
Rodar unit tests antes de qualquer implementacao. Se falhar, corrigir primeiro.
- `tests/unit/` — formatters, schemas Zod, connector registry
- `tests/e2e/` — paginas carregam, KPIs renderizam, acessibilidade WCAG 2.1 AA, performance

## Commits
- Prefixos: `feat:` `fix:` `docs:` `test:` `chore:` `refactor:`
- Atomicos, descritivos
- Sempre rodar `npm run test` antes de commitar

## Estrutura de connectors
Cada canal tem sua pasta em `src/connectors/`:
- `base/` — interface e schemas compartilhados
- `ga4/` — Google Analytics 4
- `search-console/` — Google Search Console
- `hubspot/` — HubSpot CRM (mock HubSpot-shaped, mesma estrutura da Demo Enterprise)
- `email/` — Email marketing (mock Mailchimp-shaped)
- `social/` — Social media (mock LinkedIn/Meta-shaped)
- `webflow/` — Martech health (mock Webflow-shaped)

## Regras
- Nao commitar secrets (.env, service accounts)
- Mock data deve ter variancia realista (weekday/weekend, trends, spikes)
- Todo chart e KPI deve ter DataSourceTag visivel
- Acessibilidade WCAG 2.1 AA obrigatoria (axe-core no E2E)
