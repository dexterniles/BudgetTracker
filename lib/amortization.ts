import dayjs from 'dayjs';

export type PaymentSplit = {
  principal: number;
  interest: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function splitPayment(balance: number, apr: number, payment: number): PaymentSplit {
  if (balance <= 0) return { principal: 0, interest: 0 };
  const monthlyRate = apr / 100 / 12;
  const interest = round2(balance * monthlyRate);
  const principal = round2(Math.min(payment - interest, balance));
  return { principal, interest };
}

export function projectPayoffDate(
  balance: number,
  apr: number,
  payment: number,
  startDate: Date | string = new Date(),
): Date | null {
  if (balance <= 0) return dayjs(startDate).toDate();
  const monthlyRate = apr / 100 / 12;
  const minimumInterest = balance * monthlyRate;
  if (payment <= minimumInterest) return null;

  let remaining = balance;
  let months = 0;
  const MAX_MONTHS = 12 * 60; // 60 years cap to avoid infinite loops
  while (remaining > 0 && months < MAX_MONTHS) {
    const { principal } = splitPayment(remaining, apr, payment);
    if (principal <= 0) return null;
    remaining = round2(remaining - principal);
    months++;
  }
  if (months >= MAX_MONTHS) return null;
  return dayjs(startDate).add(months, 'month').toDate();
}
