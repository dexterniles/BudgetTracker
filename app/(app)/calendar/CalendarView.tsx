'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Anchor, Card, Center, Group, Stack, Text, Title } from '@mantine/core';
import { MonthPicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { formatCurrency } from '@/lib/format';
import { BillStatusBadge } from '@/components/bills/BillStatusBadge';
import type { Bill } from '@/types/database';

type Props = {
  bills: Bill[];
  initialMonth: string; // YYYY-MM-01
};

export function CalendarView({ bills, initialMonth }: Props) {
  const [month, setMonth] = useState<Date>(dayjs(initialMonth).toDate());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Bill[]>();
    bills.forEach((b) => {
      const key = dayjs(b.due_date).format('YYYY-MM-DD');
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    });
    return map;
  }, [bills]);

  const monthStart = dayjs(month).startOf('month');
  const monthEnd = monthStart.endOf('month');
  const monthBills = bills.filter((b) => {
    const d = dayjs(b.due_date);
    return d.isAfter(monthStart.subtract(1, 'day')) && d.isBefore(monthEnd.add(1, 'day'));
  });
  const monthTotal = monthBills.reduce(
    (s, b) => s + Math.max(0, Number(b.amount) - Number(b.amount_paid)),
    0,
  );

  // Build calendar grid: weeks of the visible month
  const firstDow = monthStart.day(); // 0=Sunday
  const daysInMonth = monthStart.daysInMonth();
  const cells: Array<{ date: dayjs.Dayjs | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: monthStart.date(d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });

  const weeks: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const dayBills = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap" align="flex-end">
        <div>
          <Title order={2}>Calendar</Title>
          <Text c="dimmed">
            {monthStart.format('MMMM YYYY')} · {formatCurrency(monthTotal)} due
          </Text>
        </div>
        <MonthPicker value={month} onChange={(v) => setMonth(v ? new Date(v) : new Date())} />
      </Group>

      <Card p="sm">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <Center key={d} p={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {d}
              </Text>
            </Center>
          ))}
          {weeks.flatMap((week, wi) =>
            week.map((cell, di) => {
              if (!cell.date) {
                return (
                  <div
                    key={`${wi}-${di}-empty`}
                    style={{
                      minHeight: 70,
                      borderRadius: 6,
                      background: 'transparent',
                    }}
                  />
                );
              }
              const key = cell.date.format('YYYY-MM-DD');
              const list = byDay.get(key) ?? [];
              const total = list.reduce(
                (s, b) => s + Math.max(0, Number(b.amount) - Number(b.amount_paid)),
                0,
              );
              const isToday = cell.date.isSame(dayjs(), 'day');
              const isSelected = selectedDay === key;
              const intensity = Math.min(1, total / 500); // visual hint, caps at $500/day
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  style={{
                    border: isSelected
                      ? '2px solid var(--mantine-color-teal-6)'
                      : isToday
                        ? '1px solid var(--mantine-color-teal-4)'
                        : '1px solid var(--mantine-color-default-border)',
                    background:
                      total > 0
                        ? `rgba(20, 184, 166, ${0.08 + intensity * 0.25})`
                        : 'transparent',
                    borderRadius: 6,
                    padding: 6,
                    minHeight: 70,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    color: 'inherit',
                  }}
                >
                  <Text size="xs" fw={isToday ? 700 : 500}>
                    {cell.date.date()}
                  </Text>
                  {total > 0 && (
                    <Text size="xs" fw={600}>
                      {formatCurrency(total)}
                    </Text>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </Card>

      {selectedDay && (
        <Card>
          <Group justify="space-between" mb="sm">
            <Title order={4}>{dayjs(selectedDay).format('dddd, MMM D, YYYY')}</Title>
            <Anchor onClick={() => setSelectedDay(null)} size="sm">
              Close
            </Anchor>
          </Group>
          {dayBills.length === 0 ? (
            <Text c="dimmed" size="sm">
              No bills due that day.
            </Text>
          ) : (
            <Stack gap="xs">
              {dayBills.map((b) => (
                <Group
                  key={b.id}
                  justify="space-between"
                  py="xs"
                  style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
                >
                  <Group gap="xs">
                    <Anchor component={Link} href={`/bills/${b.id}`} fw={500}>
                      {b.name}
                    </Anchor>
                    <BillStatusBadge status={b.status} />
                  </Group>
                  <Text fw={600}>{formatCurrency(b.amount)}</Text>
                </Group>
              ))}
            </Stack>
          )}
        </Card>
      )}
    </Stack>
  );
}
