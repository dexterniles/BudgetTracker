'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function parseForm(formData: FormData) {
  const source = String(formData.get('source') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const received_date = String(formData.get('received_date') ?? '').trim();
  const is_misc = formData.get('is_misc') === 'on' || formData.get('is_misc') === 'true';
  const amount = Number(formData.get('amount'));
  if (!source) throw new Error('Source is required');
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Amount must be positive');
  if (!received_date) throw new Error('Date required');
  return { source, description: description || null, received_date, is_misc, amount };
}

export async function createIncome(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const parsed = parseForm(formData);
  const { error } = await supabase.from('income').insert({ user_id: user.id, ...parsed });
  if (error) throw new Error(error.message);
  revalidatePath('/income');
  revalidatePath('/');
  redirect('/income');
}

export async function updateIncome(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const parsed = parseForm(formData);
  const { error } = await supabase
    .from('income')
    .update(parsed)
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
  revalidatePath('/income');
  revalidatePath('/');
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('income').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/income');
  revalidatePath('/');
}
