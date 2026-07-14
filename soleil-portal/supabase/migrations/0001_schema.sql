-- Soleil Création Wholesale Portal — schéma PostgreSQL (Supabase)
-- Voir docs/DATA_MODEL.md. Identifiants stables (UUID), contenus bilingues
-- en colonnes *_fr / *_en, aucune valeur commerciale par défaut.

create extension if not exists pgcrypto;

-- ---------- Types ----------
create type app_role as enum ('buyer', 'sales_admin', 'content_admin', 'super_admin');
create type availability_t as enum ('available', 'on_request', 'preorder', 'sold_out', 'tbc');
create type product_status_t as enum ('draft', 'active', 'archived');
create type visibility_t as enum ('public', 'professional');
create type pipeline_status_t as enum (
  'nouveau_prospect','contacte','lookbook_consulte','acces_demande','acces_approuve',
  'showroom_consulte','selection_commencee','devis_demande','devis_envoye','negociation',
  'accord_conclu','commande_preparation','commande_expediee','partenaire_actif','opportunite_perdue'
);
create type quote_status_t as enum ('draft','sent','accepted','change_requested','rejected','expired');
create type order_status_t as enum ('preparing','confirmed','shipped','delivered','closed');
create type partnership_model_t as enum ('gros','precommande','retail_test','popup');

-- ---------- Identité ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text,
  shop_type text,
  contact_name text,
  address text, city text, country text,
  email text, whatsapp text, website text, instagram text,
  target_clientele text, price_range text, brands_carried text, delivery_countries text,
  preferred_model partnership_model_t,
  potential_estimate text check (potential_estimate in ('faible','moyen','fort')),
  internal_notes text not null default '',           -- réservé admin (vue dédiée)
  pipeline_status pipeline_status_t not null default 'nouveau_prospect',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null default 'buyer',
  full_name text not null default '',
  locale text not null default 'fr' check (locale in ('fr','en')),
  organization_id uuid references organizations (id) on delete set null,
  created_at timestamptz not null default now()
);

create table buyer_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  unique (organization_id, user_id)
);

-- ---------- Catalogue ----------
create table collections (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null, name_en text not null,
  season text, is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table capsules (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections (id) on delete set null,
  slug text not null unique,
  name_fr text not null, name_en text not null,
  manifesto_fr text not null default '', manifesto_en text not null default '',
  display_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,                    -- identifiant commercial lisible
  capsule_id uuid references capsules (id) on delete set null,
  category text not null check (category in ('ensemble','robe','boubou','gilet','haut')),
  gender text not null check (gender in ('femme','homme','mixte')),
  occasions text[] not null default '{}',
  name_fr text not null, name_en text not null,
  description_fr text not null default '', description_en text not null default '',
  editorial_text_fr text not null default '', editorial_text_en text not null default '',
  materials_fr text, materials_en text,              -- null = à confirmer
  care_fr text, care_en text,
  customization_fr text, customization_en text,
  lead_time_days int,
  min_order_qty int,
  availability availability_t not null default 'tbc',
  visibility visibility_t not null default 'professional',
  status product_status_t not null default 'draft',
  is_featured boolean not null default false,
  display_order int not null default 0,
  commercial_priority int not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  color_fr text, color_en text,
  size_scale text,
  sizes text[],                                      -- null = à confirmer
  sku text,
  availability availability_t not null default 'tbc'
);

create table product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  kind text not null default 'packshot' check (kind in ('packshot','editorial','video')),
  storage_path text not null,                        -- bucket product-media
  source_note text not null default '',              -- fichier Dropbox d'origine
  alt_fr text not null default '', alt_en text not null default '',
  display_order int not null default 0,
  is_placeholder boolean not null default true
);

create table wholesale_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete cascade,
  price_list text not null default 'standard',
  currency text not null default 'XAF' check (currency in ('XAF','EUR','USD')),
  wholesale_price numeric(12,2),                     -- null = à confirmer, jamais inventé
  rrp numeric(12,2),
  valid_from date, valid_until date,
  unique (product_id, variant_id, price_list, currency)
);

create table commercial_terms (
  id uuid primary key default gen_random_uuid(),
  currency text not null default 'XAF',
  price_validity text, global_minimum text,
  payment_fr text, payment_en text,
  lead_times text, production_terms text,
  shipping_fr text, shipping_en text,
  customs_fr text, customs_en text,
  returns_fr text, returns_en text,
  claims_fr text, claims_en text,
  restock_fr text, restock_en text,
  exclusivity_fr text, exclusivity_en text,
  updated_at timestamptz not null default now()
);

-- ---------- Cycle commercial ----------
create table selections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  created_by uuid references auth.users (id),
  name text not null default '',
  status text not null default 'open' check (status in ('open','shared','quoted','abandoned')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table selection_items (
  id uuid primary key default gen_random_uuid(),
  selection_id uuid not null references selections (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete set null,
  size_notes text not null default '',
  color_notes text not null default '',
  indicative_qty int not null default 1 check (indicative_qty > 0),
  buyer_notes text not null default ''               -- privées acheteur
);

create table access_requests (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null, trade_name text, shop_type text,
  contact_name text not null, email text not null, whatsapp text,
  city text, country text, website text, instagram text,
  target_clientele text, price_range text, brands_carried text,
  preferred_model partnership_model_t,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references auth.users (id), decided_at timestamptz,
  rejection_reason text not null default '',
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  name text not null, organization text, email text not null, whatsapp text,
  channel text not null default 'visio' check (channel in ('visio','whatsapp','showroom')),
  slots text not null default '', message text not null default '',
  status text not null default 'pending' check (status in ('pending','confirmed','done','cancelled')),
  created_at timestamptz not null default now()
);

create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  selection_id uuid references selections (id) on delete set null,
  partnership_model partnership_model_t not null,
  message text not null default '',
  status text not null default 'open' check (status in ('open','processed')),
  created_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references quote_requests (id) on delete set null,
  organization_id uuid not null references organizations (id) on delete cascade,
  number text not null unique,
  currency text not null default 'XAF',
  shipping_note text not null default '',
  lead_time_note text not null default '',
  valid_until date,
  status quote_status_t not null default 'draft',
  buyer_comment text not null default '',
  admin_notes text not null default '',              -- réservé admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  product_id uuid not null references products (id),
  variant_label text not null default '',
  qty int not null check (qty > 0),
  unit_price numeric(12,2)                           -- null tant que non chiffré
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id),
  organization_id uuid not null references organizations (id) on delete cascade,
  number text not null unique,
  status order_status_t not null default 'preparing',
  incoterm text,
  tracking_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id),
  variant_label text not null default '',
  qty int not null check (qty > 0),
  unit_price numeric(12,2)
);

create table partnership_models (
  code partnership_model_t primary key,
  name_fr text not null, name_en text not null,
  content_fr jsonb not null default '{}',
  content_en jsonb not null default '{}',
  is_active boolean not null default true
);

create table partnership_applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  model_code partnership_model_t not null,
  status text not null default 'chosen' check (status in ('chosen','confirmed','ended')),
  created_at timestamptz not null default now()
);

-- ---------- Documents et suivi ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  organization_id uuid references organizations (id) on delete cascade,
  storage_path text not null,
  visibility text not null default 'organization' check (visibility in ('organization','admin')),
  version int not null default 1,
  created_at timestamptz not null default now()
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  template_code text not null,
  organization_id uuid not null references organizations (id) on delete cascade,
  merge_data jsonb not null default '{}',
  legal_disclaimer text not null default
    'Modèle de document. Validation juridique requise avant toute utilisation.',
  status text not null default 'draft' check (status in ('draft','sent','signed_offline')),
  created_at timestamptz not null default now()
);

create table communications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp','phone','meeting','portal')),
  direction text not null check (direction in ('in','out')),
  summary text not null,
  at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  organization_id uuid references organizations (id) on delete set null,
  actor uuid references auth.users (id),
  ref_id text, detail text not null default '',
  metadata jsonb not null default '{}',
  at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assignee uuid references auth.users (id),
  due_date date,
  organization_id uuid references organizations (id) on delete cascade,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('admin','buyer')),
  organization_id uuid references organizations (id) on delete cascade,
  template_code text not null,
  title_fr text not null, title_en text not null,
  body_fr text not null default '', body_en text not null default '',
  read_at timestamptz,
  simulated boolean not null default true,           -- prototype : rien n'est envoyé
  created_at timestamptz not null default now()
);

create table shared_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  scope text not null check (scope in ('lookbook','selection','linesheet')),
  organization_id uuid references organizations (id) on delete cascade,
  watermark text not null default '',
  expires_at timestamptz, revoked_at timestamptz,
  views int not null default 0,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users (id),
  actor_email text not null default '',
  action text not null, entity text not null, record_id text not null,
  diff jsonb not null default '{}',
  at timestamptz not null default now()
);

-- ---------- Configuration ----------
create table brand_settings (
  key text primary key,
  value_fr text, value_en text,
  updated_at timestamptz not null default now()
);

-- ---------- Index ----------
create index on products (capsule_id);
create index on products (status, visibility);
create index on product_media (product_id);
create index on product_variants (product_id);
create index on wholesale_prices (product_id);
create index on selections (organization_id);
create index on selection_items (selection_id);
create index on quotes (organization_id);
create index on orders (organization_id);
create index on activities (organization_id, at desc);
create index on notifications (audience, read_at);
create index on shared_links (token);
