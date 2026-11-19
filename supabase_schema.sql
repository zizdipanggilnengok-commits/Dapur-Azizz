-- =====================================================================
-- Skema Database & Keamanan RLS untuk Dapur Aziz (Supabase PostgreSQL)
-- Jalankan seluruh skrip ini di Supabase Dashboard -> SQL Editor -> Run
-- =====================================================================

-- 1. Tabel profiles (terhubung ke auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null default 'Pelanggan Dapur Aziz',
  email text not null,
  no_hp text not null default '',
  alamat text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabel products (katalog menu makanan & minuman)
create table if not exists public.products (
  id text primary key,
  nama_produk text not null,
  kategori text not null check (kategori in ('Makanan', 'Minuman')),
  harga integer not null check (harga >= 0),
  deskripsi text not null default '',
  gambar_url text not null default '',
  tersedia boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabel orders (transaksi pesanan pelanggan)
create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  nama_pelanggan text not null,
  no_hp text not null default '',
  alamat_pengiriman text not null default '',
  total_harga integer not null check (total_harga > 0),
  jumlah_item integer not null check (jumlah_item >= 1),
  ringkasan_menu text not null,
  status_pesanan text not null default 'Menunggu Konfirmasi'
    check (status_pesanan in ('Menunggu Konfirmasi', 'Dimasak', 'Selesai', 'Dibatalkan')),
  catatan text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Tabel order_items (detail item per transaksi pesanan)
create table if not exists public.order_items (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  nama_produk text not null,
  harga_satuan integer not null check (harga_satuan >= 0),
  qty integer not null check (qty >= 1),
  subtotal integer not null check (subtotal >= 0)
);

-- 5. Tabel ratings (penilaian bintang & ulasan menu)
create table if not exists public.ratings (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  nama_pengulas text not null,
  rating integer not null check (rating between 1 and 5),
  ulasan text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- =====================================================================
-- Helper & Trigger Otomatis
-- =====================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text := 'user';
begin
  if lower(coalesce(new.email, '')) in ('admin@dapuraziz.com', 'zizdipanggilnengok@gmail.com') then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, nama_lengkap, email, no_hp, alamat, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nama_lengkap', ''), split_part(new.email, '@', 1), 'Pelanggan'),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'no_hp', ''),
    coalesce(new.raw_user_meta_data->>'alamat', ''),
    assigned_role
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- Row Level Security (RLS)
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.ratings enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and (
      role = 'user'
      or lower(coalesce(email, '')) in ('admin@dapuraziz.com', 'zizdipanggilnengok@gmail.com')
    )
  );

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin()
    or (
      auth.uid() = id
      and role = coalesce(public.get_my_role(), 'user')
    )
  );

-- Products policies
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products for select
  using (true);

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
  on public.products for insert
  with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
  on public.products for delete
  using (public.is_admin());

-- Orders policies
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  with check (
    auth.uid() = user_id
    and status_pesanan = 'Menunggu Konfirmasi'
  );

drop policy if exists "orders_update_admin_or_cancel_own" on public.orders;
create policy "orders_update_admin_or_cancel_own"
  on public.orders for update
  using (auth.uid() = user_id or public.is_admin())
  with check (
    public.is_admin()
    or (auth.uid() = user_id and status_pesanan = 'Dibatalkan')
  );

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
  on public.orders for delete
  using (public.is_admin());

-- Order Items policies
drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin"
  on public.order_items for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
  on public.order_items for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_admin_delete" on public.order_items;
create policy "order_items_admin_delete"
  on public.order_items for delete
  using (public.is_admin());

-- Ratings policies
drop policy if exists "ratings_select_public" on public.ratings;
create policy "ratings_select_public"
  on public.ratings for select
  using (true);

drop policy if exists "ratings_insert_own" on public.ratings;
create policy "ratings_insert_own"
  on public.ratings for insert
  with check (auth.uid() = user_id);

drop policy if exists "ratings_update_own" on public.ratings;
create policy "ratings_update_own"
  on public.ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ratings_delete_own_or_admin" on public.ratings;
create policy "ratings_delete_own_or_admin"
  on public.ratings for delete
  using (auth.uid() = user_id or public.is_admin());

-- =====================================================================
-- Seed Data Menu Awal Dapur Aziz (9 Menu)
-- =====================================================================

insert into public.products (id, nama_produk, kategori, harga, deskripsi, gambar_url, tersedia)
values
  (
    'lalapan-ayam-goreng',
    'Lalapan Ayam Goreng',
    'Makanan',
    18000,
    'Ayam ungkep rempah kunyit goreng garing dengan kremesan renyah, lalapan segar timun, kol, daun kemangi, dan sambal terasi ulek dadakan.',
    '/src/assets/images/menu_ayam_goreng_1794986393478.jpg',
    true
  ),
  (
    'lalapan-lele-goreng',
    'Lalapan Lele Goreng',
    'Makanan',
    15000,
    'Lele segar goreng kering gurih berbumbu bawang ketumbar, lengkap dengan lalapan timun, kemangi, dan sambal tomat pedas mantap.',
    '/src/assets/images/menu_lele_goreng_1794986393149.jpg',
    true
  ),
  (
    'lalapan-bebek-goreng',
    'Lalapan Bebek Goreng',
    'Makanan',
    25000,
    'Bebek empuk berbumbu ungkep khas Dapur Aziz digoreng keemasan dengan taburan serundeng gurih, lalapan segar, dan sambal pedas.',
    '/src/assets/images/menu_bebek_goreng_1794986395153.jpg',
    true
  ),
  (
    'lalapan-tempe-tahu-penyet',
    'Lalapan Tempe & Tahu Penyet',
    'Makanan',
    10000,
    'Perpaduan tempe dan tahu goreng hangat yang dipenyet langsung di atas cobek sambal terasi pedas beserta kemangi dan timun segar.',
    '/src/assets/images/menu_tempe_tahu_1794986394692.jpg',
    true
  ),
  (
    'es-teh',
    'Es Teh',
    'Minuman',
    4000,
    'Seduhan teh melati pilihan dengan gula asli dan es batu kristal yang menyegarkan setelah menikmati lalapan pedas.',
    '/src/assets/images/menu_es_teh_1794986395862.jpg',
    true
  ),
  (
    'es-jeruk',
    'Es Jeruk',
    'Minuman',
    5000,
    'Perasan jeruk peras segar alami berpadu manis pas dan es batu dingin, kaya vitamin dan segar di tenggorokan.',
    '/src/assets/images/menu_es_jeruk_1794986395415.jpg',
    true
  ),
  (
    'es-milo',
    'Es Milo',
    'Minuman',
    7000,
    'Minuman cokelat malt dingin kental dan creamy dengan taburan bubuk Milo di atasnya.',
    '/src/assets/images/menu_es_milo_1794986396587.jpg',
    true
  ),
  (
    'teh-panas',
    'Teh Panas',
    'Minuman',
    3000,
    'Teh melati hangat aromatik dengan tingkat kemanisan seimbang, cocok dinikmati kapan saja.',
    '/src/assets/images/menu_teh_panas_1794986396344.jpg',
    true
  ),
  (
    'teh-tawar',
    'Teh Tawar',
    'Minuman',
    2000,
    'Teh seduh murni tanpa gula (bisa hangat atau dingin sesuai catatan pesanan) untuk menetralisir rasa gurih.',
    '/src/assets/images/menu_teh_panas_1794986396344.jpg',
    true
  )
on conflict (id) do nothing;

-- =====================================================================
-- Aktifkan Supabase Realtime
-- =====================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ratings'
  ) then
    alter publication supabase_realtime add table public.ratings;
  end if;
end $$;
