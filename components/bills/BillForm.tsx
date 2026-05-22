'use client';

import { useState, useTransition } from 'react';
import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import type { Bill } from '@/types/database';
import { createBill, updateBill } from '@/app/(app)/bills/actions';

type Props = {
  bill?: Bill;
};

export function BillForm({ bill }: Props) {
  const router = useRouter();
  const [name, setName] = useState(bill?.name ?? '');
  const [description, setDescription] = useState(bill?.description ?? '');
  const [amount, setAmount] = useState<number | string>(bill?.amount ?? '');
  const [dueDate, setDueDate] = useState<Date | null>(
    bill?.due_date ? dayjs(bill.due_date).toDate() : new Date(),
  );
  const [category, setCategory] = useState(bill?.category ?? '');
  const [isInstallment, setIsInstallment] = useState(bill?.is_installment ?? false);
  const [installmentNumber, setInstallmentNumber] = useState<number | string>(
    bill?.installment_number ?? '',
  );
  const [installmentTotal, setInstallmentTotal] = useState<number | string>(
    bill?.installment_total ?? '',
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !dueDate || !amount) {
      notifications.show({ color: 'red', message: 'Name, amount, and due date are required.' });
      return;
    }
    const fd = new FormData();
    fd.set('name', name);
    fd.set('description', description);
    fd.set('amount', String(amount));
    fd.set('due_date', dayjs(dueDate).format('YYYY-MM-DD'));
    fd.set('category', category);
    fd.set('is_installment', isInstallment ? 'true' : '');
    if (isInstallment) {
      fd.set('installment_number', String(installmentNumber));
      fd.set('installment_total', String(installmentTotal));
    }
    startTransition(async () => {
      try {
        if (bill) {
          await updateBill(bill.id, fd);
          notifications.show({ color: 'teal', message: 'Bill updated.' });
          router.push('/bills');
        } else {
          await createBill(fd);
          // createBill redirects to /bills; if no throw, notification may not fire
        }
      } catch (err) {
        // Server actions throw a NEXT_REDIRECT as a redirect side-effect — don't surface that
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
          label="Name"
          placeholder="e.g. Electric bill"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          autoFocus
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
            label="Due date"
            value={dueDate}
            onChange={(v) => setDueDate(v ? new Date(v) : null)}
            required
          />
        </Group>
        <TextInput
          label="Category (optional)"
          placeholder="e.g. Utilities, Subscriptions"
          value={category}
          onChange={(e) => setCategory(e.currentTarget.value)}
        />
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          autosize
          minRows={2}
        />
        <Checkbox
          label="This is an installment (e.g. ZipPay, Affirm, financed purchase)"
          checked={isInstallment}
          onChange={(e) => setIsInstallment(e.currentTarget.checked)}
        />
        {isInstallment && (
          <Group grow>
            <NumberInput
              label="Installment #"
              value={installmentNumber}
              onChange={setInstallmentNumber}
              min={1}
              hideControls
            />
            <NumberInput
              label="Of"
              value={installmentTotal}
              onChange={setInstallmentTotal}
              min={1}
              hideControls
            />
          </Group>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={() => router.back()} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {bill ? 'Save' : 'Create bill'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
