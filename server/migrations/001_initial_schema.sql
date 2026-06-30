-- migrate:up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('admin', 'pmo', 'wr', 'team_lead');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role user_role NOT NULL,
  centre_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  centre_type TEXT NOT NULL CHECK (centre_type IN ('country_office', 'regional_cluster')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_centre_id UUID NOT NULL REFERENCES budget_centres(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plan_type TEXT,
  biennium TEXT,
  total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  funding_sources TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (budget_centre_id, name, plan_type, biennium)
);

CREATE TABLE spm_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  approved_rows INTEGER NOT NULL,
  excluded_rows INTEGER NOT NULL,
  budget_centre_count INTEGER NOT NULL,
  team_count INTEGER NOT NULL,
  product_service_count INTEGER NOT NULL,
  duplicate_count INTEGER NOT NULL,
  missing_approval_count INTEGER NOT NULL,
  missing_pe_count INTEGER NOT NULL,
  missing_output_count INTEGER NOT NULL,
  exclusion_reasons JSONB NOT NULL DEFAULT '{}',
  raw_rows JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workplans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES spm_imports(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  approval_status TEXT,
  raw_row JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES spm_imports(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  pe_name TEXT NOT NULL,
  result_output TEXT,
  total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  funding_sources TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_imports_created_at ON spm_imports(created_at DESC);
CREATE INDEX idx_workplans_import ON workplans(import_id);
CREATE INDEX idx_products_import ON products_services(import_id);

-- migrate:down
DROP TABLE IF EXISTS products_services;
DROP TABLE IF EXISTS workplans;
DROP TABLE IF EXISTS spm_imports;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS budget_centres;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS user_role;
