import { notFound } from 'next/navigation';
import { Anchor, Group, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BillForm } from '@/components/bills/BillForm';
import { formatCurrency } from '@/lib/format';
import type { Bill, BillPayment } from '@/types/database';
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

  const amount = Number((bill as Bill).amount);
  const paid = Number((bill as Bill).amount_paid);
  const remaining = Math.max(0, amount - paid);

  return (
    <Stack gap="xl">
      <Stack gap={4}>
        <Anchor component={Link} href="/bills" size="sm">
          ← Back to bills
        </Anchor>
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2}>{(bill as Bill).name}</Title>
            <Text c="dimmed">
              {formatCurrency(amount)} total · {formatCurrency(remaining)} remaining
            </Text>
          </div>
          <DeleteBillButton id={(bill as Bill).id} name={(bill as Bill).name} />
        </Group>
      </Stack>

      <PaymentHistory
        billId={(bill as Bill).id}
        remaining={remaining}
        payments={(payments ?? []) as BillPayment[]}
      />

      <Stack gap="sm">
        <Title order={4}>Edit details</Title>
        <BillForm bill={bill as Bill} />
      </Stack>
    </Stack>
  );
}
