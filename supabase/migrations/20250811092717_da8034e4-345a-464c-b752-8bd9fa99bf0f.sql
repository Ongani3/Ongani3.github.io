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

-- updated_at trigger
create trigger if not exists update_complaints_updated_at
before update on public.complaints
for each row
execute function public.update_updated_at_column();

-- RLS Policies for complaints
-- Customers: create & view their own
create policy if not exists "Customers can create their own complaints"
on public.complaints
for insert
to authenticated
with check (auth.uid() = customer_user_id);

create policy if not exists "Customers can view their own complaints"
on public.complaints
for select
to authenticated
using (auth.uid() = customer_user_id);

-- Store owners (admins): view & update complaints for their store(s)
create policy if not exists "Store owners can view their store complaints"
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

create policy if not exists "Store owners can update their store complaints"
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
create policy if not exists "Public can view active promotions"
on public.promotions
for select
to public
using (
  is_active = true
  and now() >= start_date
  and now() <= end_date
);

-- 3) Public visibility for store list so customers can pick a store
create policy if not exists "Public can view store list"
on public.store_settings
for select
to public
using (true);
