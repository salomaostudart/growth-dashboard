# Connectors — Guia de Integracao

## O que sao connectors?

Connectors sao adaptadores que buscam dados de fontes externas (Google Analytics, HubSpot, Mailchimp, etc.) e os entregam ao dashboard num formato padronizado.

Cada connector implementa a mesma interface (`IConnector<T>`), o que significa que trocar uma fonte mock por uma real nao exige mudar nenhum codigo no dashboard — apenas uma variavel de ambiente.

## Como funciona

```
[Fonte de Dados] → [Connector] → [Schema Zod valida] → [Dashboard exibe]
```

Cada connector retorna:
- **data** — os dados (validados pelo schema Zod correspondente)
- **source** — `'live'`, `'mock'`, ou `'cached'`
- **fetchedAt** — quando os dados foram buscados
- **errors** — lista de erros (vazia se tudo ok)

## Connectors disponiveis

| Connector | Fonte Real | Fonte Mock | Env Var |
|---|---|---|---|
| **web** | Google Analytics 4 (Data API v1) | Trafego simulado com variancia realista | `GA4_ENABLED=true` |
| **seo** | Google Search Console (Search Analytics API) | Rankings e impressoes simulados | `GSC_ENABLED=true` |
| **email** | Mailchimp API | Campanhas e automacoes simuladas | `EMAIL_ENABLED=true` |
| **social** | LinkedIn + Twitter/X APIs | Engagement por plataforma simulado | `SOCIAL_ENABLED=true` |
| **crm** | HubSpot CRM API | Funil e pipeline simulados | `CRM_ENABLED=true` |
| **martech** | Agregacao de todos os connectors | Status de saude simulado | `MARTECH_ENABLED=true` |

## Como trocar mock por real

> **Status atual (Phase 1):** todos os connectors usam mock. O swap via env var sera implementado na Phase 2 junto com os connectors reais de GA4 e Search Console. A arquitetura ja suporta — o registry le env vars e instancia o connector correspondente.

### Passo 1 — Configurar credenciais
Copie `.env.example` para `.env` e preencha as credenciais do servico que quer conectar.

### Passo 2 — Ativar o connector
Mude a variavel de ambiente correspondente para `true`:
```env
GA4_ENABLED=true
GA4_PROPERTY_ID=123456789
```

### Passo 3 — Reiniciar o dashboard
```bash
npm run dev
```

O dashboard vai automaticamente mostrar o badge "Live GA4" (verde) em vez de "Mock" (cinza) nos cards e charts que usam esse connector.

## Como adicionar um novo connector

1. Crie uma pasta em `src/connectors/` (ex: `src/connectors/amplitude/`)
2. Implemente a interface `IConnector<T>` do arquivo `src/connectors/base/connector.interface.ts`
3. Defina o schema Zod dos dados em `src/connectors/base/connector.schema.ts`
4. Crie um mock connector (pra desenvolvimento/demo)
5. Registre no `src/connectors/registry.ts`
6. Use `getConnector('nome')` nas paginas do dashboard

Tempo estimado: ~2 horas para um connector basico com mock + real.

## Sobre os mock data

Os mocks nao sao numeros fixos. Eles geram dados com:
- **Padrao dia/semana** — trafego cai no fim de semana
- **Tendencia sazonal** — crescimento leve ao longo do tempo
- **Spikes aleatorios** — 5% de chance de pico num dia qualquer
- **Variancia por canal** — cada plataforma social tem metricas diferentes

Isso torna o dashboard credivel mesmo com dados simulados. O gerador esta em `src/utils/mock-generator.ts`.
