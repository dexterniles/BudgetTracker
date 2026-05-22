'use client';

import { useState, useTransition } from 'react';
import { Button, Group, Select, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { saveSettings } from './actions';

type Props = {
  initialAnchor: string | null;
  initialCurrency: string;
};

export function SettingsForm({ initialAnchor, initialCurrency }: Props) {
  const [date, setDate] = useState<string | null>(initialAnchor);
  const [currency, setCurrency] = useState<string>(initialCurrency || 'USD');
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date) {
      notifications.show({ color: 'red', message: 'Pick a pay anchor date.' });
      return;
    }
    const fd = new FormData();
    fd.set('pay_anchor_date', date);
    fd.set('currency', currency);
    startTransition(async () => {
      try {
        await saveSettings(fd);
        notifications.show({ color: 'teal', message: 'Settings saved.' });
      } catch (err) {
        notifications.show({
          color: 'red',
          message: err instanceof Error ? err.message : 'Save failed',
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack maw={420}>
        <DatePickerInput
          label="Pay anchor date"
          description="Any recent paycheck date. Pay periods are calculated as 14-day windows from this date."
          value={date}
          onChange={setDate}
          required
        />
        <Select
          label="Currency"
          data={[
            { value: 'USD', label: 'USD — US Dollar' },
            { value: 'CAD', label: 'CAD — Canadian Dollar' },
            { value: 'EUR', label: 'EUR — Euro' },
            { value: 'GBP', label: 'GBP — British Pound' },
            { value: 'AUD', label: 'AUD — Australian Dollar' },
          ]}
          value={currency}
          onChange={(v) => setCurrency(v ?? 'USD')}
          allowDeselect={false}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={pending}>
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
