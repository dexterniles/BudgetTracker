import Link from 'next/link';
import {
  Alert,
  Anchor,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { createClient } from '@/lib/supabase/server';
import { getUserSettings } from '@/lib/settings';
import {
  formatPayPeriodLabel,
  getCurrentPayPeriod,
  getNextNPayPeriods,
} from '@/lib/pay-period';
import { formatCurrency } from '@/lib/format';
import { BillCard } from '@/components/bills/BillCard';
import { PayPeriodBarChart } from '@/components/charts/PayPeriodBarChart';
import type { Bill, Income } from '@/types/database';

const PERIODS_AHEAD = 6;

export default async function DashboardPage() {
  const settings = await getUserSettings();
  if (!settings) {
    return (
      <Stack gap="md">
        <Title order={2}>Welcome to Budget Tracker</Title>
        <Alert icon={<IconAlertCircle size={16} />} color="teal" title="Set your pay schedule">
          Before the dashboard can show pay-period totals, set a pay anchor date in{' '}
          <Anchor component={Link} href="/settings">
            Settings
          </Anchor>
          . Pick any recent paycheck date — periods are 14-day windows from there.
        </Alert>
      </Stack>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const current = getCurrentPayPeriod(settings.pay_anchor_date, today);
  const next6 = getNextNPayPeriods(settings.pay_anchor_date, PERIODS_AHEAD, today);
  const rangeStart = dayjs(current.start).format('YYYY-MM-DD');
  const rangeEnd = dayjs(next6[next6.length - 1].end).format('YYYY-MM-DD');
  const sevenDaysOut = dayjs(today).add(7, 'day').format('YYYY-MM-DD');

  const [{ data: periodBills }, { data: periodIncome }, { data: upcoming }, { data: recentIncome }] =
    await Promise.all([
      supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', rangeStart)
        .lte('due_date', rangeEnd)
        .order('due_date', { ascending: true }),
      supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .gte('received_date', dayjs(current.start).format('YYYY-MM-DD'))
        .lte('received_date', dayjs(current.end).format('YYYY-MM-DD')),
      supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'paid')
        .gte('due_date', dayjs(today).format('YYYY-MM-DD'))
        .lte('due_date', sevenDaysOut)
        .order('due_date', { ascending: true })
        .limit(5),
      supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .order('received_date', { ascending: false })
        .limit(5),
    ]);

  const billsThisPeriod = (periodBills ?? []).filter((b) => {
    const d = dayjs(b.due_date);
    return d.isSame(current.start, 'day') || (d.isAfter(current.start) && d.isBefore(dayjs(current.end).add(1, 'day')));
  }) as Bill[];

  const currentBillsTotal = billsThisPeriod.reduce(
    (s, b) => s + Math.max(0, Number(b.amount) - Number(b.amount_paid)),
    0,
  );
  const currentIncomeTotal = ((periodIncome as Income[] | null) ?? []).reduce(
    (s, i) => s + Number(i.amount),
    0,
  );
  const net = currentIncomeTotal - currentBillsTotal;

  const chartData = next6.map((p) => {
    const total = (periodBills ?? [])
      .filter((b) => {
        const d = dayjs(b.due_date);
        return (
          (d.isSame(p.start, 'day') || d.isAfter(p.start)) &&
          (d.isSame(p.end, 'day') || d.isBefore(p.end))
        );
      })
      .reduce((sum, b) => sum + Math.max(0, Number(b.amount) - Number(b.amount_paid)), 0);
    return { label: dayjs(p.start).format('MMM D'), bills: total };
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed">Current pay period: {formatPayPeriodLabel(current)}</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Bills due this period
          </Text>
          <Title order={3} mt={4}>
            {formatCurrency(currentBillsTotal)}
          </Title>
          <Text size="xs" c="dimmed">
            {billsThisPeriod.filter((b) => b.status !== 'paid').length} unpaid
          </Text>
        </Card>
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Income this period
          </Text>
          <Title order={3} mt={4} c="teal">
            {formatCurrency(currentIncomeTotal)}
          </Title>
          <Text size="xs" c="dimmed">
            {(periodIncome ?? []).length} entries
          </Text>
        </Card>
        <Card>
          <Text size="xs" c="dimmed" tt="uppercase">
            Net
          </Text>
          <Title order={3} mt={4} c={net >= 0 ? 'teal' : 'red'}>
            {formatCurrency(net)}
          </Title>
          <Text size="xs" c="dimmed">
            {net >= 0 ? 'Surplus' : 'Shortfall'}
          </Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card>
          <Group justify="space-between" mb="sm">
            <Title order={4}>Upcoming (next 7 days)</Title>
            <Anchor component={Link} href="/bills" size="sm">
              All bills →
            </Anchor>
          </Group>
          {(upcoming ?? []).length === 0 ? (
            <Text c="dimmed" size="sm">
              Nothing due in the next 7 days.
            </Text>
          ) : (
            <Stack gap="sm">
              {((upcoming as Bill[] | null) ?? []).map((b) => (
                <BillCard key={b.id} bill={b} />
              ))}
            </Stack>
          )}
        </Card>

        <Card>
          <Title order={4} mb="sm">
            Bills per pay period
          </Title>
          {chartData.every((d) => d.bills === 0) ? (
            <Text c="dimmed" size="sm">
              No bills scheduled in the next {PERIODS_AHEAD} pay periods.
            </Text>
          ) : (
            <PayPeriodBarChart data={chartData} />
          )}
        </Card>
      </SimpleGrid>

      <Card>
        <Group justify="space-between" mb="sm">
          <Title order={4}>Recent income</Title>
          <Group>
            <Button
              component={Link}
              href="/income/new"
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
            >
              Add
            </Button>
            <Anchor component={Link} href="/income" size="sm">
              All →
            </Anchor>
          </Group>
        </Group>
        {(recentIncome ?? []).length === 0 ? (
          <Text c="dimmed" size="sm">
            No income recorded yet.
          </Text>
        ) : (
          <Stack gap={4}>
            {((recentIncome as Income[] | null) ?? []).map((i) => (
              <Group
                key={i.id}
                justify="space-between"
                py="xs"
                style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
              >
                <Stack gap={0}>
                  <Text fw={500}>{i.source}</Text>
                  <Text size="xs" c="dimmed">
                    {dayjs(i.received_date).format('MMM D, YYYY')}
                  </Text>
                </Stack>
                <Text fw={600} c="teal">
                  +{formatCurrency(i.amount)}
                </Text>
              </Group>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
