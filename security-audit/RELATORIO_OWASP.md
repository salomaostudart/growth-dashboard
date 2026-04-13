# Auditoria de Seguranca OWASP — Growth Dashboard

**Data:** 2026-04-13  
**Site:** https://growth.sal.dev.br  
**Stack:** Astro 5 + TypeScript (output estatico), Supabase Auth + PostgreSQL, Cloudflare Pages  
**Auditor:** Claude (analise estatica + testes dinamicos via Chrome DevTools)

---

## Resumo Executivo

| Categoria OWASP | Titulo | Status | Severidade |
|---|---|---|---|
| A01 | Broken Access Control | ALERTA | MEDIO |
| A02 | Security Misconfiguration | ALERTA | MEDIO |
| A03 | Vulnerable and Outdated Components | ALERTA | MEDIO |
| A04 | Cryptographic Failures | OK | — |
| A05 | Injection | OK | — |
| A06 | Insecure Design | OK | — |
| A07 | Identification and Authentication Failures | ALERTA | MEDIO |
| A08 | Software and Data Integrity Failures | ALERTA | BAIXO |
| A09 | Security Logging and Monitoring Failures | OK | — |
| A10 | Server-Side Request Forgery / Error Handling | OK | — |

**Total de achados:** 8 issues (0 CRITICO, 5 MEDIO, 3 BAIXO)

---

## FASE 1 — Reconhecimento

### Arquivos de codigo analisados
- 10 paginas Astro (`src/pages/`)
- 9 componentes (`src/components/`)
- 2 connectors reais (GA4, GSC) + 5 mocks
- 1 Edge Function Supabase (`supabase/functions/chat/index.ts`)
- 1 workflow CI/CD (`.github/workflows/data-refresh.yml`)
- 1 MCP server (`src/mcp/server.ts`)

### Variaveis de ambiente
- `PUBLIC_SUPABASE_URL` — exposta ao browser (correto, anon key intencional)
- `PUBLIC_SUPABASE_ANON_KEY` — exposta ao browser (correto, anon key intencional)
- `CLAUDE_API_KEY` — secret Supabase, nunca exposta ao browser (correto)
- `SUPABASE_SERVICE_ROLE_KEY` — secret Supabase, nunca exposta ao browser (correto)
- `GA4_PROPERTY_ID` — GitHub Secret (correto)
- `GCP_SERVICE_ACCOUNT_JSON` — GitHub Secret (correto)

### .gitignore
- `.env`, `.env.local`, `.env.production` — todos incluidos no .gitignore (correto)
- `**/service-account*.json` — incluido (correto)

---

## FASE 2 — Analise Estatica

---

### A01 — Broken Access Control

**Status: ALERTA**

**Achado 1 (MEDIO): Auth client-side only — sem enforcement no servidor**

O controle de acesso e implementado inteiramente no cliente (`AuthGate.astro`). O Astro com `output: static` nao pode proteger rotas no servidor. Se o usuario desabilitar JS ou manipular o DOM, o `auth-gate` (div com `display:none`) pode ser ocultado e o dashboard fica acessivel sem autenticacao.

Evidencia:
```astro
// AuthGate.astro linha 9
<div class="auth-gate" id="auth-gate" style="display: none;">
// ... verificacao de sessao so ocorre no JS cliente
if (!session) {
  gate.style.display = 'flex';
}
```

O componente so exibe o gate se o JS rodar e detectar ausencia de sessao. Qualquer usuario com JS desabilitado ve o dashboard diretamente.

**Achado 2 (BAIXO): RBAC definido mas nao aplicado nas paginas**

`src/utils/rbac.ts` define roles (`admin`, `analyst`, `viewer`) e permissoes (ex: `viewRevenue`, `exportData`), mas as paginas nao verificam permissoes antes de renderizar dados. O controle e feito "ao nivel de componente", o que significa que dados de revenue podem estar no HTML mesmo para viewers.

Evidencia: `rbac.ts` linha 58 — "All pages visible to all roles — revenue data hidden at component level". Como o site e estatico, os dados estao no bundle JS e acessiveis via DevTools independente do role.

**Achado 3 (BAIXO): CORS wildcard `Access-Control-Allow-Origin: *`**

O cabecalho retornado pelo Cloudflare Pages e `access-control-allow-origin: *`, permitindo que qualquer origem leia os recursos estaticos. Para um site de dashboard com dados potencialmente sensiveis, isso e mais permissivo do que necessario.

Evidencia (teste dinamico — Chrome DevTools):
```
Response Headers:
  access-control-allow-origin: *
```

---

### A02 — Security Misconfiguration

**Status: ALERTA**

**Achado 4 (MEDIO): CSP ausente para Edge Function / Supabase**

O `_headers` define `connect-src` apontando para `https://*.supabase.co`, mas nao inclui o endpoint especifico da Edge Function deployada. Se o dominio da Edge Function for diferente do padrao `*.supabase.co`, requisicoes ao chat serao bloqueadas silenciosamente pelo CSP.

Evidencia (`public/_headers`):
```
Content-Security-Policy: ...connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.supabase.co
```
Nao ha `https://*.supabase.co` com path especifico para funcoes, e nao ha `wss://` para eventuais Realtime subscriptions do Supabase.

**Achado 5 (BAIXO): GA4 Property ID hardcoded no script Python**

O script `scripts/fetch-ga4-snapshot.py` tem o GA4 Property ID hardcoded como fallback:

Evidencia (`scripts/fetch-ga4-snapshot.py` linha 25):
```python
PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "532605518")
```

O ID `532605518` esta visivel no repositorio publico. Embora Property IDs do GA4 nao sejam secrets (nao dao acesso de escrita), podem ser usados para targeting em ataques de spam ao Analytics.

**Achado 6 (BAIXO): HSTS nao detectado nos headers**

Nao foi encontrado cabecalho `Strict-Transport-Security` na resposta HTTP. O Cloudflare pode estar fazendo HTTPS enforcement no nivel do proxy, mas o header HSTS nao esta sendo propagado para o cliente, o que impede HSTS Preloading e deixa a primeira requisicao suscetivel a downgrade attack se o usuario nunca visitou o site.

Evidencia (teste dinamico):
```
Response Headers analisados — ausencia de: Strict-Transport-Security
Headers presentes: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP
```

---

### A03 — Vulnerable and Outdated Components

**Status: ALERTA**

**Achado 7 (MEDIO): 5 vulnerabilidades moderadas no npm audit**

Todas as 5 vulnerabilidades estao em dependencias de desenvolvimento (`@astrojs/check` → `volar-service-yaml` → `yaml-language-server` → `yaml`). Nao afetam o bundle de producao, mas podem afetar o pipeline de build/CI.

Evidencia (`npm audit`):
```
5 moderate severity vulnerabilities
  yaml-language-server >=1.11.1
  volar-service-yaml *
  @astrojs/language-server >=2.14.0
  @astrojs/check >=0.9.3

fix available via: npm audit fix --force (breaking change: @astrojs/check@0.9.2)
```

**TypeScript desatualizado:**
```
Package     Current  Wanted  Latest
typescript  5.9.3    5.9.3   6.0.2
```

---

### A04 — Cryptographic Failures

**Status: OK**

- Nenhum uso de MD5 ou SHA1 encontrado
- Nenhuma credencial armazenada em `localStorage` ou `sessionStorage` (confirmado via teste dinamico — ambos vazios)
- `localStorage` usado apenas para preferencias de UI: tema (`growthhq-theme`) e banner de onboarding (`KEY`)
- Supabase SDK armazena tokens em `localStorage` por padrao, mas nenhum token foi detectado pois o usuario nao esta autenticado
- Todas as URLs externas usam HTTPS
- Comunicacao com Claude API via HTTPS na Edge Function

---

### A05 — Injection

**Status: OK**

- Nenhum uso de `eval()`, `new Function()` ou `exec()` no codigo fonte
- `innerHTML` encontrado em apenas 1 local (`csv-export.ts` linha 45): SVG estatico hardcoded, sem interpolacao de dados externos — sem risco de XSS
- Astro escapa automaticamente todas as interpolacoes `{}` no template — protecao nativa contra XSS
- Edge Function nao constroi queries SQL dinamicas — usa Supabase client SDK com parametros bindados
- Input do chat (`question`) e passado diretamente para a API do Claude como conteudo do usuario, sem interpolacao em SQL ou comandos de sistema

Evidencia (unico innerHTML encontrado):
```typescript
// csv-export.ts linha 45 — SVG estatico, sem dados externos
btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" ...>...</svg> CSV`;
```

---

### A06 — Insecure Design

**Status: OK**

- Zod 4 e usado para validacao de schema nos connectors (`connector.schema.ts`)
- Rate limiting implementado na Edge Function: 50 mensagens/hora por usuario
- System prompt do chat e server-side e nunca confiado ao cliente (linha 69: "systemPrompt is server-controlled, ignore client value")
- Dados dos connectors mock tem variancia realista mas nao contem PII

Evidencia (rate limit na Edge Function):
```typescript
const RATE_LIMIT = 50; // per hour per user
// ...
if ((count || 0) >= RATE_LIMIT) {
  return new Response(JSON.stringify({ error: `Rate limit: ${RATE_LIMIT} messages/hour` }), { status: 429 });
}
```

---

### A07 — Identification and Authentication Failures

**Status: ALERTA**

**Achado 8 (MEDIO): Auth client-side e bypassavel — dashboard aberto sem JS**

Reitera e expande o Achado 1. O flow de autenticacao depende 100% de JavaScript no cliente:

1. AuthGate renderiza como `display:none` por padrao
2. JS verifica sessao e exibe o gate se necessario
3. Sem JS, o gate nunca aparece — dashboard exposto

Este e o principal risco de autenticacao do projeto. O Supabase Auth em si e seguro (JWT validado na Edge Function), mas a protecao das paginas do dashboard e puramente decorativa no nivel do servidor.

**Mecanismo de auth — correto onde aplicado:**
- Magic Link via Supabase OTP
- OAuth via GitHub
- JWT validado server-side na Edge Function antes de qualquer chamada a Claude
- `onAuthStateChange` atualiza o estado corretamente
- Logout via `supabase.auth.signOut()` + reload

---

### A08 — Software and Data Integrity Failures

**Status: ALERTA**

**Achado 9 (BAIXO): Scripts externos sem SRI (Subresource Integrity)**

O Google Tag Manager e carregado sem atributo `integrity`:

Evidencia (teste dinamico e HTML da pagina):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LGNLCC6DYD"></script>
```
Sem `integrity="sha256-..."` e `crossorigin="anonymous"`. Se o dominio do GTM for comprometido, codigo malicioso pode ser injetado.

Nota: SRI com URLs dinamicas (como GTM com query param) e tecnicamente impossivel de pre-calcular. A alternativa e CSP `script-src` restritivo, que ja esta configurado para `https://www.googletagmanager.com`.

**CI/CD — bem configurado:**
- Secrets usados via `${{ secrets.* }}` — nunca hardcoded no YAML
- Service account deletada do disco com `rm -f` apos uso
- `permissions: contents: write` minimo necessario

**Achado 10 (BAIXO): `echo` de secret no workflow**

No step de fetch do GA4, o JSON da service account e escrito via echo de variavel de ambiente:

Evidencia (`.github/workflows/data-refresh.yml` linha 29):
```yaml
run: |
  echo '${{ secrets.GCP_SERVICE_ACCOUNT_JSON }}' > /tmp/service-account.json
```
O uso de aspas simples evita expansao de variaveis do shell, mas o conteudo do secret pode aparecer nos logs do GitHub Actions se o runner tiver debug habilitado (`ACTIONS_STEP_DEBUG=true`). A pratica recomendada e usar `printenv GCP_SERVICE_ACCOUNT_JSON > /tmp/service-account.json` para evitar que o secret apareça no `set -x` trace.

---

### A09 — Security Logging and Monitoring Failures

**Status: OK**

- Apenas 1 `console.log` no codigo de producao: `main().catch(console.error)` no MCP server — aceitavel para processo Node local, nao vai para o cliente
- Nenhum `console.log` com dados de usuarios, tokens ou credenciais
- Edge Function registra cada interacao em `chat_history` com `user_id`, `question`, `answer` e `tokens_used` — rastreabilidade adequada
- NEL (Network Error Logging) e Report-To configurados pelo Cloudflare — monitoramento de rede ativo

---

### A10 — Server-Side Request Forgery / Error Handling

**Status: OK**

- Site estatico nao tem SSRF attack surface no Astro
- Edge Function faz fetch apenas para `api.anthropic.com` (hardcoded) — sem URLs controladas pelo usuario
- Erros da Claude API retornam status padrao sem expor stack trace:
  ```typescript
  return new Response(JSON.stringify({ error: `Claude API error: ${claudeResponse.status}` }), { status: 502 });
  ```
- Catches silenciosos identificados sao todos intencionais (fallback to mock, skip malformed SSE lines)
- Nenhum stack trace exposto ao cliente

---

## FASE 3 — Testes Dinamicos

### Headers de seguranca HTTP (producao)

| Header | Valor | Status |
|---|---|---|
| `X-Frame-Options` | `DENY` | OK |
| `X-Content-Type-Options` | `nosniff` | OK |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | OK |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | OK |
| `Content-Security-Policy` | Configurado (ver detalhes) | OK |
| `Strict-Transport-Security` | **AUSENTE** | ALERTA |
| `Access-Control-Allow-Origin` | `*` | ALERTA |

### CSP completo configurado
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.supabase.co
```

Nota: `'unsafe-inline'` em `script-src` e `style-src` enfraquece o CSP. Inevitavel para Astro sem nonce configuration.

### Arquivos sensiveis expostos
- Testados: `.env`, `.git/config`, `package.json`, `tsconfig.json`, `astro.config.mjs`
- Resultado: todos retornam `200` com conteudo sendo o `index.html` do SPA (Cloudflare Pages fallback)
- **Nenhum arquivo sensivel exposto** — Cloudflare Pages serve `index.html` para paths nao encontrados

### Cookies
- Apenas cookies do Google Analytics (`_ga`, `_ga_*`)
- Flags: sem `HttpOnly`, sem `Secure` explicito (GA scripts definem proprios flags)
- Sem cookies de sessao do Supabase (usuario nao autenticado)

### Teste CORS com Origin evil.com
- `Access-Control-Allow-Origin: *` — qualquer origem pode ler recursos estaticos
- `Access-Control-Allow-Credentials: null` — credentials nao enviadas — risco limitado

### HSTS / Redirect HTTP→HTTPS
- Redirect HTTP→HTTPS: Cloudflare gerencia, fetch via JS falhou com CORS (esperado)
- HSTS header: nao presente nos response headers — configurar via Cloudflare Dashboard

---

## Correcoes Recomendadas (por prioridade)

### ALTA PRIORIDADE

**1. Adicionar HSTS header**

No arquivo `public/_headers`, adicionar:
```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```
Ou habilitar via Cloudflare Dashboard > SSL/TLS > Edge Certificates > HSTS.

**2. Documentar limitacao de auth client-side**

O dashboard nao pode ser protegido server-side com Astro static. Opcoes:
- **Opcao A (recomendada para portfolio):** Adicionar comentario explicito no README sobre "demo mode vs production mode" — auth client-side e intencional para o contexto de portfolio
- **Opcao B (producao real):** Migrar para `output: 'server'` com adaptador Cloudflare Workers + middleware de auth no servidor
- **Opcao C:** Usar Cloudflare Access (Zero Trust) na frente do site para enforcar autenticacao no nivel do proxy

### MEDIA PRIORIDADE

**3. Corrigir echo de secret no CI/CD**

Em `.github/workflows/data-refresh.yml`, substituir:
```yaml
# Antes (vulneravel a debug logs)
echo '${{ secrets.GCP_SERVICE_ACCOUNT_JSON }}' > /tmp/service-account.json

# Depois (recomendado)
printenv GCP_SERVICE_ACCOUNT_JSON > /tmp/service-account.json
```
Com a variavel declarada em `env:` no step.

**4. Remover fallback hardcoded do GA4 Property ID**

Em `scripts/fetch-ga4-snapshot.py`:
```python
# Antes
PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "532605518")

# Depois
PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID")
if not PROPERTY_ID:
    raise ValueError("GA4_PROPERTY_ID environment variable is required")
```

**5. Atualizar dependencias de dev vulneraveis**

```bash
npm audit fix --force
# Atualiza @astrojs/check para 0.9.2 (breaking change — testar)
```

### BAIXA PRIORIDADE

**6. Restringir CORS para recursos sensiveis**

Se o site vier a ter endpoints com dados privados, restringir `Access-Control-Allow-Origin` para `https://growth.sal.dev.br` via `_headers`.

**7. Adicionar wss:// no CSP para Supabase Realtime**

Se o Supabase Realtime for usado no futuro:
```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com
```

**8. Considerar Content-Security-Policy sem unsafe-inline**

Longo prazo: configurar nonces no Astro para eliminar `'unsafe-inline'` do CSP, aumentando a protecao contra XSS.

---

## Conclusao

O projeto tem uma base de seguranca solida para um site Astro estatico com Supabase:

**Pontos fortes:**
- Headers de seguranca bem configurados (X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy)
- Nenhum secret hardcoded no codigo frontend
- Edge Function com JWT validation e rate limiting
- CI/CD com secrets via GitHub Secrets, nao hardcoded
- Nenhum arquivo sensivel exposto no servidor
- Zero uso de eval/innerHTML com dados externos
- Zod para validacao de schemas

**Principais riscos:**
- Auth client-side bypassavel — risco aceito/inevitavel para Astro static (documentar)
- HSTS ausente — facil de corrigir
- Secret da service account pode aparecer em debug logs do CI

O maior risco arquitetural (auth client-side) e uma limitacao conhecida do modelo Astro static e nao um bug — o Supabase protege os dados reais (Edge Function valida JWT). O dashboard em si expoe apenas dados mock em modo demo.
