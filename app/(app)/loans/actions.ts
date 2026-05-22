'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { projectPayoffDate, splitPayment } from '@/lib/amortization';
import dayjs from 'dayjs';

const LOAN_TYPES = ['student', 'auto', 'phone', 'personal', 'mortgage', 'other'] as const;
type LoanType = (typeof LOAN_TYPES)[number];

function parseLoanForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const lender = String(formData.get('lender') ?? '').trim();
  const loan_type = String(formData.get('loan_type') ?? 'other') as LoanType;
  const principal = Number(formData.get('principal'));
  const current_balance = Number(formData.get('current_balance'));
  const apr = Number(formData.get('apr'));
  const minimum_payment = Number(formData.get('minimum_payment'));
  const start_date = String(formData.get('start_date') ?? '').trim();

  if (!name) throw new Error('Name required');
  if (!LOAN_TYPES.includes(loan_type)) throw new Error('Invalid loan type');
  if (!Number.isFinite(principal) || principal < 0) throw new Error('Principal invalid');
  if (!Number.isFinite(current_balance) || current_balance < 0)
    throw new Error('Current balance invalid');
  if (!Number.isFinite(apr) || apr < 0) throw new Error('APR invalid');
  if (!Number.isFinite(minimum_payment) || minimum_payment < 0)
    throw new Error('Minimum payment invalid');
  if (!start_date) throw new Error('Start date required');

  const projected = projectPayoffDate(current_balance, apr, minimum_payment);
  return {
    name,
    lender: lender || null,
    loan_type,
    principal,
    current_balance,
    apr,
    minimum_payment,
    payment_frequency: 'monthly',
    start_date,
    projected_payoff_date: projected ? dayjs(projected).format('YYYY-MM-DD') : null,
  };
}

export async function createLoan(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const parsed = parseLoanForm(formData);
  const { data, error } = await supabase
    .from('loans')
    .insert({ user_id: user.id, ...parsed })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/loans');
  revalidatePath('/');
  redirect(`/loans/${data.id}`);
}

export async function updateLoan(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const parsed = parseLoanForm(formData);
  const { error } = await supabase
    .from('loans')
    .update(parsed)
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
  revalidatePath('/loans');
  revalidatePath(`/loans/${id}`);
  revalidatePath('/');
}

export async function deleteLoan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/loans');
  revalidatePath('/');
}

export async function recordLoanPayment(loanId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!loan) throw new Error('Loan not found');

  const amount = Number(formData.get('amount'));
  const payment_date = String(formData.get('payment_date') ?? '').trim();
  const extraPrincipal = Number(formData.get('extra_principal') || 0);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be positive');
  if (!payment_date) throw new Error('Date required');

  const currentBalance = Number(loan.current_balance);
  const { principal, interest } = splitPayment(currentBalance, Number(loan.apr), amount);
  const totalPrincipal = Math.min(principal + Math.max(0, extraPrincipal), currentBalance);
  const balanceAfter = Math.max(0, Math.round((currentBalance - totalPrincipal) * 100) / 100);

  const { error } = await supabase.from('loan_payments').insert({
    loan_id: loanId,
    payment_date,
    amount: amount + Math.max(0, extraPrincipal),
    principal_portion: totalPrincipal,
    interest_portion: interest,
    balance_after: balanceAfter,
  });
  if (error) throw new Error(error.message);

  // Recompute projected payoff date based on new balance
  const projected = projectPayoffDate(balanceAfter, Number(loan.apr), Number(loan.minimum_payment));
  await supabase
    .from('loans')
    .update({ projected_payoff_date: projected ? dayjs(projected).format('YYYY-MM-DD') : null })
    .eq('id', loanId);

  revalidatePath('/loans');
  revalidatePath(`/loans/${loanId}`);
  revalidatePath('/');
}

export async function deleteLoanPayment(paymentId: string, loanId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('loan_payments').delete().eq('id', paymentId);
  if (error) throw new Error(error.message);
  revalidatePath('/loans');
  revalidatePath(`/loans/${loanId}`);
}
