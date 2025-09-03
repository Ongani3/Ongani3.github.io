-- 1) Complaints table for customer submissions tied to a store (using existing store_settings as the store entity)
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null,
  store_settings_id uuid not null references public.store_settings(id) on delete cascade,
  subject text not null,
  message text not null,
  order_ref text,
  status text not null default 'open',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.complaints enable row level security;

-- Helpful indexes
create index if not exists idx_complaints_store on public.complaints (store_settings_id);
create index if not exists idx_complaints_customer on public.complaints (customer_user_id);
create index if not exists idx_complaints_created on public.complaints (created_at desc);

-- updated_at trigger: drop then create to be idempotent
drop trigger if exists update_complaints_updated_at on public.complaints;
create trigger update_complaints_updated_at
before update on public.complaints
for each row
execute function public.update_updated_at_column();

-- RLS Policies for complaints (drop if exists then create)
DO $$ BEGIN
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'complaints' and policyname = 'Customers can create their own complaints'
  ) then
    execute 'drop policy "Customers can create their own complaints" on public.complaints';
  end if;
END $$;
create policy "Customers can create their own complaints"
on public.complaints
for insert
to authenticated
with check (auth.uid() = customer_user_id);

DO $$ BEGIN
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'complaints' and policyname = 'Customers can view their own complaints'
  ) then
    execute 'drop policy "Customers can view their own complaints" on public.complaints';
  end if;
END $$;
create policy "Customers can view their own complaints"
on public.complaints
for select
to authenticated
using (auth.uid() = customer_user_id);

DO $$ BEGIN
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'complaints' and policyname = 'Store owners can view their store complaints'
  ) then
    execute 'drop policy "Store owners can view their store complaints" on public.complaints';
  end if;
END $$;
create policy "Store owners can view their store complaints"
on public.complaints
for select
to authenticated
using (
  exists (
    select 1
    from public.store_settings ss
    where ss.id = complaints.store_settings_id
      and ss.user_id = auth.uid()
  )
);

DO $$ BEGIN
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'complaints' and policyname = 'Store owners can update their store complaints'
  ) then
    execute 'drop policy "Store owners can update their store complaints" on public.complaints';
  end if;
END $$;
create policy "Store owners can update their store complaints"
on public.complaints
for update
to authenticated
using (
  exists (
    select 1
    from public.store_settings ss
    where ss.id = complaints.store_settings_id
      and ss.user_id = auth.uid()
  )
);

-- 2) Public visibility for active promotions so customers can see them
DO $$ BEGIN
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'promotions' and policyname = 'Public can view active promotions'
  ) then
    execute 'drop policy "Public can view active promotions" on public.promotions';
  end if;
END $$;
create policy "Public can view active promotions"
on public.promotions
for select
to public
using (
  is_active = true
  and now() >= start_date
  and now() <= end_date
);

-- 3) Public visibility for store list so customers can pick a store
DO $$ BEGIN
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'store_settings' and policyname = 'Public can view store list'
  ) then
    execute 'drop policy "Public can view store list" on public.store_settings';
  end if;
END $$;
create policy "Public can view store list"
on public.store_settings
for select
to public
using (true);
