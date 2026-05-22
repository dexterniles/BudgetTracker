import { notFound } from 'next/navigation';
import { Progress, SimpleGrid, Stack } from '@mantine/core';
import {
  IconCalendarDot,
  IconCurrencyDollar,
  IconTrendingDown,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';
import { LoanForm } from '@/components/loans/LoanForm';
import type { Loan, LoanPayment } from '@/types/database';
import { LinkAnchor } from '@/components/ui/links';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
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
    <Stack gap="lg">
      <Stack gap={4}>
        <LinkAnchor href="/loans" size="sm">
          ← Back to loans
        </LinkAnchor>
        <PageHeader
          title={L.name}
          description={`${L.lender ?? '—'} · ${Number(L.apr).toFixed(2)}% APR · ${formatCurrency(L.minimum_payment)}/mo`}
          action={<DeleteLoanButton id={L.id} name={L.name} />}
        />
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatCard
          label="Current balance"
          value={formatCurrency(balance)}
          sublabel={`of ${formatCurrency(principal)} original`}
          icon={<IconCurrencyDollar size={22} />}
          color="indigo"
        />
        <StatCard
          label="Paid down"
          value={formatCurrency(paid)}
          sublabel={`${pct.toFixed(1)}% complete`}
          icon={<IconTrendingDown size={22} />}
          color="teal"
          valueColor="teal"
        />
        <StatCard
          label="Projected payoff"
          value={L.projected_payoff_date ? dayjs(L.projected_payoff_date).format('MMM YYYY') : '—'}
          sublabel={`at ${formatCurrency(L.minimum_payment)}/mo`}
          icon={<IconCalendarDot size={22} />}
          color="orange"
        />
      </SimpleGrid>

      <SectionCard title="Progress">
        <Progress value={pct} color="teal" size="lg" />
      </SectionCard>

      <RecordPaymentForm
        loanId={L.id}
        currentBalance={balance}
        apr={Number(L.apr)}
        minimumPayment={Number(L.minimum_payment)}
      />

      <SectionCard title="Payment history" padding={0}>
        <PaymentHistoryTable loanId={L.id} payments={(payments ?? []) as LoanPayment[]} />
      </SectionCard>

      <SectionCard title="Edit details">
        <LoanForm loan={L} />
      </SectionCard>
    </Stack>
  );
}
