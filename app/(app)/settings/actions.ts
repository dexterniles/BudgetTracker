'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const payAnchorDate = String(formData.get('pay_anchor_date') ?? '').trim();
  const currency = String(formData.get('currency') ?? 'USD').trim() || 'USD';
  if (!payAnchorDate) throw new Error('Pay anchor date required');

  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    pay_anchor_date: payAnchorDate,
    currency,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/', 'layout');
}
