'use client';

import { useState, useTransition } from 'react';
import { Button, Card, Group, NumberInput, Stack, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { recordLoanPayment } from '@/app/(app)/loans/actions';
import { formatCurrency } from '@/lib/format';
import { splitPayment } from '@/lib/amortization';
import { SectionCard } from '@/components/ui/SectionCard';

type Props = {
  loanId: string;
  currentBalance: number;
  apr: number;
  minimumPayment: number;
};

export function RecordPaymentForm({ loanId, currentBalance, apr, minimumPayment }: Props) {
  const [amount, setAmount] = useState<number | string>(minimumPayment || '');
  const [extra, setExtra] = useState<number | string>('');
  const [date, setDate] = useState<string | null>(dayjs().format('YYYY-MM-DD'));
  const [pending, startTransition] = useTransition();

  const amtNum = Number(amount || 0);
  const extraNum = Number(extra || 0);
  const preview =
    amtNum > 0 ? splitPayment(currentBalance, apr, amtNum) : { principal: 0, interest: 0 };
  const projectedPrincipal = Math.min(preview.principal + Math.max(0, extraNum), currentBalance);
  const projectedBalance = Math.max(0, currentBalance - projectedPrincipal);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || amtNum <= 0) {
      notifications.show({ color: 'red', message: 'Enter a positive amount and date.' });
      return;
    }
    const fd = new FormData();
    fd.set('amount', String(amtNum));
    fd.set('extra_principal', String(extraNum || 0));
    fd.set('payment_date', date);
    startTransition(async () => {
      try {
        await recordLoanPayment(loanId, fd);
        setExtra('');
        notifications.show({ color: 'teal', message: 'Payment recorded.' });
      } catch (err) {
        notifications.show({
          color: 'red',
          message: err instanceof Error ? err.message : 'Failed',
        });
      }
    });
  }

  return (
    <SectionCard title="Record a payment">
      <form onSubmit={handleSubmit}>
        <Stack>
          <Group grow>
            <NumberInput
              label="Payment amount"
              value={amount}
              onChange={setAmount}
              min={0}
              decimalScale={2}
              prefix="$"
              hideControls
              required
            />
            <NumberInput
              label="Extra to principal (optional)"
              value={extra}
              onChange={setExtra}
              min={0}
              decimalScale={2}
              prefix="$"
              hideControls
            />
            <DatePickerInput
              label="Date"
              value={date}
              onChange={setDate}
              required
            />
          </Group>
          {amtNum > 0 && currentBalance > 0 && (
            <Card withBorder={false} bg="var(--mantine-color-default-hover)">
              <Group justify="space-between" gap="lg">
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">
                    Interest
                  </Text>
                  <Text fw={500}>{formatCurrency(preview.interest)}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">
                    Principal
                  </Text>
                  <Text fw={500} c="teal">
                    {formatCurrency(projectedPrincipal)}
                  </Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">
                    New balance
                  </Text>
                  <Text fw={500}>{formatCurrency(projectedBalance)}</Text>
                </Stack>
              </Group>
            </Card>
          )}
          <Group justify="flex-end">
            <Button type="submit" loading={pending}>
              Record payment
            </Button>
          </Group>
        </Stack>
      </form>
    </SectionCard>
  );
}
