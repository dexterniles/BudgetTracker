'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import type { Loan } from '@/types/database';
import { createLoan, updateLoan } from '@/app/(app)/loans/actions';

const LOAN_TYPES = [
  { value: 'student', label: 'Student loan' },
  { value: 'auto', label: 'Auto loan' },
  { value: 'phone', label: 'Phone installment' },
  { value: 'personal', label: 'Personal loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'other', label: 'Other' },
];

export function LoanForm({ loan }: { loan?: Loan }) {
  const router = useRouter();
  const [name, setName] = useState(loan?.name ?? '');
  const [lender, setLender] = useState(loan?.lender ?? '');
  const [type, setType] = useState<string>(loan?.loan_type ?? 'other');
  const [principal, setPrincipal] = useState<number | string>(loan?.principal ?? '');
  const [balance, setBalance] = useState<number | string>(loan?.current_balance ?? '');
  const [apr, setApr] = useState<number | string>(loan?.apr ?? '');
  const [minPayment, setMinPayment] = useState<number | string>(loan?.minimum_payment ?? '');
  const [startDate, setStartDate] = useState<Date | null>(
    loan?.start_date ? dayjs(loan.start_date).toDate() : new Date(),
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !principal || !balance || !startDate) {
      notifications.show({ color: 'red', message: 'Fill in all required fields.' });
      return;
    }
    const fd = new FormData();
    fd.set('name', name);
    fd.set('lender', lender);
    fd.set('loan_type', type);
    fd.set('principal', String(principal));
    fd.set('current_balance', String(balance));
    fd.set('apr', String(apr || 0));
    fd.set('minimum_payment', String(minPayment || 0));
    fd.set('start_date', dayjs(startDate).format('YYYY-MM-DD'));

    startTransition(async () => {
      try {
        if (loan) {
          await updateLoan(loan.id, fd);
          notifications.show({ color: 'teal', message: 'Loan updated.' });
          router.push(`/loans/${loan.id}`);
        } else {
          await createLoan(fd);
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
      <Stack maw={620}>
        <Group grow>
          <TextInput
            label="Name"
            placeholder="e.g. Federal student loan"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            autoFocus
          />
          <TextInput
            label="Lender (optional)"
            placeholder="e.g. Nelnet, Toyota Financial"
            value={lender}
            onChange={(e) => setLender(e.currentTarget.value)}
          />
        </Group>
        <Select
          label="Loan type"
          data={LOAN_TYPES}
          value={type}
          onChange={(v) => setType(v ?? 'other')}
          allowDeselect={false}
        />
        <Group grow>
          <NumberInput
            label="Original principal"
            value={principal}
            onChange={setPrincipal}
            min={0}
            decimalScale={2}
            prefix="$"
            required
            hideControls
          />
          <NumberInput
            label="Current balance"
            value={balance}
            onChange={setBalance}
            min={0}
            decimalScale={2}
            prefix="$"
            required
            hideControls
          />
        </Group>
        <Group grow>
          <NumberInput
            label="APR (%)"
            value={apr}
            onChange={setApr}
            min={0}
            decimalScale={3}
            suffix="%"
            hideControls
          />
          <NumberInput
            label="Minimum monthly payment"
            value={minPayment}
            onChange={setMinPayment}
            min={0}
            decimalScale={2}
            prefix="$"
            hideControls
          />
          <DatePickerInput
            label="Start date"
            value={startDate}
            onChange={(v) => setStartDate(v ? new Date(v) : null)}
            required
          />
        </Group>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => router.back()} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {loan ? 'Save' : 'Add loan'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
