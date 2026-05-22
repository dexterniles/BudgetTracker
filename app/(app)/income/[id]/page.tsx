import { notFound } from 'next/navigation';
import { Stack } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { IncomeForm } from '@/components/income/IncomeForm';
import { formatCurrency } from '@/lib/format';
import type { Income } from '@/types/database';
import { LinkAnchor } from '@/components/ui/links';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { DeleteIncomeButton } from './DeleteIncomeButton';

export default async function IncomeDetailPage({
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

  const { data: income } = await supabase
    .from('income')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!income) notFound();
  const I = income as Income;

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <LinkAnchor href="/income" size="sm">
          ← Back to income
        </LinkAnchor>
        <PageHeader
          title={I.source}
          description={formatCurrency(I.amount)}
          action={<DeleteIncomeButton id={I.id} source={I.source} />}
        />
      </Stack>
      <SectionCard title="Edit income">
        <IncomeForm income={I} />
      </SectionCard>
    </Stack>
  );
}
