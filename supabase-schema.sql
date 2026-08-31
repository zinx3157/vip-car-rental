-- Run once in Supabase Dashboard > SQL Editor for the VIP Car Rental project.
create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reference_code text generated always as ('VIP-' || upper(substr(replace(id::text, '-', ''), 1, 8))) stored,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  phone text not null check (char_length(phone) between 8 and 24),
  email text not null check (char_length(email) between 3 and 254),
  pickup_location text not null check (char_length(pickup_location) between 2 and 200),
  destination text not null check (char_length(destination) between 2 and 200),
  pickup_date date not null check (pickup_date >= current_date),
  pickup_time time not null,
  vehicle_type text not null check (vehicle_type in ('Berline','SUV','Van','Pickup')),
  service_type text not null check (service_type in ('VIP','Mariage','Entreprise / ONG')),
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'En attente' check (status in ('En attente','Confirmée','En mission','Terminée','Annulée')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reservations enable row level security;
revoke all on table public.reservations from anon, authenticated;
grant insert on table public.reservations to anon, authenticated;
grant select, update on table public.reservations to authenticated;

drop policy if exists "Public can create reservations" on public.reservations;
create policy "Public can create reservations" on public.reservations
for insert to anon, authenticated with check (status = 'En attente');

drop policy if exists "Authenticated administrators can read reservations" on public.reservations;
create policy "Authenticated administrators can read reservations" on public.reservations
for select to authenticated using (true);

drop policy if exists "Authenticated administrators can update reservations" on public.reservations;
create policy "Authenticated administrators can update reservations" on public.reservations
for update to authenticated using (true) with check (true);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at before update on public.reservations
for each row execute function public.set_updated_at();
