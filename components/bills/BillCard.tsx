'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  NumberInput,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { markBillPaid, recordPayment } from '@/app/(app)/bills/actions';
import { formatCurrency, relativeDueDate } from '@/lib/format';
import type { Bill } from '@/types/database';
import { BillStatusBadge } from './BillStatusBadge';

type Props = {
  bill: Bill;
  compact?: boolean;
};

export function BillCard({ bill, compact = false }: Props) {
  const [partial, setPartial] = useState<number | string>('');
  const [pending, startTransition] = useTransition();

  const amount = Number(bill.amount);
  const paid = Number(bill.amount_paid);
  const remaining = Math.max(0, amount - paid);
  const pct = amount > 0 ? Math.min(100, (paid / amount) * 100) : 0;
  const overdue =
    bill.status !== 'paid' && dayjs(bill.due_date).startOf('day').isBefore(dayjs().startOf('day'));

  function handleMarkPaid() {
    startTransition(async () => {
      try {
        await markBillPaid(bill.id);
        notifications.show({ color: 'teal', message: `${bill.name} marked paid` });
      } catch (err) {
        notifications.show({
          color: 'red',
          message: err instanceof Error ? err.message : 'Action failed',
        });
      }
    });
  }

  function handlePartial(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(partial);
    if (!Number.isFinite(amt) || amt <= 0) {
      notifications.show({ color: 'red', message: 'Enter a positive amount' });
      return;
    }
    const fd = new FormData();
    fd.set('amount', String(amt));
    fd.set('paid_date', dayjs().format('YYYY-MM-DD'));
    fd.set('note', '');
    startTransition(async () => {
      try {
        await recordPayment(bill.id, fd);
        setPartial('');
        notifications.show({
          color: 'teal',
          message: `Recorded ${formatCurrency(amt)} toward ${bill.name}`,
        });
      } catch (err) {
        notifications.show({
          color: 'red',
          message: err instanceof Error ? err.message : 'Action failed',
        });
      }
    });
  }

  return (
    <Card>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              <Text fw={600} truncate>
                {bill.name}
              </Text>
              <BillStatusBadge status={bill.status} />
              {bill.is_installment && bill.installment_number && bill.installment_total && (
                <Text size="xs" c="dimmed">
                  {bill.installment_number}/{bill.installment_total}
                </Text>
              )}
            </Group>
            <Group gap="xs">
              <Text size="sm" c={overdue ? 'red' : 'dimmed'}>
                {relativeDueDate(bill.due_date)} · {dayjs(bill.due_date).format('MMM D')}
              </Text>
              {bill.category && (
                <Text size="xs" c="dimmed">
                  · {bill.category}
                </Text>
              )}
            </Group>
          </Stack>
          <Stack gap={0} align="flex-end">
            <Text fw={600}>{formatCurrency(amount)}</Text>
            {paid > 0 && bill.status !== 'paid' && (
              <Text size="xs" c="dimmed">
                {formatCurrency(remaining)} left
              </Text>
            )}
          </Stack>
        </Group>

        {bill.status === 'partial' && <Progress value={pct} size="sm" color="yellow" />}

        {!compact && bill.status !== 'paid' && (
          <Group gap="xs" wrap="wrap">
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconCheck size={14} />}
              onClick={handleMarkPaid}
              loading={pending}
            >
              Mark paid
            </Button>
            <form onSubmit={handlePartial} style={{ display: 'flex', gap: 4 }}>
              <NumberInput
                size="xs"
                w={110}
                placeholder="Partial $"
                value={partial}
                onChange={setPartial}
                min={0}
                decimalScale={2}
                hideControls
                prefix="$"
              />
              <Button type="submit" size="xs" variant="default" loading={pending}>
                Pay
              </Button>
            </form>
            <ActionIcon
              component={Link}
              href={`/bills/${bill.id}`}
              variant="subtle"
              ml="auto"
              aria-label="Open bill"
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        )}

        {compact && (
          <Group justify="flex-end">
            <ActionIcon
              component={Link}
              href={`/bills/${bill.id}`}
              variant="subtle"
              aria-label="Open bill"
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
