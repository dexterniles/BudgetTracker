import dayjs from 'dayjs';
import { createClient } from '@/lib/supabase/server';
import type { Bill } from '@/types/database';
import { CalendarView } from './CalendarView';

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Load a generous window (3 months before/after today) so the user can navigate
  // months without re-querying
  const today = dayjs();
  const rangeStart = today.subtract(3, 'month').startOf('month').format('YYYY-MM-DD');
  const rangeEnd = today.add(3, 'month').endOf('month').format('YYYY-MM-DD');

  const { data } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', user.id)
    .gte('due_date', rangeStart)
    .lte('due_date', rangeEnd)
    .order('due_date', { ascending: true });

  return (
    <CalendarView
      bills={(data ?? []) as Bill[]}
      initialMonth={today.startOf('month').format('YYYY-MM-DD')}
    />
  );
}
