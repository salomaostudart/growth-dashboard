# Bugs e Melhorias — Growth Dashboard

## Abertos

### Bugs

### Melhorias

## Resolvidos
- M002 — DataSourceTag duplicado em 9 arquivos → extraido para componente unico, CSS removido de todos (13/04/2026)

### Auditoria completa (13/04/2026) — 19 achados, todos resolvidos
- P0-1: astro.config.mjs sem site/output → adicionado site + output static
- P1-2: Chat sem contexto em 8/9 paginas → contexto movido pro DashboardLayout (todas as paginas)
- P1-3: Social ausente de chat-context-builder e report-generator → adicionado com dados de plataformas
- P1-4: CSP connect-src sem *.supabase.co → adicionado
- P1-5: CORS wildcard no Edge Function → restrito a growth.sal.dev.br
- P1-7: README desatualizado (9 tools/8 pages) → corrigido pra 13 tools/9 pages
- P1-9: Script ci sem type-check → adicionado astro check
- P1-10: CSP connect-src Supabase → resolvido junto com P1-4
- P2-12: src/lib/supabase.ts dead code → removido
- P2-14: Role hardcoded admin em index.astro → removido (contexto agora no layout com role analyst)
- P2-15: systemPrompt controlavel pelo cliente → server-side fixo na Edge Function
- P2-17: supabase/ sem .gitignore → criado
- P2-18: CLAUDE.md falta comandos → adicionados lint, ci, deploy, type-check
- Testes atualizados: report-generator e chat-context-builder incluem social data
- B001 — `Math.random()` em deltas → substituído por `calcDelta()` com dados reais (12/04/2026)
- M001 — Registry swap mock→real via env vars → implementado com `isEnabled()` (12/04/2026)
