import { describe, expect, it } from 'vitest';
import { projectPayoffDate, splitPayment } from './amortization';

describe('splitPayment', () => {
  it('splits payment correctly for a typical loan', () => {
    // $10,000 balance, 6% APR, $500 payment
    // monthly interest = 10000 * 0.06/12 = $50
    // principal = 500 - 50 = $450
    const split = splitPayment(10_000, 6, 500);
    expect(split.interest).toBeCloseTo(50, 2);
    expect(split.principal).toBeCloseTo(450, 2);
  });

  it('caps principal at remaining balance', () => {
    // Only $20 left, payment of $500 → principal capped at $20
    const split = splitPayment(20, 5, 500);
    expect(split.principal).toBe(20);
  });

  it('returns zero for zero balance', () => {
    expect(splitPayment(0, 5, 100)).toEqual({ principal: 0, interest: 0 });
  });
});

describe('projectPayoffDate', () => {
  it('returns null when payment cannot cover interest', () => {
    // $10k at 24% APR: monthly interest = $200. Payment of $150 can't dent principal.
    expect(projectPayoffDate(10_000, 24, 150, '2026-01-01')).toBeNull();
  });

  it('estimates payoff for a sensible loan', () => {
    const date = projectPayoffDate(10_000, 6, 500, '2026-01-01');
    expect(date).not.toBeNull();
    // ~22 months for a $10k @ 6% with $500/mo
    if (date) {
      const diffMonths =
        (date.getFullYear() - 2026) * 12 + (date.getMonth() - 0);
      expect(diffMonths).toBeGreaterThan(18);
      expect(diffMonths).toBeLessThan(28);
    }
  });
});
