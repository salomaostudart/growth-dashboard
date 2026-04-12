import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, formatDelta, formatDuration, formatCurrency, formatLatency, timeAgo } from '../../src/utils/formatters';

describe('formatNumber', () => {
  it('formats millions', () => {
    expect(formatNumber(1_500_000)).toBe('1.5M');
  });
  it('formats thousands', () => {
    expect(formatNumber(28_200)).toBe('28.2K');
  });
  it('formats small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
  // Edge cases
  it('boundary: 999 stays as small number', () => {
    expect(formatNumber(999)).toBe('999');
  });
  it('boundary: 1000 formats as K', () => {
    expect(formatNumber(1000)).toBe('1.0K');
  });
  it('boundary: 999999 formats as K', () => {
    expect(formatNumber(999999)).toBe('1000.0K');
  });
  it('boundary: 1000000 formats as M', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M');
  });
});

describe('formatPercent', () => {
  it('formats with default decimals', () => {
    expect(formatPercent(27.6)).toBe('27.6%');
  });
  it('formats with custom decimals', () => {
    expect(formatPercent(99.999, 2)).toBe('100.00%');
  });
  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });
  it('formats 100', () => {
    expect(formatPercent(100)).toBe('100.0%');
  });
});

describe('formatDelta', () => {
  it('formats positive delta with +', () => {
    expect(formatDelta(12.4)).toBe('+12.4%');
  });
  it('formats negative delta', () => {
    expect(formatDelta(-2.1)).toBe('-2.1%');
  });
  it('formats zero delta', () => {
    expect(formatDelta(0)).toBe('0.0%');
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(45)).toBe('45s');
  });
  it('formats minutes and seconds', () => {
    expect(formatDuration(185)).toBe('3m 5s');
  });
  it('formats exactly 60s as minutes', () => {
    expect(formatDuration(60)).toBe('1m 0s');
  });
  it('formats large durations', () => {
    expect(formatDuration(3600)).toBe('60m 0s');
  });
});

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(800)).toBe('$800');
  });
  it('formats large amounts', () => {
    expect(formatCurrency(150000)).toBe('$150,000');
  });
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatLatency', () => {
  it('formats milliseconds', () => {
    expect(formatLatency(250)).toBe('250ms');
  });
  it('formats seconds', () => {
    expect(formatLatency(1500)).toBe('1.5s');
  });
  it('boundary: 999ms stays as ms', () => {
    expect(formatLatency(999)).toBe('999ms');
  });
  it('boundary: 1000ms formats as seconds', () => {
    expect(formatLatency(1000)).toBe('1.0s');
  });
});

describe('timeAgo', () => {
  it('formats just now', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });
  it('formats minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });
  it('formats hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe('2h ago');
  });
  it('formats days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3d ago');
  });
});
