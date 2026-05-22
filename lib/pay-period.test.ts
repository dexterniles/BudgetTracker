import { describe, expect, it } from 'vitest';
import { getCurrentPayPeriod, getNextNPayPeriods, getPayPeriodForDate } from './pay-period';

describe('pay-period', () => {
  const anchor = '2026-05-15';

  it('returns the anchor period when date == anchor', () => {
    const p = getPayPeriodForDate(anchor, '2026-05-15');
    expect(p.index).toBe(0);
    expect(p.start.toISOString().slice(0, 10)).toBe('2026-05-15');
    expect(p.end.toISOString().slice(0, 10)).toBe('2026-05-28');
  });

  it('returns the same period for any date within the 14-day window', () => {
    const start = getPayPeriodForDate(anchor, '2026-05-15');
    const mid = getPayPeriodForDate(anchor, '2026-05-21');
    const end = getPayPeriodForDate(anchor, '2026-05-28');
    expect(mid.index).toBe(start.index);
    expect(end.index).toBe(start.index);
  });

  it('advances by one for the next period', () => {
    const next = getPayPeriodForDate(anchor, '2026-05-29');
    expect(next.index).toBe(1);
    expect(next.start.toISOString().slice(0, 10)).toBe('2026-05-29');
  });

  it('handles dates before the anchor (negative index)', () => {
    const prev = getPayPeriodForDate(anchor, '2026-05-14');
    expect(prev.index).toBe(-1);
    expect(prev.start.toISOString().slice(0, 10)).toBe('2026-05-01');
    expect(prev.end.toISOString().slice(0, 10)).toBe('2026-05-14');
  });

  it('getCurrentPayPeriod uses today by default', () => {
    const today = new Date('2026-05-21');
    const p = getCurrentPayPeriod(anchor, today);
    expect(p.index).toBe(0);
  });

  it('getNextNPayPeriods returns N consecutive periods', () => {
    const today = new Date('2026-05-21');
    const periods = getNextNPayPeriods(anchor, 3, today);
    expect(periods).toHaveLength(3);
    expect(periods[0].index).toBe(0);
    expect(periods[1].index).toBe(1);
    expect(periods[2].index).toBe(2);
    expect(periods[1].start.toISOString().slice(0, 10)).toBe('2026-05-29');
  });
});
