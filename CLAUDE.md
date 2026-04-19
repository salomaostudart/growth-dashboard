# Growth Dashboard — Regras do Projeto

> Referencia tecnica do workspace: `hq/reference/boas-praticas.md` (Sec 1.1 Python scripts, 1.3 Astro/TS, 3.8 Supabase RLS)
> **Deps:** MAINTENANCE | Referencia: boas-praticas.md | Fonte arquitetural de webscope
> **Registry:** hq/reference/dependencias.md

## O que e
Digital Growth Command Center — ferramenta de captura de metricas, automacao de registro e dashboard interativo.
Produto pessoal para unificacao de metricas de marketing digital em um unico painel.

## Stack
- **Framework:** Astro 5 + TypeScript (output estatico, zero JS desnecessario)
- **Charts:** Apache ECharts 6 (enterprise-grade, dark theme nativo)
- **Validacao:** Zod 4 (schema validation nos connectors)
- **Testes:** Vitest 4 (unit) + Playwright (E2E + acessibilidade + performance)
- **Design:** Oswald + Inter + CSS tokens
- **Linter/Formatter:** Biome (substitui eslint + prettier — Rust, 30x mais rapido)

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
npm run type-check # TypeScript type checking (astro check)
npm run lint       # Biome check (linter)
npm run format     # Biome format --write (formatter)
npm run check      # Biome check --write (lint + format juntos)
npm run ci         # type-check + test + build (pipeline completo)
```

## Deploy
- **Auto (recomendado):** Workers Builds dispara build automatico em push pra `main`.
- **Manual:** `npx wrangler deploy` (publica no Worker `growth-dashboard-worker`).
- **Rollback:** `npx wrangler rollback` (volta pro deployment anterior).
- **Logs:** `npx wrangler tail` (streaming em tempo real).
- **Pages legacy:** `npm run deploy` ainda funciona — Pages `growth-dashboard` preservado como rollback de 7-30 dias (apos TP3 cutover 18/04, dominio `growth.sal.dev.br` serve do Worker).

Config: `wrangler.jsonc` na raiz (tem `compatibility_flags: ["nodejs_compat"]` desde 18/04). Build cmd no Workers Builds = `npm run ci`.

### Build-time secrets (Workers Builds dashboard)

Configurar em Cloudflare Dashboard > Workers & Pages > growth-dashboard-worker > Settings > Builds > Environment variables (flag **Plain**, nao Secret — sao publicas por design):

| Nome | Origem | Valor |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | `.env` local | `https://<ref>.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | `.env` local | `eyJ...` (JWT anon, publica por design + RLS protege) |

Sem esses env vars, o build Astro falha com `undefined is not a valid URL` ao instanciar cliente Supabase.

Contexto completo: `hq/reference/cicd-cloudflare-roadmap-2026-04.md`.

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
- `hubspot/` — HubSpot CRM (mock HubSpot-shaped, estrutura padrao B2B SaaS)
- `email/` — Email marketing (mock Mailchimp-shaped)
- `social/` — Social media (mock LinkedIn/Meta-shaped)
- `webflow/` — Martech health (mock Webflow-shaped)

## Security
- Checklist completo: `docs/security/` (10 areas defense-in-depth)
- Secrets: nunca em codigo, usar `.env` local + `wrangler secret put` em producao
- Pre-commit: `gitleaks protect --staged` bloqueia secrets acidentais
- Supply chain: `npm audit --omit=dev` antes de cada release
- Disclosure: `SECURITY.md` na raiz (email privado, nao issue publica)
- Gitleaks `--no-verify` permitido so quando `docs/security/*.md` tem exemplos de anti-patterns em code blocks (nao sao secrets reais)

## Regras
- Nao commitar secrets (.env, service accounts)
- Mock data deve ter variancia realista (weekday/weekend, trends, spikes)
- Todo chart e KPI deve ter DataSourceTag visivel
- Acessibilidade WCAG 2.1 AA obrigatoria (axe-core no E2E)
- Biome e o linter/formatter padrao — nao usar eslint ou prettier
