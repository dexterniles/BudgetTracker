'use client';

import { useTransition } from 'react';
import { ActionIcon, Card, Table, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { deleteLoanPayment } from '@/app/(app)/loans/actions';
import { formatCurrency } from '@/lib/format';
import type { LoanPayment } from '@/types/database';

export function PaymentHistoryTable({
  loanId,
  payments,
}: {
  loanId: string;
  payments: LoanPayment[];
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    modals.openConfirmModal({
      title: 'Delete payment',
      children: 'Remove this loan payment? The balance will be recalculated.',
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deleteLoanPayment(id, loanId);
            notifications.show({ color: 'teal', message: 'Payment removed.' });
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

  if (payments.length === 0) {
    return (
      <Card>
        <Text c="dimmed" size="sm">
          No payments recorded yet.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Table verticalSpacing="xs" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Principal</Table.Th>
            <Table.Th>Interest</Table.Th>
            <Table.Th>Balance after</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {payments.map((p) => (
            <Table.Tr key={p.id}>
              <Table.Td>{dayjs(p.payment_date).format('MMM D, YYYY')}</Table.Td>
              <Table.Td>{formatCurrency(p.amount)}</Table.Td>
              <Table.Td>
                <Text c="teal">{formatCurrency(p.principal_portion)}</Text>
              </Table.Td>
              <Table.Td>
                <Text c="dimmed">{formatCurrency(p.interest_portion)}</Text>
              </Table.Td>
              <Table.Td>{formatCurrency(p.balance_after)}</Table.Td>
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
    </Card>
  );
}
