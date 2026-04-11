-- ============================================================
-- CHEKKU OIL SHOP - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
-- ============================================================

-- 1. PRODUCTS TABLE
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_tamil  text,
  category    text not null,
  size        text not null,
  unit        text not null,
  price       numeric(10,2) not null check (price >= 0),
  active      boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. CUSTOMERS TABLE
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  phone       text unique,
  address     text,
  total_spent numeric(12,2) default 0,
  visit_count integer default 0,
  created_at  timestamptz default now()
);

-- 3. BILLS TABLE
create table if not exists bills (
  id           uuid primary key default gen_random_uuid(),
  bill_number  bigint generated always as identity,
  customer_id  uuid references customers(id) on delete set null,
  subtotal     numeric(10,2) not null,
  discount     numeric(10,2) default 0,
  total        numeric(10,2) not null,
  payment_mode text not null default 'cash' check (payment_mode in ('cash','upi','card')),
  notes        text,
  status       text not null default 'paid' check (status in ('paid','cancelled')),
  created_at   timestamptz default now()
);

-- 4. BILL ITEMS TABLE
create table if not exists bill_items (
  id           uuid primary key default gen_random_uuid(),
  bill_id      uuid not null references bills(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  size         text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(10,2) not null,
  line_total   numeric(10,2) not null
);

-- 5. EXPENSES TABLE (optional, for tracking daily expenses)
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  description text not null,
  amount      numeric(10,2) not null,
  category    text default 'general',
  created_at  timestamptz default now()
);

-- ============================================================
-- INDEXES for fast queries
-- ============================================================
create index if not exists idx_bills_created_at on bills(created_at desc);
create index if not exists idx_bills_customer on bills(customer_id);
create index if not exists idx_bill_items_bill on bill_items(bill_id);
create index if not exists idx_customers_phone on customers(phone);

-- ============================================================
-- AUTO-UPDATE updated_at on products
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ============================================================
-- UPDATE customer stats when a bill is saved
-- ============================================================
create or replace function update_customer_stats()
returns trigger as $$
begin
  if NEW.customer_id is not null then
    update customers
    set total_spent = total_spent + NEW.total,
        visit_count = visit_count + 1
    where id = NEW.customer_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger bill_customer_stats
  after insert on bills
  for each row execute function update_customer_stats();

-- ============================================================
-- ROW LEVEL SECURITY (enable after adding auth)
-- ============================================================
alter table products enable row level security;
alter table bills enable row level security;
alter table bill_items enable row level security;
alter table customers enable row level security;
alter table expenses enable row level security;

-- Allow all operations for authenticated users only
create policy "Authenticated users full access" on products
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on bills
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on bill_items
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on customers
  for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on expenses
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- ENABLE REALTIME on bills table
-- ============================================================
alter publication supabase_realtime add table bills;
alter publication supabase_realtime add table products;

-- ============================================================
-- SEED: DEFAULT PRODUCTS (edit prices as needed)
-- ============================================================
insert into products (name, name_tamil, category, size, unit, price, sort_order) values
  ('Gingely Oil',    'நல்லெண்ணெய்',       'Oils',         '200ml', 'ml',  95,  1),
  ('Gingely Oil',    'நல்லெண்ணெய்',       'Oils',         '500ml', 'ml',  220, 2),
  ('Gingely Oil',    'நல்லெண்ணெய்',       'Oils',         '1L',    'L',   420, 3),
  ('Coconut Oil',    'தேங்காய் எண்ணெய்',  'Oils',         '200ml', 'ml',  80,  4),
  ('Coconut Oil',    'தேங்காய் எண்ணெய்',  'Oils',         '500ml', 'ml',  185, 5),
  ('Coconut Oil',    'தேங்காய் எண்ணெய்',  'Oils',         '1L',    'L',   350, 6),
  ('Groundnut Oil',  'கடலெண்ணெய்',        'Oils',         '200ml', 'ml',  70,  7),
  ('Groundnut Oil',  'கடலெண்ணெய்',        'Oils',         '500ml', 'ml',  160, 8),
  ('Groundnut Oil',  'கடலெண்ணெய்',        'Oils',         '1L',    'L',   300, 9),
  ('Sesame Oil',     'எள்ளெண்ணெய்',       'Oils',         '200ml', 'ml',  90,  10),
  ('Sesame Oil',     'எள்ளெண்ணெய்',       'Oils',         '500ml', 'ml',  210, 11),
  ('Sesame Oil',     'எள்ளெண்ணெய்',       'Oils',         '1L',    'L',   400, 12),
  ('Ghee',           'நெய்',               'Ghee',         '200ml', 'ml',  180, 13),
  ('Ghee',           'நெய்',               'Ghee',         '500ml', 'ml',  420, 14),
  ('Ghee',           'நெய்',               'Ghee',         '1L',    'L',   820, 15),
  ('Toor Dal',       'துவரம் பருப்பு',     'Dal & Sugar',  '500g',  'g',   65,  16),
  ('Toor Dal',       'துவரம் பருப்பு',     'Dal & Sugar',  '1Kg',   'Kg',  125, 17),
  ('Nattu Sakkarai', 'நாட்டு சர்க்கரை',   'Dal & Sugar',  '500g',  'g',   55,  18),
  ('Nattu Sakkarai', 'நாட்டு சர்க்கரை',   'Dal & Sugar',  '1Kg',   'Kg',  105, 19);
