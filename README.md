# Budget Tracker

Personal bill, income, and loan tracking. Built with Next.js 16, Mantine v9, and Supabase. Designed for low-friction budgeting: every page is one or two taps from logging a bill, income, or loan payment.

## Features

- **Bills** — name, amount, due date, category, description. Mark fully paid in one tap, or record partial payments (for installments like ZipPay, Affirm, car insurance). Payment history per bill.
- **Income** — paycheck or misc (Marketplace, side work, etc).
- **Loans** — full amortization. Tracks principal, APR, monthly payment, projected payoff date. Each payment is split into principal/interest and the balance auto-updates.
- **Dashboard** — current pay period totals (bills due, income, net), upcoming bills (next 7 days), bills-per-pay-period bar chart, recent income.
- **Calendar** — monthly grid with daily totals; click any day to see what's due.
- **Reports** — pick any date range (with presets: this/last pay period, this month, last 3 months, YTD). Category donut + cashflow trend area chart.
- **Settings** — pay anchor date (drives bi-weekly pay periods) and currency.
- Magic-link sign-in (Supabase Auth). Mobile bottom nav + desktop sidebar.

## Setup

### 1. Create a Supabase project

1. Go to <https://supabase.com> and create a new project (free tier is fine).
2. Once created, go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and paste in the URL and anon key.

### 3. Apply the database schema

Open the Supabase SQL editor for your project and paste the contents of [`supabase/migrations/00000000000001_initial_schema.sql`](supabase/migrations/00000000000001_initial_schema.sql). Run it. This creates all tables, indexes, triggers, and row-level security policies.

### 4. Configure email auth

In Supabase: **Authentication → Providers → Email**. Enable it. Magic link is on by default.

Under **Authentication → URL Configuration**, add your redirect URLs:

- `http://localhost:3000/auth/callback` (dev)
- `https://YOUR-DOMAIN.vercel.app/auth/callback` (prod, after deploying)

### 5. Run locally

```bash
npm install   # if you haven't already
npm run dev
```

Open <http://localhost:3000>, sign in with your email, then visit **Settings** and set your pay anchor date (any recent paycheck date). The dashboard will populate as you add bills and income.

## Deploy to Vercel

1. Push the repo to GitHub (or your git host of choice).
2. In Vercel, **New Project → Import** that repo.
3. Add the two env vars from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Add the production `/auth/callback` URL to Supabase's allowed redirects (step 4 above).

## Project structure

```
app/
  (auth)/login/          Magic-link sign in
  (app)/                 Auth-gated routes inside the AppShell
    page.tsx             Dashboard
    bills/               List, new, [id] detail with payment history
    income/              List, new
    loans/               List, new, [id] detail with amortization schedule
    calendar/            Monthly calendar with daily totals
    reports/             Date-range reports with charts
    settings/            Pay anchor date + currency
  auth/callback/         OAuth/magic-link redirect handler
components/
  shell/AppShell.tsx     Responsive nav (sidebar desktop, bottom tabs mobile)
  bills/                 BillCard, BillForm, BillStatusBadge
  income/                IncomeForm, IncomeRow
  loans/                 LoanCard, LoanForm
  charts/                PayPeriodBarChart
lib/
  supabase/              Browser, server, and proxy auth clients
  pay-period.ts          Pure 14-day pay-period math (unit tested)
  amortization.ts        Pure principal/interest split + payoff projection (unit tested)
  format.ts              Currency, date, relative due-date formatters
  settings.ts            Helper to load user_settings
types/database.ts        DB row types (replace with `supabase gen types` output later)
supabase/migrations/     SQL schema
proxy.ts                 Next 16 proxy (formerly middleware) — refreshes Supabase session
theme.ts                 Mantine theme
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (pure logic: pay-period + amortization) |

## Notes

- **Pay periods** are bi-weekly, anchored to a date you pick in Settings. Change it any time — past data isn't affected.
- **Currency** is display-only (uses `Intl.NumberFormat`). The DB stores raw numbers.
- **Auth**: Single-user setup, but RLS is enabled. If you sign up a second user, their data is isolated.
- **Types**: `types/database.ts` is a hand-written stand-in for what `supabase gen types typescript` would produce. After your first migration, you can regenerate from the Supabase CLI to stay in sync if you change the schema.
