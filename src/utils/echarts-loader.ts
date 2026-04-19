/**
 * Lazy ECharts loader with IntersectionObserver.
 * Defers loading the ECharts bundle until a chart container enters the viewport.
 * Reduces initial JS parse/compile on mobile — LCP improvement.
 *
 * Usage:
 *   import { lazyInitCharts } from '../utils/echarts-loader';
 *   lazyInitCharts([
 *     { id: 'my-chart-el', setup: (echarts) => { ... } },
 *   ]);
 */

type SetupFn = (
  echarts: typeof import('./echarts-setup').default,
  theme: typeof import('./echarts-theme').dashboardTheme,
) => void;

interface ChartSpec {
  id: string;
  setup: SetupFn;
}

let echartsPromise: Promise<{
  echarts: typeof import('./echarts-setup').default;
  theme: typeof import('./echarts-theme').dashboardTheme;
}> | null = null;

function loadECharts() {
  if (!echartsPromise) {
    echartsPromise = Promise.all([import('./echarts-setup'), import('./echarts-theme')]).then(
      ([setup, themeModule]) => {
        const echarts = setup.default;
        const theme = themeModule.dashboardTheme;
        echarts.registerTheme('dashboard', theme);
        return { echarts, theme };
      },
    );
  }
  return echartsPromise;
}

export function lazyInitCharts(specs: ChartSpec[]): void {
  const pending = new Map<string, ChartSpec>(specs.map((s) => [s.id, s]));

  // Immediately init charts already in viewport; observe the rest.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = (entry.target as HTMLElement).id;
        const spec = pending.get(id);
        if (!spec) continue;
        pending.delete(id);
        io.unobserve(entry.target);

        loadECharts().then(({ echarts, theme }) => {
          spec.setup(echarts, theme);
        });
      }

      if (pending.size === 0) {
        io.disconnect();
      }
    },
    { rootMargin: '200px' }, // start loading 200px before entering viewport
  );

  for (const spec of specs) {
    const el = document.getElementById(spec.id);
    if (el) {
      io.observe(el);
    }
  }
}
