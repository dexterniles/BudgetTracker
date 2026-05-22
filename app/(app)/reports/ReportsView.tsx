'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { AreaChart, DonutChart } from '@mantine/charts';
import dayjs from 'dayjs';
import { formatCurrency } from '@/lib/format';
import {
  formatPayPeriodLabel,
  getCurrentPayPeriod,
  getPayPeriodForDate,
} from '@/lib/pay-period';
import type { Bill, Income } from '@/types/database';

type Props = {
  bills: Bill[];
  income: Income[];
  payAnchor: string | null;
};

type Preset = 'this_period' | 'last_period' | 'this_month' | 'last_3_months' | 'ytd';

const TEAL_PALETTE = [
  'teal.4',
  'teal.6',
  'cyan.5',
  'indigo.4',
  'violet.4',
  'pink.4',
  'orange.4',
  'lime.5',
  'gray.5',
];

export function ReportsView({ bills, income, payAnchor }: Props) {
  const today = new Date();
  const defaultStart = dayjs(today).subtract(30, 'day').toDate();
  const [range, setRange] = useState<[Date | null, Date | null]>([defaultStart, today]);

  function applyPreset(p: Preset) {
    const now = dayjs();
    if (p === 'this_period' && payAnchor) {
      const period = getCurrentPayPeriod(payAnchor, now.toDate());
      setRange([period.start, period.end]);
      return;
    }
    if (p === 'last_period' && payAnchor) {
      const cur = getCurrentPayPeriod(payAnchor, now.toDate());
      const prev = getPayPeriodForDate(payAnchor, dayjs(cur.start).subtract(1, 'day').toDate());
      setRange([prev.start, prev.end]);
      return;
    }
    if (p === 'this_month') {
      setRange([now.startOf('month').toDate(), now.endOf('month').toDate()]);
      return;
    }
    if (p === 'last_3_months') {
      setRange([now.subtract(3, 'month').startOf('day').toDate(), now.toDate()]);
      return;
    }
    if (p === 'ytd') {
      setRange([now.startOf('year').toDate(), now.toDate()]);
    }
  }

  const filtered = useMemo(() => {
    const [start, end] = range;
    if (!start || !end) return { bills: [], income: [] };
    const s = dayjs(start).startOf('day');
    const e = dayjs(end).endOf('day');
    return {
      bills: bills.filter((b) => {
        const d = dayjs(b.due_date);
        return !d.isBefore(s) && !d.isAfter(e);
      }),
      income: income.filter((i) => {
        const d = dayjs(i.received_date);
        return !d.isBefore(s) && !d.isAfter(e);
      }),
    };
  }, [bills, income, range]);

  const billsTotal = filtered.bills.reduce((s, b) => s + Number(b.amount), 0);
  const incomeTotal = filtered.income.reduce((s, i) => s + Number(i.amount), 0);
  const net = incomeTotal - billsTotal;

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.bills.forEach((b) => {
      const cat = (b.category ?? '').trim() || 'Uncategorized';
      map.set(cat, (map.get(cat) ?? 0) + Number(b.amount));
    });
    const entries = Array.from(map.entries())
      .map(([name, value], i) => ({ name, value, color: TEAL_PALETTE[i % TEAL_PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
    return entries;
  }, [filtered.bills]);

  const trendData = useMemo(() => {
    const [start, end] = range;
    if (!start || !end) return [];
    const s = dayjs(start).startOf('day');
    const e = dayjs(end).startOf('day');
    const days = e.diff(s, 'day') + 1;
    const bucketDays = days <= 31 ? 1 : 7; // daily for short ranges, weekly for longer
    const buckets: Record<string, { date: string; bills: number; income: number }> = {};

    for (let i = 0; i < days; i += bucketDays) {
      const d = s.add(i, 'day');
      const key = d.format('YYYY-MM-DD');
      buckets[key] = { date: d.format(bucketDays === 1 ? 'MMM D' : 'MMM D'), bills: 0, income: 0 };
    }
    const bucketKeyFor = (date: string) => {
      const d = dayjs(date);
      const diff = d.diff(s, 'day');
      const idx = Math.floor(diff / bucketDays);
      return s.add(idx * bucketDays, 'day').format('YYYY-MM-DD');
    };

    filtered.bills.forEach((b) => {
      const k = bucketKeyFor(b.due_date);
      if (buckets[k]) buckets[k].bills += Number(b.amount);
    });
    filtered.income.forEach((i) => {
      const k = bucketKeyFor(i.received_date);
      if (buckets[k]) buckets[k].income += Number(i.amount);
    });

    return Object.values(buckets);
  }, [filtered, range]);

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Reports</Title>
        <Text c="dimmed">Filter by any date range.</Text>
      </div>

      <Card>
        <Stack>
          <Group gap="xs" wrap="wrap">
            {payAnchor && (
              <>
                <Button size="xs" variant="default" onClick={() => applyPreset('this_period')}>
                  This pay period
                </Button>
                <Button size="xs" variant="default" onClick={() => applyPreset('last_period')}>
                  Last pay period
                </Button>
              </>
            )}
            <Button size="xs" variant="default" onClick={() => applyPreset('this_month')}>
              This month
            </Button>
            <Button size="xs" variant="default" onClick={() => applyPreset('last_3_months')}>
              Last 3 months
            </Button>
            <Button size="xs" variant="default" onClick={() => applyPreset('ytd')}>
              Year to date
            </Button>
          </Group>
          <DatePickerInput
            type="range"
            label="Custom range"
            value={range}
            onChange={(v) => {
              const [a, b] = v as [Date | string | null, Date | string | null];
              setRange([a ? new Date(a) : null, b ? new Date(b) : null]);
            }}
            allowSingleDateInRange
          />
          {payAnchor && range[0] && range[1] && (
            <Text size="xs" c="dimmed">
              Range:{' '}
              {formatPayPeriodLabel({
                index: 0,
                start: range[0],
                end: range[1],
                payDate: range[0],
              })}
            </Text>
          )}
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Bills total
          </Text>
          <Title order={3} mt={4}>
            {formatCurrency(billsTotal)}
          </Title>
        </Card>
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Income total
          </Text>
          <Title order={3} mt={4} c="teal">
            {formatCurrency(incomeTotal)}
          </Title>
        </Card>
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Net
          </Text>
          <Title order={3} mt={4} c={net >= 0 ? 'teal' : 'red'}>
            {formatCurrency(net)}
          </Title>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card>
          <Title order={4} mb="sm">
            Bills by category
          </Title>
          {categoryData.length === 0 ? (
            <Text c="dimmed" size="sm">
              No bills in this range.
            </Text>
          ) : (
            <Group justify="center">
              <DonutChart
                size={220}
                thickness={32}
                data={categoryData}
                withTooltip
                tooltipDataSource="segment"
                valueFormatter={(v) => formatCurrency(v)}
              />
            </Group>
          )}
        </Card>

        <Card>
          <Title order={4} mb="sm">
            Cashflow trend
          </Title>
          {trendData.length === 0 ? (
            <Text c="dimmed" size="sm">
              No data in this range.
            </Text>
          ) : (
            <AreaChart
              h={220}
              data={trendData}
              dataKey="date"
              series={[
                { name: 'income', color: 'teal.6', label: 'Income' },
                { name: 'bills', color: 'red.5', label: 'Bills' },
              ]}
              curveType="monotone"
              withTooltip
              valueFormatter={(v) => `$${v.toFixed(0)}`}
            />
          )}
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
