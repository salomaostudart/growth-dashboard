# DEVLOG — Growth Dashboard

Digital Growth Command Center — log de desenvolvimento.

---

## 2026-04-12 — Dia 1: Do zero a producao em 7 horas

### Sessao 1 (16h-18h30) — Setup + Fases 1-2 parcial

**Fase 1 — Dashboard base** (16:06-17:06)
- Projeto Astro 5 + TypeScript criado do zero
- Connector pattern implementado (interface `IConnector<T>`, schemas Zod, registry com swap mock/real)
- Pagina Overview com 6 KPIs, 2 charts ECharts (traffic trend + channel mix donut)
- 42 testes (unit + E2E + acessibilidade WCAG 2.1 AA + performance)
- Repo privado GitHub criado e pushado

**Auditoria Fase 1** (17:06-18:21)
- 17 correcoes: charts usando dados do servidor em vez de client-side random, 6 stubs, RNG isolado, schema validation, ESLint/Prettier config, design tokens
- 56 testes verdes pos-auditoria

### Sessao 2 (20h-23h30) — Fases 2-6 + Auditoria completa

**Fase 2 — Dados reais** (20:15-20:28)
- GA4 property criada (G-LGNLCC6DYD, property 532605518)
- gtag.js adicionado em 6 sites (portfolio + 4 landings + dashboard)
- Connectors reais GA4 + Search Console (snapshot-based via service account)
- Paginas Web Performance (6 KPIs + 2 charts + tabela) e SEO (4 KPIs + 2 charts + 2 tabelas)
- Favicon + og:image custom

**Fase 3 — Paginas de canal** (20:28-21:27)
- 4 paginas novas: Email Marketing, Social Media, CRM/Pipeline, Martech Health
- Motor de insights automaticos (22 regras de deteccao)
- Tooltips de explicabilidade em KPIs
- Skeleton loaders + prefetch de dados
- Charts responsivos para mobile

**Fase 4 — MCP Server** (21:27-21:42)
- MCP Server com 9 tools read-only
- Interface IA para consultar metricas via Claude Code
- Tools: get_web_metrics, get_seo_metrics, get_email_metrics, get_social_metrics, get_crm_metrics, get_martech_health, get_alerts, get_insights, get_executive_summary

**Fase 5 — UX avancado** (21:42-22:17)
- Command Palette (Ctrl+K) com busca fuzzy
- Pagina /about (case study do projeto)
- Onboarding banner para primeira visita
- E2E cobrindo 7 paginas
- Deploy em Cloudflare Pages: growth.sal.dev.br (migrou de Vercel pra CF)

**Fase 6 — Polish** (22:17-22:24)
- Light mode toggle (persiste em localStorage)
- PWA com Service Worker (offline)
- Export CSV de tabelas
- Webhook alerts inteligentes

**Auditoria final** (22:24-23:01)
- Rodada 1: 28 correcoes (6 P0, 16 P1, 6 P2) — service-account movido pra ~/.credentials/, bounce rate delta, div/zero guard, CSP headers, 27 testes novos
- Rodada 2: 8 P2 restantes — OnboardingBanner global, sidebar, tooltip overflow, calcDelta null, README, manifest

**Planejamento Fase 7** (23:01-23:30)
- 4 features avancadas definidas: Cross-channel Sankey, Auth+RBAC (Supabase), MCP write tools, IA conversacional
- Decisao: Supabase em vez de Cloudflare D1/Access (Auth+RLS+Edge Functions integrados)
- Plano detalhado aprovado (~1950 linhas estimadas)

### Resultado do dia
- 13 commits, 6 fases completas
- 71 unit tests + 38 E2E specs — todos verdes
- 23/24 GitHub issues fechadas (#19 CI/CD bloqueado — Actions disabled na conta)
- Deploy em producao: growth.sal.dev.br
- Stack: Astro 5, ECharts 6, Zod 4, Vitest, Playwright, Cloudflare Pages

### Decisoes arquiteturais
| Decisao | Contexto |
|---|---|
| Cloudflare Pages > Vercel | sal.dev.br ja no CF, evita conta extra |
| Supabase > CF D1/Access | Auth+RLS+Edge Functions, conta existente |
| Insights por regras > LLM | Sem custo, deterministico, auditavel |
| Mock HubSpot-shaped | Estrutura padrao B2B SaaS |
| Snapshot-based connectors | GA4/GSC reais via service account, JSON estatico |
| calcDelta retorna null quando first=0 | Evita delta 0% enganoso |

### Bloqueios
- **GitHub Actions disabled** na conta — ticket aberto no suporte. Impede CI/CD e data-refresh automatico
- **M002 (P2):** DataSourceTag duplicado entre componentes — nao bloqueia

---

## 2026-04-13 — Dia 2: Fase 7 completa (4 blocos)

### Sessao 4 (00:00-00:50) — Fase 7 inteira

**Bloco 1: Cross-channel Sankey** (00:00-00:12)
- `sankey-transformer.ts` — converte channelMix (%) + channelAttribution em ECharts Sankey
- Pagina `/cross-channel` com 6 KPIs + Sankey chart + tabela Channel Performance
- Nav + Command Palette atualizados ("Channel Flow")
- 14 testes novos

**Bloco 2: Supabase + Auth + RBAC** (00:12-00:45)
- `@supabase/supabase-js` instalado
- `schema.sql` — 4 tabelas, triggers, RLS policies completas
- `src/lib/supabase.ts` — client singleton com graceful fallback (demo mode sem config)
- `src/utils/rbac.ts` — 3 roles (admin/analyst/viewer), 7 permissoes, helpers
- `AuthGate.astro` — magic link + GitHub OAuth, tela de login integrada
- `RoleBadge.astro` — exibe role + email + logout no sidebar
- 11 testes RBAC

**Bloco 3: MCP Tools de Escrita** (00:45-00:47)
- 4 tools novas no MCP Server (total: 13 tools)
  - `set_alert_threshold` — cria/atualiza alertas, persiste em JSON local
  - `clear_alerts` — desativa alertas (todos ou por metrica)
  - `generate_report` — relatorio executivo markdown completo
  - `manage_users` — lista roles e permissoes
- `report-generator.ts` — gera markdown com todas as secoes (web, SEO, email, CRM, martech, insights)
- 10 testes report generator

**Bloco 4: IA Conversacional** (00:47-00:50)
- Edge Function `supabase/functions/chat/index.ts` — proxy Claude API (Haiku)
  - Auth JWT, rate limit 50/h, streaming SSE, historico no banco
- `chat-context-builder.ts` — serializa dados em formato compacto (~500 tokens)
  - Filtra dados sensiveis por role (viewer nao ve revenue/CAC)
- `chat-system-prompt.ts` — prompt role-aware
- `ChatPanel.astro` — widget flutuante com exemplos clicaveis
- 8 testes chat context

### Resultado
- 114 testes verdes (43 novos na Fase 7)
- 9 paginas, build limpo
- 13 MCP tools (9 read + 4 write)
- Auth + RBAC + Chat prontos — ativar com env vars do Supabase

### Pendente para ativar
- Criar projeto Supabase + executar schema.sql
- Configurar `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` em .env
- Deploy Edge Function: `supabase functions deploy chat`
- Set secret: `supabase secrets set CLAUDE_API_KEY=<sua-chave-anthropic>`
