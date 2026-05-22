import { Card, Group, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';
import type { Income } from '@/types/database';
import { IncomeRow } from '@/components/income/IncomeRow';
import { LinkButton } from '@/components/ui/links';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';

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
    <Stack gap="lg">
      <PageHeader
        title="Income"
        description={`${income.length} entries · ${formatCurrency(total)} total`}
        action={
          <LinkButton href="/income/new" leftSection={<IconPlus size={16} />}>
            New income
          </LinkButton>
        }
      />

      {income.length === 0 ? (
        <Card p="xl">
          <Stack align="center" gap="sm">
            <Text fw={600}>No income recorded yet</Text>
            <Text c="dimmed" size="sm">
              Add your first paycheck or misc income.
            </Text>
            <LinkButton href="/income/new" leftSection={<IconPlus size={16} />}>
              Add income
            </LinkButton>
          </Stack>
        </Card>
      ) : (
        <SectionCard title="All income" padding={0}>
          <Stack gap={0}>
            {income.map((i, idx) => (
              <Group
                key={i.id}
                px="lg"
                py="sm"
                style={{
                  borderBottom:
                    idx < income.length - 1
                      ? '1px solid var(--mantine-color-default-border)'
                      : 'none',
                }}
              >
                <IncomeRow income={i} />
              </Group>
            ))}
          </Stack>
        </SectionCard>
      )}
    </Stack>
  );
}
