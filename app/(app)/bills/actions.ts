'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type BillFormShape = {
  name: string;
  description: string;
  amount: number;
  due_date: string;
  category: string;
  is_installment: boolean;
  installment_number: number | null;
  installment_total: number | null;
};

function parseBillForm(formData: FormData): BillFormShape {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const amountRaw = String(formData.get('amount') ?? '');
  const due_date = String(formData.get('due_date') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();
  const is_installment = formData.get('is_installment') === 'on' || formData.get('is_installment') === 'true';
  const inum = formData.get('installment_number');
  const itot = formData.get('installment_total');

  if (!name) throw new Error('Name is required');
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Amount must be a positive number');
  if (!due_date) throw new Error('Due date is required');

  return {
    name,
    description,
    amount,
    due_date,
    category,
    is_installment,
    installment_number: is_installment && inum ? Number(inum) : null,
    installment_total: is_installment && itot ? Number(itot) : null,
  };
}

export async function createBill(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const parsed = parseBillForm(formData);
  const { error } = await supabase.from('bills').insert({
    user_id: user.id,
    name: parsed.name,
    description: parsed.description || null,
    amount: parsed.amount,
    due_date: parsed.due_date,
    category: parsed.category || null,
    is_installment: parsed.is_installment,
    installment_number: parsed.installment_number,
    installment_total: parsed.installment_total,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/bills');
  revalidatePath('/');
  redirect('/bills');
}

export async function updateBill(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const parsed = parseBillForm(formData);
  const { error } = await supabase
    .from('bills')
    .update({
      name: parsed.name,
      description: parsed.description || null,
      amount: parsed.amount,
      due_date: parsed.due_date,
      category: parsed.category || null,
      is_installment: parsed.is_installment,
      installment_number: parsed.installment_number,
      installment_total: parsed.installment_total,
    })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);

  revalidatePath('/bills');
  revalidatePath(`/bills/${id}`);
  revalidatePath('/');
}

export async function deleteBill(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bills');
  revalidatePath('/');
}

export async function markBillPaid(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: bill } = await supabase
    .from('bills')
    .select('amount, amount_paid')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!bill) throw new Error('Bill not found');

  const remaining = Number(bill.amount) - Number(bill.amount_paid);
  if (remaining <= 0) return;

  const { error } = await supabase.from('bill_payments').insert({
    bill_id: id,
    amount: remaining,
    paid_date: new Date().toISOString().slice(0, 10),
    note: 'Marked paid',
  });
  if (error) throw new Error(error.message);

  revalidatePath('/bills');
  revalidatePath(`/bills/${id}`);
  revalidatePath('/');
}

export async function recordPayment(billId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify ownership
  const { data: bill } = await supabase
    .from('bills')
    .select('id')
    .eq('id', billId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!bill) throw new Error('Bill not found');

  const amount = Number(formData.get('amount'));
  const paid_date = String(formData.get('paid_date') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be positive');
  if (!paid_date) throw new Error('Date required');

  const { error } = await supabase.from('bill_payments').insert({
    bill_id: billId,
    amount,
    paid_date,
    note: note || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/bills');
  revalidatePath(`/bills/${billId}`);
  revalidatePath('/');
}

export async function deletePayment(paymentId: string, billId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('bill_payments').delete().eq('id', paymentId);
  if (error) throw new Error(error.message);
  revalidatePath('/bills');
  revalidatePath(`/bills/${billId}`);
  revalidatePath('/');
}
