'use client';

import { useTransition } from 'react';
import { ActionIcon, Badge, Group, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { deleteIncome } from '@/app/(app)/income/actions';
import { formatCurrency } from '@/lib/format';
import type { Income } from '@/types/database';

export function IncomeRow({ income }: { income: Income }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    modals.openConfirmModal({
      title: 'Delete income',
      children: `Delete "${income.source}" (${formatCurrency(income.amount)})?`,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deleteIncome(income.id);
            notifications.show({ color: 'teal', message: 'Income deleted.' });
          } catch (err) {
            notifications.show({
              color: 'red',
              message: err instanceof Error ? err.message : 'Failed',
            });
          }
        });
      },
    });
  }

  return (
    <Group justify="space-between" wrap="nowrap" w="100%">
      <Stack gap={0} style={{ minWidth: 0 }}>
        <Group gap="xs" wrap="nowrap">
          <Text fw={500} truncate>
            {income.source}
          </Text>
          {income.is_misc && (
            <Badge size="xs" variant="light" color="violet">
              misc
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {dayjs(income.received_date).format('MMM D, YYYY')}
          {income.description ? ` · ${income.description}` : ''}
        </Text>
      </Stack>
      <Group gap="sm" wrap="nowrap">
        <Text fw={600} c="teal">
          +{formatCurrency(income.amount)}
        </Text>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={handleDelete}
          aria-label="Delete"
          loading={pending}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Group>
  );
}
