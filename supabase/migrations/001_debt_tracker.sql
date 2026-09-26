-- Debt Payoff tracker schema
-- Run in Supabase: SQL Editor > New query > paste > Run.
-- BEFORE RUNNING: replace WIFE_EMAIL_HERE near the bottom with your wife's email.

-- ---------- Household access ----------
create table if not exists public.household_members (
  email text primary key
);

create or replace function public.is_household_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- Tables ----------
create table if not exists public.cards (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner         text not null,
  min_payment   numeric(10,2) not null,
  start_balance numeric(12,2) not null,
  balance       numeric(12,2) not null,
  apr           numeric(5,2)  not null,
  apr_known     boolean not null default false,
  sort_order    int not null,
  updated_at    timestamptz not null default now()
);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.cards(id) on delete cascade,
  amount     numeric(10,2) not null check (amount > 0),
  paid_on    date not null default current_date,
  logged_by  text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
create index if not exists payments_card_id_idx on public.payments(card_id);

create table if not exists public.plan_settings (
  id            int primary key default 1 check (id = 1),
  extra_monthly numeric(10,2) not null default 375,
  updated_at    timestamptz not null default now()
);

-- ---------- Keep card balances in sync with payments ----------
create or replace function public.apply_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update cards set balance = greatest(0, balance - new.amount), updated_at = now()
     where id = new.card_id;
    return new;
  elsif tg_op = 'DELETE' then
    update cards set balance = balance + old.amount, updated_at = now()
     where id = old.card_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists payments_apply on public.payments;
create trigger payments_apply
after insert or delete on public.payments
for each row execute function public.apply_payment();

-- ---------- Row-level security ----------
alter table public.household_members enable row level security;
alter table public.cards          enable row level security;
alter table public.payments       enable row level security;
alter table public.plan_settings  enable row level security;

drop policy if exists "household read members" on public.household_members;
create policy "household read members" on public.household_members
  for select to authenticated using (public.is_household_member());

drop policy if exists "household all cards" on public.cards;
create policy "household all cards" on public.cards
  for all to authenticated
  using (public.is_household_member()) with check (public.is_household_member());

drop policy if exists "household all payments" on public.payments;
create policy "household all payments" on public.payments
  for all to authenticated
  using (public.is_household_member()) with check (public.is_household_member());

drop policy if exists "household all settings" on public.plan_settings;
create policy "household all settings" on public.plan_settings
  for all to authenticated
  using (public.is_household_member()) with check (public.is_household_member());

-- ---------- Realtime (both of you see changes live) ----------
do $$
begin
  begin alter publication supabase_realtime add table public.cards;         exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.payments;      exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.plan_settings; exception when duplicate_object then null; end;
end $$;

-- ---------- Seed ----------
insert into public.household_members (email) values
  ('derickmayberry@gmail.com'),
  ('derickmayberry@protonmail.com'),
  ('WIFE_EMAIL_HERE')
on conflict do nothing;

insert into public.plan_settings (id, extra_monthly) values (1, 375)
on conflict (id) do nothing;

-- APRs are estimates (apr_known = false) except where noted; update from each card's app.
insert into public.cards (name, owner, min_payment, start_balance, balance, apr, apr_known, sort_order)
select * from (values
  ('Credit One',              'Chase',  38.00,  908.00,  908.00, 29.90, false, 1),
  ('Merrick',                 'Chase',  39.00,  961.00,  961.00, 30.00, false, 2),
  ('Verve',                   'Chase',  48.00, 1201.00, 1201.00, 35.90, false, 3),
  ('Capital One QuickSilver', 'Derick',104.00, 3043.41, 3043.41, 29.60, false, 4),
  ('Capital One',             'Chase', 113.00, 3328.00, 3328.00, 29.50, false, 5),
  ('QuickSilver',             'Chase',  43.00, 1001.00, 1001.00, 29.50, false, 6),
  ('Prime',                   'Derick', 78.00, 2334.36, 2334.36, 28.00, false, 7),
  ('USAA',                    'Derick', 67.00, 1934.75, 1934.75, 22.00, false, 8),
  ('USAA',                    'Chase',  40.00,  942.00,  942.00, 22.00, false, 9)
) as v(name, owner, min_payment, start_balance, balance, apr, apr_known, sort_order)
where not exists (select 1 from public.cards);
