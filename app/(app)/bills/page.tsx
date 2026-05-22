import Link from 'next/link';
import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import type { Bill } from '@/types/database';
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
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Bills</Title>
          <Text c="dimmed">{bills.length} total</Text>
        </div>
        <Button component={Link} href="/bills/new" leftSection={<IconPlus size={16} />}>
          New bill
        </Button>
      </Group>

      {bills.length === 0 ? (
        <Card p="xl">
          <Stack align="center" gap="sm">
            <Text fw={600}>No bills yet</Text>
            <Text c="dimmed" size="sm">
              Add your first bill to get started.
            </Text>
            <Button component={Link} href="/bills/new" leftSection={<IconPlus size={16} />}>
              Add a bill
            </Button>
          </Stack>
        </Card>
      ) : (
        <BillsList bills={bills} />
      )}
    </Stack>
  );
}
