-- migrate:up
CREATE TYPE assessment_status AS ENUM ('not_started', 'draft', 'complete');

CREATE TABLE ps_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  budget_centre_id UUID NOT NULL REFERENCES budget_centres(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  selection_id UUID NOT NULL REFERENCES team_ps_selections(id) ON DELETE CASCADE,
  product_service_id UUID NOT NULL REFERENCES products_services(id) ON DELETE CASCADE,
  delivery_status TEXT,
  progress_percentage INTEGER CHECK (progress_percentage BETWEEN 0 AND 100),
  planned_deliverable TEXT,
  actual_deliverable TEXT,
  reporting_period_comment TEXT,
  evidence_source TEXT,
  evidence_reference TEXT,
  data_confidence TEXT,
  data_quality_issue BOOLEAN NOT NULL DEFAULT false,
  data_quality_issue_description TEXT,
  contribution_narrative TEXT,
  contribution_strength TEXT,
  contribution_evidence TEXT,
  output_risk_flag TEXT,
  status assessment_status NOT NULL DEFAULT 'draft',
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sam1_cycle_id, selection_id),
  UNIQUE (sam1_cycle_id, team_id, product_service_id)
);

CREATE INDEX idx_ps_assessments_team_cycle ON ps_assessments(team_id, sam1_cycle_id);
CREATE INDEX idx_ps_assessments_status ON ps_assessments(status);
CREATE INDEX idx_ps_assessments_delivery_status ON ps_assessments(delivery_status);

-- migrate:down
DROP TABLE IF EXISTS ps_assessments;
DROP TYPE IF EXISTS assessment_status;
