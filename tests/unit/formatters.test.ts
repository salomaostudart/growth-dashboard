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
});

describe('formatPercent', () => {
  it('formats with default decimals', () => {
    expect(formatPercent(27.6)).toBe('27.6%');
  });
  it('formats with custom decimals', () => {
    expect(formatPercent(99.999, 2)).toBe('100.00%');
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
});

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(800)).toBe('$800');
  });
  it('formats large amounts', () => {
    expect(formatCurrency(150000)).toBe('$150,000');
  });
});

describe('formatLatency', () => {
  it('formats milliseconds', () => {
    expect(formatLatency(250)).toBe('250ms');
  });
  it('formats seconds', () => {
    expect(formatLatency(1500)).toBe('1.5s');
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
});
