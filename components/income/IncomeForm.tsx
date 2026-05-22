'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Group,
  NumberInput,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { createIncome, updateIncome } from '@/app/(app)/income/actions';
import type { Income } from '@/types/database';

type Props = { income?: Income };

export function IncomeForm({ income }: Props) {
  const router = useRouter();
  const [source, setSource] = useState(income?.source ?? '');
  const [amount, setAmount] = useState<number | string>(income?.amount ?? '');
  const [date, setDate] = useState<Date | null>(
    income?.received_date ? dayjs(income.received_date).toDate() : new Date(),
  );
  const [description, setDescription] = useState(income?.description ?? '');
  const [isMisc, setIsMisc] = useState(income?.is_misc ?? false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!source || !date || !amount) {
      notifications.show({ color: 'red', message: 'Source, amount, and date are required.' });
      return;
    }
    const fd = new FormData();
    fd.set('source', source);
    fd.set('amount', String(amount));
    fd.set('received_date', dayjs(date).format('YYYY-MM-DD'));
    fd.set('description', description);
    fd.set('is_misc', isMisc ? 'true' : '');
    startTransition(async () => {
      try {
        if (income) {
          await updateIncome(income.id, fd);
          notifications.show({ color: 'teal', message: 'Income updated.' });
          router.push('/income');
        } else {
          await createIncome(fd);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('NEXT_REDIRECT')) return;
        notifications.show({ color: 'red', message: msg || 'Save failed' });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack maw={560}>
        <TextInput
          label="Source"
          placeholder="e.g. Paycheck, Facebook Marketplace"
          required
          autoFocus
          value={source}
          onChange={(e) => setSource(e.currentTarget.value)}
        />
        <Group grow>
          <NumberInput
            label="Amount"
            placeholder="0.00"
            required
            value={amount}
            onChange={setAmount}
            min={0}
            decimalScale={2}
            prefix="$"
            hideControls
          />
          <DatePickerInput
            label="Date received"
            value={date}
            onChange={(v) => setDate(v ? new Date(v) : null)}
            required
          />
        </Group>
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          autosize
          minRows={2}
        />
        <Switch
          label="Misc income (side work, marketplace sales, gifts, etc.)"
          checked={isMisc}
          onChange={(e) => setIsMisc(e.currentTarget.checked)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => router.back()} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {income ? 'Save' : 'Add income'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
