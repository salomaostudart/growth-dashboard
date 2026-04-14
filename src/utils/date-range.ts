export type DateRangeKey = '7d' | '30d' | '90d';

export function getDefaultDateRange(range: DateRangeKey = '30d') {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const now = new Date();
  return {
    start: new Date(now.getTime() - days * 86400000),
    end: now,
    range,
  };
}
