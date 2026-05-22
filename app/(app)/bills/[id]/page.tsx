import { notFound } from 'next/navigation';
import { Stack } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { BillForm } from '@/components/bills/BillForm';
import { formatCurrency } from '@/lib/format';
import type { Bill, BillPayment } from '@/types/database';
import { LinkAnchor } from '@/components/ui/links';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { PaymentHistory } from './PaymentHistory';
import { DeleteBillButton } from './DeleteBillButton';

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bill } = await supabase
    .from('bills')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!bill) notFound();

  const { data: payments } = await supabase
    .from('bill_payments')
    .select('*')
    .eq('bill_id', id)
    .order('paid_date', { ascending: false });

  const B = bill as Bill;
  const amount = Number(B.amount);
  const paid = Number(B.amount_paid);
  const remaining = Math.max(0, amount - paid);

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <LinkAnchor href="/bills" size="sm">
          ← Back to bills
        </LinkAnchor>
        <PageHeader
          title={B.name}
          description={`${formatCurrency(amount)} total · ${formatCurrency(remaining)} remaining`}
          action={<DeleteBillButton id={B.id} name={B.name} />}
        />
      </Stack>

      <PaymentHistory
        billId={B.id}
        remaining={remaining}
        payments={(payments ?? []) as BillPayment[]}
      />

      <SectionCard title="Edit details">
        <BillForm bill={B} />
      </SectionCard>
    </Stack>
  );
}
