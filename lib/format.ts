import dayjs from 'dayjs';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '$0.00';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return '$0.00';
  return currency.format(n);
}

export function formatDate(date: string | Date, fmt = 'MMM D, YYYY'): string {
  return dayjs(date).format(fmt);
}

export function formatShortDate(date: string | Date): string {
  return dayjs(date).format('MMM D');
}

export function relativeDueDate(due: string | Date, today: Date = new Date()): string {
  const dueDay = dayjs(due).startOf('day');
  const ref = dayjs(today).startOf('day');
  const diff = dueDay.diff(ref, 'day');
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff > 0) return `Due in ${diff} days`;
  if (diff === -1) return 'Overdue 1 day';
  return `Overdue ${Math.abs(diff)} days`;
}
