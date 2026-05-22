import Link from 'next/link';
import { Button, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/format';
import type { Loan } from '@/types/database';
import { LoanCard } from '@/components/loans/LoanCard';

export default async function LoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', user.id)
    .order('current_balance', { ascending: false });

  const loans = (data ?? []) as Loan[];
  const totalBalance = loans.reduce((s, l) => s + Number(l.current_balance), 0);
  const totalMonthly = loans.reduce((s, l) => s + Number(l.minimum_payment), 0);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Loans</Title>
          <Text c="dimmed">
            {formatCurrency(totalBalance)} owed · {formatCurrency(totalMonthly)}/mo minimum
          </Text>
        </div>
        <Button component={Link} href="/loans/new" leftSection={<IconPlus size={16} />}>
          New loan
        </Button>
      </Group>

      {loans.length === 0 ? (
        <Card p="xl">
          <Stack align="center" gap="sm">
            <Text fw={600}>No loans tracked</Text>
            <Text c="dimmed" size="sm">
              Add a student loan, car payment, phone installment, or any other debt.
            </Text>
            <Button component={Link} href="/loans/new" leftSection={<IconPlus size={16} />}>
              Add a loan
            </Button>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
