-- migrate:up
CREATE TABLE connector_registry (
  connector_id TEXT PRIMARY KEY,
  connector_name TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'mock',
  auth_type TEXT NOT NULL,
  base_url TEXT,
  environment TEXT NOT NULL DEFAULT 'dev',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  error_message TEXT,
  owner TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id TEXT NOT NULL REFERENCES connector_registry(connector_id),
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  records_fetched INTEGER NOT NULL DEFAULT 0,
  records_synced INTEGER NOT NULL DEFAULT 0,
  triggered_by UUID REFERENCES users(id),
  params JSONB NOT NULL DEFAULT '{}',
  event_name TEXT,
  cache_invalidated BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES sync_runs(id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL REFERENCES connector_registry(connector_id),
  error_category TEXT NOT NULL,
  user_message TEXT NOT NULL,
  technical_details TEXT,
  quarantined_record JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE source_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_file_id TEXT,
  source_import_id UUID,
  sync_run_id UUID REFERENCES sync_runs(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_by UUID REFERENCES users(id),
  source_last_modified_at TIMESTAMPTZ,
  confidence_level TEXT NOT NULL DEFAULT 'mock',
  validation_status TEXT NOT NULL DEFAULT 'valid',
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES sync_runs(id) ON DELETE SET NULL,
  budget_centre_id UUID REFERENCES budget_centres(id) ON DELETE SET NULL,
  reporting_period TEXT NOT NULL,
  allocation NUMERIC(14, 2) NOT NULL DEFAULT 0,
  expenditure NUMERIC(14, 2) NOT NULL DEFAULT 0,
  encumbrance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  burn_rate NUMERIC(8, 2) NOT NULL DEFAULT 0,
  funding_gap NUMERIC(14, 2) NOT NULL DEFAULT 0,
  execution_percentage NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_snapshot_id UUID REFERENCES financial_snapshots(id) ON DELETE CASCADE,
  programme_area TEXT,
  result_output TEXT,
  planned_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  execution_rate NUMERIC(8, 2) NOT NULL DEFAULT 0
);

CREATE TABLE procurement_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES sync_runs(id) ON DELETE SET NULL,
  budget_centre_id UUID REFERENCES budget_centres(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workforce_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES sync_runs(id) ON DELETE SET NULL,
  budget_centre_id UUID REFERENCES budget_centres(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  reporting_period TEXT NOT NULL,
  staff_count INTEGER NOT NULL DEFAULT 0,
  vacancy_count INTEGER NOT NULL DEFAULT 0,
  critical_positions_vacant INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workforce_snapshot_id UUID REFERENCES workforce_snapshots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  function_area TEXT,
  position_status TEXT NOT NULL,
  output_dependency TEXT
);

CREATE TABLE vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workforce_snapshot_id UUID REFERENCES workforce_snapshots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  criticality TEXT NOT NULL,
  days_vacant INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE workforce_risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES sync_runs(id) ON DELETE SET NULL,
  budget_centre_id UUID REFERENCES budget_centres(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_storage_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_export_id UUID NOT NULL REFERENCES document_exports(id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL REFERENCES connector_registry(connector_id),
  storage_url TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_export_id UUID REFERENCES document_exports(id) ON DELETE SET NULL,
  linked_entity_type TEXT,
  linked_entity_id UUID,
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO connector_registry (connector_id, connector_name, connector_type, status, auth_type, base_url, environment, owner, enabled, config) VALUES
  ('spm', 'SPM Connector', 'source_system', 'mock', 'future_oauth2', NULL, 'dev', 'MSC Admin', true, '{"data_source_priority":["excel_upload","spm_api"]}'),
  ('gsm', 'GSM Connector', 'source_system', 'mock', 'future_service_account', NULL, 'dev', 'MSC Admin', true, '{}'),
  ('hr', 'HR Connector', 'source_system', 'mock', 'future_service_account', NULL, 'dev', 'MSC Admin', true, '{}'),
  ('sso', 'WHO SSO Connector', 'identity', 'mock', 'future_oidc_or_saml', NULL, 'dev', 'MSC Admin', true, '{"providers":["mock","who_sso_placeholder"]}'),
  ('sharepoint', 'SharePoint Connector', 'document_storage', 'mock', 'future_oauth2', NULL, 'dev', 'MSC Admin', true, '{}'),
  ('powerbi', 'Power BI Connector', 'analytics', 'mock', 'future_oauth2', NULL, 'dev', 'MSC Admin', true, '{}')
ON CONFLICT (connector_id) DO NOTHING;

-- migrate:down
DROP TABLE IF EXISTS evidence_files;
DROP TABLE IF EXISTS document_storage_links;
DROP TABLE IF EXISTS document_exports;
DROP TABLE IF EXISTS workforce_risk_signals;
DROP TABLE IF EXISTS vacancies;
DROP TABLE IF EXISTS positions;
DROP TABLE IF EXISTS workforce_snapshots;
DROP TABLE IF EXISTS procurement_signals;
DROP TABLE IF EXISTS budget_execution;
DROP TABLE IF EXISTS financial_snapshots;
DROP TABLE IF EXISTS source_lineage;
DROP TABLE IF EXISTS sync_errors;
DROP TABLE IF EXISTS sync_runs;
DROP TABLE IF EXISTS connector_registry;
