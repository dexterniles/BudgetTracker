import { Card, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import type { Bill } from '@/types/database';
import { LinkButton } from '@/components/ui/links';
import { PageHeader } from '@/components/ui/PageHeader';
import { BillsList } from './BillsList';

export default async function BillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });

  const bills = (data ?? []) as Bill[];

  return (
    <Stack gap="lg">
      <PageHeader
        title="Bills"
        description={`${bills.length} total`}
        action={
          <LinkButton href="/bills/new" leftSection={<IconPlus size={16} />}>
            New bill
          </LinkButton>
        }
      />

      {bills.length === 0 ? (
        <Card p="xl">
          <Stack align="center" gap="sm">
            <Text fw={600}>No bills yet</Text>
            <Text c="dimmed" size="sm" ta="center">
              Add your first bill to get started.
            </Text>
            <LinkButton href="/bills/new" leftSection={<IconPlus size={16} />}>
              Add a bill
            </LinkButton>
          </Stack>
        </Card>
      ) : (
        <BillsList bills={bills} />
      )}
    </Stack>
  );
}
