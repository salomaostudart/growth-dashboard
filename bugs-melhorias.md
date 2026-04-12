# Bugs e Melhorias — Growth Dashboard

## Abertos

### Bugs

### Melhorias
- M002 — `DataSourceTag.astro` e `MetricCard.astro` duplicam implementação do badge de source. Extrair para componente único. **P2**

## Resolvidos
- B001 — `Math.random()` em deltas → substituído por `calcDelta()` com dados reais (12/04/2026)
- M001 — Registry swap mock→real via env vars → implementado com `isEnabled()` (12/04/2026)
