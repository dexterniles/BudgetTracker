import dayjs, { type Dayjs } from 'dayjs';

export type PayPeriod = {
  index: number;
  start: Date;
  end: Date;
  payDate: Date;
};

const PERIOD_DAYS = 14;

function normalize(d: Date | string | Dayjs): Dayjs {
  return dayjs(d).startOf('day');
}

export function getPayPeriodForDate(anchor: Date | string, date: Date | string): PayPeriod {
  const a = normalize(anchor);
  const d = normalize(date);
  const diffDays = d.diff(a, 'day');
  const index = Math.floor(diffDays / PERIOD_DAYS);
  const start = a.add(index * PERIOD_DAYS, 'day');
  const end = start.add(PERIOD_DAYS - 1, 'day');
  return {
    index,
    start: start.toDate(),
    end: end.toDate(),
    payDate: start.toDate(),
  };
}

export function getCurrentPayPeriod(anchor: Date | string, today: Date = new Date()): PayPeriod {
  return getPayPeriodForDate(anchor, today);
}

export function getNextNPayPeriods(
  anchor: Date | string,
  n: number,
  today: Date = new Date(),
): PayPeriod[] {
  const current = getCurrentPayPeriod(anchor, today);
  const out: PayPeriod[] = [];
  for (let i = 0; i < n; i++) {
    const startDay = dayjs(current.start).add(i * PERIOD_DAYS, 'day');
    out.push({
      index: current.index + i,
      start: startDay.toDate(),
      end: startDay.add(PERIOD_DAYS - 1, 'day').toDate(),
      payDate: startDay.toDate(),
    });
  }
  return out;
}

export function formatPayPeriodLabel(p: PayPeriod): string {
  return `${dayjs(p.start).format('MMM D')} – ${dayjs(p.end).format('MMM D')}`;
}
