'use client';

import { useMemo, useState } from 'react';
import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { AreaChart, DonutChart } from '@mantine/charts';
import { IconCoin, IconReceipt2, IconScale } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { formatCurrency } from '@/lib/format';
import { getCurrentPayPeriod, getPayPeriodForDate } from '@/lib/pay-period';
import type { Bill, Income } from '@/types/database';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';

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

const fmt = (d: dayjs.Dayjs | Date) => dayjs(d).format('YYYY-MM-DD');

export function ReportsView({ bills, income, payAnchor }: Props) {
  const today = dayjs();
  const defaultStart = today.subtract(30, 'day');
  const [range, setRange] = useState<[string | null, string | null]>([
    fmt(defaultStart),
    fmt(today),
  ]);

  function applyPreset(p: Preset) {
    const now = dayjs();
    if (p === 'this_period' && payAnchor) {
      const period = getCurrentPayPeriod(payAnchor, now.toDate());
      setRange([fmt(period.start), fmt(period.end)]);
      return;
    }
    if (p === 'last_period' && payAnchor) {
      const cur = getCurrentPayPeriod(payAnchor, now.toDate());
      const prev = getPayPeriodForDate(payAnchor, dayjs(cur.start).subtract(1, 'day').toDate());
      setRange([fmt(prev.start), fmt(prev.end)]);
      return;
    }
    if (p === 'this_month') {
      setRange([fmt(now.startOf('month')), fmt(now.endOf('month'))]);
      return;
    }
    if (p === 'last_3_months') {
      setRange([fmt(now.subtract(3, 'month').startOf('day')), fmt(now)]);
      return;
    }
    if (p === 'ytd') {
      setRange([fmt(now.startOf('year')), fmt(now)]);
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
    <Stack gap="lg">
      <PageHeader title="Reports" description="Filter by any date range." />

      <SectionCard title="Date range">
        <Stack>
          <Group gap="xs" wrap="wrap">
            {payAnchor && (
              <>
                <Button size="xs" variant="light" radius="xl" onClick={() => applyPreset('this_period')}>
                  This pay period
                </Button>
                <Button size="xs" variant="light" radius="xl" onClick={() => applyPreset('last_period')}>
                  Last pay period
                </Button>
              </>
            )}
            <Button size="xs" variant="light" radius="xl" onClick={() => applyPreset('this_month')}>
              This month
            </Button>
            <Button size="xs" variant="light" radius="xl" onClick={() => applyPreset('last_3_months')}>
              Last 3 months
            </Button>
            <Button size="xs" variant="light" radius="xl" onClick={() => applyPreset('ytd')}>
              Year to date
            </Button>
          </Group>
          <DatePickerInput
            type="range"
            label="Custom range"
            value={range}
            onChange={setRange}
            allowSingleDateInRange
          />
          {range[0] && range[1] && (
            <Text size="xs" c="dimmed">
              {dayjs(range[0]).format('MMM D, YYYY')} – {dayjs(range[1]).format('MMM D, YYYY')}
            </Text>
          )}
        </Stack>
      </SectionCard>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatCard
          label="Bills total"
          value={formatCurrency(billsTotal)}
          icon={<IconReceipt2 size={22} />}
          color="grape"
        />
        <StatCard
          label="Income total"
          value={formatCurrency(incomeTotal)}
          icon={<IconCoin size={22} />}
          color="teal"
          valueColor="teal"
        />
        <StatCard
          label="Net"
          value={formatCurrency(net)}
          icon={<IconScale size={22} />}
          color={net >= 0 ? 'teal' : 'red'}
          valueColor={net >= 0 ? 'teal' : 'red'}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <SectionCard title="Bills by category">
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
        </SectionCard>

        <SectionCard title="Cashflow trend">
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
        </SectionCard>
      </SimpleGrid>
    </Stack>
  );
}
