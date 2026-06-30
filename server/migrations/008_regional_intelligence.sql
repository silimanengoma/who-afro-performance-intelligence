-- migrate:up
CREATE TABLE regional_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  submission_lock_id UUID REFERENCES submission_locks(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE regional_intelligence_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'MSC',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regional_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  audience TEXT NOT NULL,
  dashboard JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regional_heatmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  heatmap_type TEXT NOT NULL,
  heatmap JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regional_learning_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  category TEXT NOT NULL,
  theme TEXT NOT NULL,
  countries TEXT[] NOT NULL DEFAULT '{}',
  evidence JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regional_decision_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  country_code TEXT,
  decision_log_id UUID REFERENCES final_decision_logs(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  due_date DATE,
  escalation_required BOOLEAN NOT NULL DEFAULT false,
  responsible_role TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regional_escalation_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  country_code TEXT,
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID,
  severity TEXT,
  escalation_level TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regional_support_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  country_code TEXT,
  support_type TEXT NOT NULL,
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'Requested',
  due_date DATE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regional_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  indicator_name TEXT NOT NULL,
  methodology TEXT NOT NULL,
  value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sam1_cycle_id, indicator_name)
);

CREATE INDEX idx_regional_submissions_cycle ON regional_submissions(sam1_cycle_id, country_code);
CREATE INDEX idx_regional_notes_cycle ON regional_intelligence_notes(sam1_cycle_id, created_at DESC);
CREATE INDEX idx_regional_decisions_cycle ON regional_decision_tracker(sam1_cycle_id, status);

-- migrate:down
DROP TABLE IF EXISTS regional_kpis;
DROP TABLE IF EXISTS regional_support_actions;
DROP TABLE IF EXISTS regional_escalation_tracker;
DROP TABLE IF EXISTS regional_decision_tracker;
DROP TABLE IF EXISTS regional_learning_clusters;
DROP TABLE IF EXISTS regional_heatmaps;
DROP TABLE IF EXISTS regional_dashboards;
DROP TABLE IF EXISTS regional_intelligence_notes;
DROP TABLE IF EXISTS regional_submissions;
