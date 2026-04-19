/**
 * ECharts dark theme matching the dashboard design tokens.
 */

export const dashboardThemeLight = {
  backgroundColor: 'transparent',
  textStyle: { color: '#475569', fontFamily: 'Inter, sans-serif', fontSize: 11 },
  title: { textStyle: { color: '#0f172a' } },
  legend: { textStyle: { color: '#475569', fontSize: 11 } },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    textStyle: { color: '#0f172a', fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#e2e8f0' } },
    axisTick: { lineStyle: { color: '#e2e8f0' } },
    axisLabel: { color: '#64748b', fontSize: 10 },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
  },
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontSize: 10 },
    splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
  },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  color: ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#db2777'],
  series: {
    line: { smooth: true, lineStyle: { width: 2 }, areaStyle: { opacity: 0.08 }, symbolSize: 4 },
  },
};

export const dashboardTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#94a3b8',
    fontFamily: 'Inter, sans-serif',
    fontSize: 11,
  },
  title: {
    textStyle: { color: '#f1f5f9' },
  },
  legend: {
    textStyle: { color: '#94a3b8', fontSize: 11 },
  },
  tooltip: {
    backgroundColor: '#1a1a24',
    borderColor: '#242432',
    textStyle: { color: '#f1f5f9', fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.5); border-radius: 8px;',
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#242432' } },
    axisTick: { lineStyle: { color: '#242432' } },
    axisLabel: { color: '#8892a8', fontSize: 10 },
    splitLine: { lineStyle: { color: '#1a1a24' } },
  },
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#8892a8', fontSize: 10 },
    splitLine: { lineStyle: { color: '#1a1a24', type: 'dashed' } },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '10%',
    containLabel: true,
  },
  color: [
    '#818cf8', // indigo
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
  ],
  series: {
    line: {
      smooth: true,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.08 },
      symbolSize: 4,
    },
  },
};
