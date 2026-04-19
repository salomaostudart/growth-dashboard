// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://growth.sal.dev.br',
  output: 'static',
  prefetch: {
    defaultStrategy: 'hover',
    prefetchAll: false,
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Isolate ECharts into its own chunk so it can be loaded lazily
            // via dynamic import() in echarts-loader.ts (IntersectionObserver pattern).
            // Without this, Vite merges ECharts (~700KB) into a shared chunk
            // that is eagerly loaded on every page, causing LCP 6186ms on mobile.
            if (id.includes('echarts') || id.includes('zrender')) {
              return 'echarts';
            }
          },
        },
      },
    },
  },
});
