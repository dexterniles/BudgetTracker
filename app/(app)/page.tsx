import {
  Alert,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCalendarStats,
  IconCash,
  IconCoin,
  IconPlus,
  IconReceipt2,
  IconScale,
  IconWallet,
} from '@tabler/icons-react';
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
import { LinkAnchor } from '@/components/ui/links';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { QuickAction } from '@/components/ui/QuickAction';
import type { Bill, Income } from '@/types/database';

const PERIODS_AHEAD = 6;

export default async function DashboardPage() {
  const settings = await getUserSettings();
  if (!settings) {
    return (
      <Stack gap="md">
        <PageHeader title="Welcome to Budget Tracker" />
        <Alert icon={<IconAlertCircle size={16} />} color="teal" title="Set your pay schedule" radius="lg">
          Before the dashboard can show pay-period totals, set a pay anchor date in{' '}
          <LinkAnchor href="/settings">Settings</LinkAnchor>. Pick any recent paycheck date —
          periods are 14-day windows from there.
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

  const billsThisPeriod = ((periodBills ?? []) as Bill[]).filter((b) => {
    const d = dayjs(b.due_date);
    return (
      d.isSame(current.start, 'day') ||
      (d.isAfter(current.start) && d.isBefore(dayjs(current.end).add(1, 'day')))
    );
  });

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
    const total = ((periodBills ?? []) as Bill[])
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
      <PageHeader
        title="Dashboard"
        description={`Current pay period: ${formatPayPeriodLabel(current)}`}
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatCard
          label="Bills due this period"
          value={formatCurrency(currentBillsTotal)}
          sublabel={`${billsThisPeriod.filter((b) => b.status !== 'paid').length} unpaid`}
          icon={<IconReceipt2 size={22} />}
          color="grape"
        />
        <StatCard
          label="Income this period"
          value={formatCurrency(currentIncomeTotal)}
          sublabel={`${(periodIncome ?? []).length} entries`}
          icon={<IconCoin size={22} />}
          color="teal"
          valueColor="teal"
        />
        <StatCard
          label="Net"
          value={formatCurrency(net)}
          sublabel={net >= 0 ? 'Surplus' : 'Shortfall'}
          icon={<IconScale size={22} />}
          color={net >= 0 ? 'teal' : 'red'}
          valueColor={net >= 0 ? 'teal' : 'red'}
        />
      </SimpleGrid>

      <SectionCard title="Quick access">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          <QuickAction
            href="/bills/new"
            icon={<IconReceipt2 size={20} />}
            label="New bill"
            color="grape"
          />
          <QuickAction
            href="/income/new"
            icon={<IconCash size={20} />}
            label="New income"
            color="teal"
          />
          <QuickAction
            href="/loans/new"
            icon={<IconWallet size={20} />}
            label="New loan"
            color="indigo"
          />
          <QuickAction
            href="/calendar"
            icon={<IconCalendarStats size={20} />}
            label="Calendar"
            color="orange"
          />
        </SimpleGrid>
      </SectionCard>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <SectionCard
          title="Upcoming (next 7 days)"
          action={
            <LinkAnchor href="/bills" size="sm">
              All bills →
            </LinkAnchor>
          }
        >
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
        </SectionCard>

        <SectionCard title="Bills per pay period">
          {chartData.every((d) => d.bills === 0) ? (
            <Text c="dimmed" size="sm">
              No bills scheduled in the next {PERIODS_AHEAD} pay periods.
            </Text>
          ) : (
            <PayPeriodBarChart data={chartData} />
          )}
        </SectionCard>
      </SimpleGrid>

      <SectionCard
        title="Recent income"
        action={
          <LinkAnchor href="/income" size="sm">
            All →
          </LinkAnchor>
        }
      >
        {(recentIncome ?? []).length === 0 ? (
          <Group gap="xs">
            <IconPlus size={14} />
            <LinkAnchor href="/income/new" size="sm">
              Add your first income
            </LinkAnchor>
          </Group>
        ) : (
          <Stack gap={0}>
            {((recentIncome as Income[] | null) ?? []).map((i, idx, arr) => (
              <Group
                key={i.id}
                justify="space-between"
                py="sm"
                style={{
                  borderBottom:
                    idx < arr.length - 1
                      ? '1px solid var(--mantine-color-default-border)'
                      : 'none',
                }}
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
      </SectionCard>
    </Stack>
  );
}
