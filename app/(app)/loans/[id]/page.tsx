import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Anchor,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';
import { LoanForm } from '@/components/loans/LoanForm';
import type { Loan, LoanPayment } from '@/types/database';
import { RecordPaymentForm } from './RecordPaymentForm';
import { PaymentHistoryTable } from './PaymentHistoryTable';
import { DeleteLoanButton } from './DeleteLoanButton';

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!loan) notFound();

  const { data: payments } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('loan_id', id)
    .order('payment_date', { ascending: false });

  const L = loan as Loan;
  const principal = Number(L.principal);
  const balance = Number(L.current_balance);
  const paid = Math.max(0, principal - balance);
  const pct = principal > 0 ? (paid / principal) * 100 : 0;

  return (
    <Stack gap="xl">
      <Stack gap={4}>
        <Anchor component={Link} href="/loans" size="sm">
          ← Back to loans
        </Anchor>
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2}>{L.name}</Title>
            <Text c="dimmed">
              {L.lender ?? '—'} · {Number(L.apr).toFixed(2)}% APR ·{' '}
              {formatCurrency(L.minimum_payment)}/mo
            </Text>
          </div>
          <DeleteLoanButton id={L.id} name={L.name} />
        </Group>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Current balance
          </Text>
          <Title order={3} mt={4}>
            {formatCurrency(balance)}
          </Title>
          <Text size="xs" c="dimmed">
            of {formatCurrency(principal)} original
          </Text>
        </Card>
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Paid down
          </Text>
          <Title order={3} mt={4} c="teal">
            {formatCurrency(paid)}
          </Title>
          <Progress value={pct} color="teal" size="sm" mt="xs" />
          <Text size="xs" c="dimmed" mt={4}>
            {pct.toFixed(1)}% complete
          </Text>
        </Card>
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Projected payoff
          </Text>
          <Title order={3} mt={4}>
            {L.projected_payoff_date ? dayjs(L.projected_payoff_date).format('MMM YYYY') : '—'}
          </Title>
          <Text size="xs" c="dimmed">
            at {formatCurrency(L.minimum_payment)}/mo
          </Text>
        </Card>
      </SimpleGrid>

      <RecordPaymentForm
        loanId={L.id}
        currentBalance={balance}
        apr={Number(L.apr)}
        minimumPayment={Number(L.minimum_payment)}
      />

      <Stack gap="sm">
        <Title order={4}>Payment history</Title>
        <PaymentHistoryTable loanId={L.id} payments={(payments ?? []) as LoanPayment[]} />
      </Stack>

      <Stack gap="sm">
        <Title order={4}>Edit details</Title>
        <LoanForm loan={L} />
      </Stack>
    </Stack>
  );
}
