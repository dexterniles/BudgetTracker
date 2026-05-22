'use client';

import { useState, useTransition } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { deletePayment, recordPayment } from '@/app/(app)/bills/actions';
import { formatCurrency } from '@/lib/format';
import type { BillPayment } from '@/types/database';

type Props = {
  billId: string;
  remaining: number;
  payments: BillPayment[];
};

export function PaymentHistory({ billId, remaining, payments }: Props) {
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      notifications.show({ color: 'red', message: 'Enter a positive amount.' });
      return;
    }
    if (!date) {
      notifications.show({ color: 'red', message: 'Pick a date.' });
      return;
    }
    const fd = new FormData();
    fd.set('amount', String(amt));
    fd.set('paid_date', dayjs(date).format('YYYY-MM-DD'));
    fd.set('note', note);
    startTransition(async () => {
      try {
        await recordPayment(billId, fd);
        setAmount('');
        setNote('');
        notifications.show({ color: 'teal', message: 'Payment recorded.' });
      } catch (err) {
        notifications.show({
          color: 'red',
          message: err instanceof Error ? err.message : 'Failed',
        });
      }
    });
  }

  function handleDelete(paymentId: string) {
    startTransition(async () => {
      try {
        await deletePayment(paymentId, billId);
        notifications.show({ color: 'teal', message: 'Payment removed.' });
      } catch (err) {
        notifications.show({
          color: 'red',
          message: err instanceof Error ? err.message : 'Failed',
        });
      }
    });
  }

  return (
    <Stack gap="md">
      <Card>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Text fw={600}>Record a payment</Text>
            <Group grow>
              <NumberInput
                label="Amount"
                placeholder={remaining > 0 ? `Up to ${formatCurrency(remaining)}` : '0.00'}
                value={amount}
                onChange={setAmount}
                min={0}
                decimalScale={2}
                prefix="$"
                hideControls
                required
              />
              <DatePickerInput
                label="Date"
                value={date}
                onChange={(v) => setDate(v ? new Date(v) : null)}
                required
              />
            </Group>
            <TextInput
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button type="submit" loading={pending}>
                Record payment
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      <Card>
        <Text fw={600} mb="sm">
          Payment history
        </Text>
        {payments.length === 0 ? (
          <Text c="dimmed" size="sm">
            No payments recorded yet.
          </Text>
        ) : (
          <Table verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Note</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payments.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{dayjs(p.paid_date).format('MMM D, YYYY')}</Table.Td>
                  <Table.Td>{formatCurrency(p.amount)}</Table.Td>
                  <Table.Td>{p.note ?? ''}</Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(p.id)}
                      aria-label="Delete payment"
                      disabled={pending}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
