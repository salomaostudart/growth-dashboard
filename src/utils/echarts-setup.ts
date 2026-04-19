import {
  BarChart,
  FunnelChart,
  HeatmapChart,
  LineChart,
  PieChart,
  SankeyChart,
} from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
/**
 * ECharts tree-shaking setup.
 * Import only the components used across the dashboard.
 * This reduces bundle size from ~1MB to ~300-400KB.
 */
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  FunnelChart,
  SankeyChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

export default echarts;
