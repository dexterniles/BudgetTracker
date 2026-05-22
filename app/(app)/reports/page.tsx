import dayjs from 'dayjs';
import { createClient } from '@/lib/supabase/server';
import { getUserSettings } from '@/lib/settings';
import type { Bill, Income } from '@/types/database';
import { ReportsView } from './ReportsView';

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Pull a wide year-long window so most preset ranges work without re-fetching.
  const rangeStart = dayjs().subtract(13, 'month').format('YYYY-MM-DD');
  const rangeEnd = dayjs().add(2, 'month').format('YYYY-MM-DD');

  const [{ data: bills }, { data: income }, settings] = await Promise.all([
    supabase
      .from('bills')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', rangeStart)
      .lte('due_date', rangeEnd),
    supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .gte('received_date', rangeStart)
      .lte('received_date', rangeEnd),
    getUserSettings(),
  ]);

  return (
    <ReportsView
      bills={(bills ?? []) as Bill[]}
      income={(income ?? []) as Income[]}
      payAnchor={settings?.pay_anchor_date ?? null}
    />
  );
}
