import Link from 'next/link';
import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';
import type { Income } from '@/types/database';
import { IncomeRow } from '@/components/income/IncomeRow';

export default async function IncomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', user.id)
    .order('received_date', { ascending: false });

  const income = (data ?? []) as Income[];
  const total = income.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Income</Title>
          <Text c="dimmed">
            {income.length} entries · {formatCurrency(total)} total
          </Text>
        </div>
        <Button component={Link} href="/income/new" leftSection={<IconPlus size={16} />}>
          New income
        </Button>
      </Group>

      {income.length === 0 ? (
        <Card p="xl">
          <Stack align="center" gap="sm">
            <Text fw={600}>No income recorded yet</Text>
            <Text c="dimmed" size="sm">
              Add your first paycheck or misc income.
            </Text>
            <Button component={Link} href="/income/new" leftSection={<IconPlus size={16} />}>
              Add income
            </Button>
          </Stack>
        </Card>
      ) : (
        <Card>
          <Stack gap={0}>
            {income.map((i) => (
              <IncomeRow key={i.id} income={i} />
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
