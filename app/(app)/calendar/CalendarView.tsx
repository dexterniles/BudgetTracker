'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Center,
  Group,
  Popover,
  Stack,
  Text,
} from '@mantine/core';
import { MonthPicker } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import { formatCurrency } from '@/lib/format';
import { BillStatusBadge } from '@/components/bills/BillStatusBadge';
import { LinkAnchor } from '@/components/ui/links';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import type { Bill } from '@/types/database';

type Props = {
  bills: Bill[];
  initialMonth: string;
};

export function CalendarView({ bills, initialMonth }: Props) {
  const [month, setMonth] = useState<string>(initialMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [popoverOpened, popover] = useDisclosure(false);

  const stepMonth = (delta: number) => {
    setMonth(dayjs(month).add(delta, 'month').startOf('month').format('YYYY-MM-DD'));
  };
  const goToToday = () => setMonth(dayjs().startOf('month').format('YYYY-MM-DD'));

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

  const firstDow = monthStart.day();
  const daysInMonth = monthStart.daysInMonth();
  const cells: Array<{ date: dayjs.Dayjs | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: monthStart.date(d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });

  const weeks: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const dayBills = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <Stack gap="lg">
      <PageHeader
        title="Calendar"
        description={`${formatCurrency(monthTotal)} due this month`}
        action={
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => stepMonth(-1)}
              aria-label="Previous month"
            >
              <IconChevronLeft size={16} />
            </ActionIcon>
            <Popover
              opened={popoverOpened}
              onChange={popover.toggle}
              position="bottom"
              shadow="md"
              radius="md"
              withArrow
            >
              <Popover.Target>
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={popover.toggle}
                  style={{ minWidth: 140 }}
                >
                  {monthStart.format('MMMM YYYY')}
                </Button>
              </Popover.Target>
              <Popover.Dropdown p="xs">
                <MonthPicker
                  value={month}
                  onChange={(v) => {
                    if (v) setMonth(v);
                    popover.close();
                  }}
                  size="xs"
                />
                <Button variant="subtle" size="xs" fullWidth mt="xs" onClick={() => { goToToday(); popover.close(); }}>
                  Today
                </Button>
              </Popover.Dropdown>
            </Popover>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => stepMonth(1)}
              aria-label="Next month"
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        }
      />

      <SectionCard title={monthStart.format('MMMM YYYY')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <Center key={d} p={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: 0.4 }}>
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
                      minHeight: 78,
                      borderRadius: 10,
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
              const intensity = Math.min(1, total / 500);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  style={{
                    border: isSelected
                      ? 'none'
                      : isToday
                        ? '1px solid var(--mantine-color-teal-5)'
                        : '1px solid var(--mantine-color-default-border)',
                    background: isSelected
                      ? 'var(--mantine-color-teal-filled)'
                      : total > 0
                        ? `rgba(20, 184, 166, ${0.08 + intensity * 0.25})`
                        : 'transparent',
                    color: isSelected ? 'white' : 'inherit',
                    borderRadius: 10,
                    padding: 8,
                    minHeight: 78,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'background-color 120ms ease, border-color 120ms ease',
                  }}
                >
                  <Text size="xs" fw={isToday ? 700 : 500} c="inherit">
                    {cell.date.date()}
                  </Text>
                  {total > 0 && (
                    <Text size="xs" fw={600} c="inherit">
                      {formatCurrency(total)}
                    </Text>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </SectionCard>

      {selectedDay && (
        <SectionCard
          title={dayjs(selectedDay).format('dddd, MMM D, YYYY')}
          action={
            <Anchor onClick={() => setSelectedDay(null)} size="sm" style={{ cursor: 'pointer' }}>
              Close
            </Anchor>
          }
          padding={0}
        >
          {dayBills.length === 0 ? (
            <Box p="lg">
              <Text c="dimmed" size="sm">
                No bills due that day.
              </Text>
            </Box>
          ) : (
            <Stack gap={0}>
              {dayBills.map((b, idx) => (
                <Group
                  key={b.id}
                  justify="space-between"
                  px="lg"
                  py="sm"
                  style={{
                    borderBottom:
                      idx < dayBills.length - 1
                        ? '1px solid var(--mantine-color-default-border)'
                        : 'none',
                  }}
                >
                  <Group gap="xs">
                    <LinkAnchor href={`/bills/${b.id}`} fw={500}>
                      {b.name}
                    </LinkAnchor>
                    <BillStatusBadge status={b.status} />
                  </Group>
                  <Text fw={600}>{formatCurrency(b.amount)}</Text>
                </Group>
              ))}
            </Stack>
          )}
        </SectionCard>
      )}
    </Stack>
  );
}
