-- Budget Tracker initial schema
-- Apply this in Supabase SQL editor (or `supabase db push` if using CLI).

-- =====================================================================
-- user_settings: one row per user, holds pay anchor for bi-weekly calc
-- =====================================================================
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pay_anchor_date date not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user reads own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user inserts own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user updates own settings"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =====================================================================
-- bills
-- =====================================================================
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  amount numeric(10,2) not null check (amount >= 0),
  amount_paid numeric(10,2) not null default 0 check (amount_paid >= 0),
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid')),
  category text,
  is_installment boolean not null default false,
  installment_number int,
  installment_total int,
  created_at timestamptz not null default now()
);

create index bills_user_due_idx on public.bills (user_id, due_date);
create index bills_user_status_idx on public.bills (user_id, status);

alter table public.bills enable row level security;

create policy "user reads own bills" on public.bills for select using (auth.uid() = user_id);
create policy "user inserts own bills" on public.bills for insert with check (auth.uid() = user_id);
create policy "user updates own bills" on public.bills for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user deletes own bills" on public.bills for delete using (auth.uid() = user_id);


-- =====================================================================
-- bill_payments (audit log for partial payments)
-- =====================================================================
create table public.bill_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  paid_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index bill_payments_bill_idx on public.bill_payments (bill_id);

alter table public.bill_payments enable row level security;

-- bill_payments inherits access via parent bill ownership
create policy "user reads own bill payments"
  on public.bill_payments for select
  using (exists (
    select 1 from public.bills b
    where b.id = bill_payments.bill_id and b.user_id = auth.uid()
  ));

create policy "user inserts own bill payments"
  on public.bill_payments for insert
  with check (exists (
    select 1 from public.bills b
    where b.id = bill_payments.bill_id and b.user_id = auth.uid()
  ));

create policy "user deletes own bill payments"
  on public.bill_payments for delete
  using (exists (
    select 1 from public.bills b
    where b.id = bill_payments.bill_id and b.user_id = auth.uid()
  ));

-- Trigger: keep bills.amount_paid and status in sync with bill_payments
create or replace function public.recalc_bill_status(p_bill_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(10,2);
  v_amount numeric(10,2);
begin
  select coalesce(sum(amount), 0) into v_total
  from public.bill_payments where bill_id = p_bill_id;

  select amount into v_amount from public.bills where id = p_bill_id;

  update public.bills
    set amount_paid = v_total,
        status = case
          when v_total <= 0 then 'unpaid'
          when v_total >= v_amount then 'paid'
          else 'partial'
        end
  where id = p_bill_id;
end;
$$;

create or replace function public.tg_bill_payments_recalc()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_bill_status(old.bill_id);
    return old;
  else
    perform public.recalc_bill_status(new.bill_id);
    return new;
  end if;
end;
$$;

create trigger bill_payments_recalc
after insert or update or delete on public.bill_payments
for each row execute function public.tg_bill_payments_recalc();


-- =====================================================================
-- income
-- =====================================================================
create table public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  amount numeric(10,2) not null check (amount >= 0),
  received_date date not null,
  description text,
  is_misc boolean not null default false,
  created_at timestamptz not null default now()
);

create index income_user_date_idx on public.income (user_id, received_date);

alter table public.income enable row level security;

create policy "user reads own income" on public.income for select using (auth.uid() = user_id);
create policy "user inserts own income" on public.income for insert with check (auth.uid() = user_id);
create policy "user updates own income" on public.income for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user deletes own income" on public.income for delete using (auth.uid() = user_id);


-- =====================================================================
-- loans
-- =====================================================================
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lender text,
  loan_type text not null check (loan_type in ('student', 'auto', 'phone', 'personal', 'mortgage', 'other')),
  principal numeric(12,2) not null check (principal >= 0),
  current_balance numeric(12,2) not null check (current_balance >= 0),
  apr numeric(5,3) not null default 0 check (apr >= 0),
  minimum_payment numeric(10,2) not null check (minimum_payment >= 0),
  payment_frequency text not null default 'monthly',
  start_date date not null,
  projected_payoff_date date,
  created_at timestamptz not null default now()
);

create index loans_user_idx on public.loans (user_id);

alter table public.loans enable row level security;

create policy "user reads own loans" on public.loans for select using (auth.uid() = user_id);
create policy "user inserts own loans" on public.loans for insert with check (auth.uid() = user_id);
create policy "user updates own loans" on public.loans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user deletes own loans" on public.loans for delete using (auth.uid() = user_id);


-- =====================================================================
-- loan_payments (records each loan payment with principal/interest split)
-- =====================================================================
create table public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  payment_date date not null,
  amount numeric(10,2) not null check (amount > 0),
  principal_portion numeric(10,2) not null check (principal_portion >= 0),
  interest_portion numeric(10,2) not null check (interest_portion >= 0),
  balance_after numeric(12,2) not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);

create index loan_payments_loan_idx on public.loan_payments (loan_id, payment_date);

alter table public.loan_payments enable row level security;

create policy "user reads own loan payments"
  on public.loan_payments for select
  using (exists (
    select 1 from public.loans l
    where l.id = loan_payments.loan_id and l.user_id = auth.uid()
  ));

create policy "user inserts own loan payments"
  on public.loan_payments for insert
  with check (exists (
    select 1 from public.loans l
    where l.id = loan_payments.loan_id and l.user_id = auth.uid()
  ));

create policy "user deletes own loan payments"
  on public.loan_payments for delete
  using (exists (
    select 1 from public.loans l
    where l.id = loan_payments.loan_id and l.user_id = auth.uid()
  ));

-- Trigger: when a loan payment is inserted, update loans.current_balance
create or replace function public.tg_loan_payments_update_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.loans
      set current_balance = new.balance_after
    where id = new.loan_id;
    return new;
  elsif tg_op = 'DELETE' then
    -- Recompute balance from remaining payments
    update public.loans l
      set current_balance = coalesce(
        (select lp.balance_after from public.loan_payments lp
          where lp.loan_id = l.id order by lp.payment_date desc, lp.created_at desc limit 1),
        l.principal
      )
    where l.id = old.loan_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger loan_payments_update_balance
after insert or delete on public.loan_payments
for each row execute function public.tg_loan_payments_update_balance();
