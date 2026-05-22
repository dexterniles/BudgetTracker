import Link from 'next/link';
import { Card, Group, Progress, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { formatCurrency } from '@/lib/format';
import type { Loan } from '@/types/database';

const TYPE_LABEL: Record<Loan['loan_type'], string> = {
  student: 'Student',
  auto: 'Auto',
  phone: 'Phone',
  personal: 'Personal',
  mortgage: 'Mortgage',
  other: 'Other',
};

export function LoanCard({ loan }: { loan: Loan }) {
  const principal = Number(loan.principal);
  const balance = Number(loan.current_balance);
  const paid = Math.max(0, principal - balance);
  const pct = principal > 0 ? (paid / principal) * 100 : 0;

  return (
    <Card component={Link} href={`/loans/${loan.id}`} style={{ textDecoration: 'none' }}>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text fw={600} truncate>
              {loan.name}
            </Text>
            <Text size="xs" c="dimmed">
              {TYPE_LABEL[loan.loan_type]}
              {loan.lender ? ` · ${loan.lender}` : ''}
            </Text>
          </Stack>
          <Stack gap={0} align="flex-end">
            <Text fw={600}>{formatCurrency(balance)}</Text>
            <Text size="xs" c="dimmed">
              {pct.toFixed(0)}% paid
            </Text>
          </Stack>
        </Group>
        <Progress value={pct} color="teal" size="sm" />
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            {formatCurrency(loan.minimum_payment)}/mo · {Number(loan.apr).toFixed(2)}% APR
          </Text>
          {loan.projected_payoff_date && (
            <Text size="xs" c="dimmed">
              Payoff: {dayjs(loan.projected_payoff_date).format('MMM YYYY')}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
