-- migrate:up
CREATE TYPE bottleneck_status AS ENUM ('draft', 'complete');
CREATE TYPE corrective_action_status AS ENUM ('Draft', 'Proposed', 'Accepted', 'In progress', 'Completed', 'Escalated');

CREATE TABLE bottlenecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  budget_centre_id UUID NOT NULL REFERENCES budget_centres(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES ps_assessments(id) ON DELETE CASCADE,
  product_service_id UUID NOT NULL REFERENCES products_services(id) ON DELETE CASCADE,
  result_output TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  root_cause TEXT,
  consequence_for_delivery TEXT,
  proposed_corrective_action TEXT,
  responsible_person TEXT,
  target_deadline DATE,
  support_required TEXT NOT NULL DEFAULT 'None',
  escalation_required BOOLEAN NOT NULL DEFAULT false,
  escalation_level TEXT,
  evidence_reference TEXT,
  action_status corrective_action_status NOT NULL DEFAULT 'Draft',
  status bottleneck_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id),
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bottlenecks_assessment ON bottlenecks(assessment_id);
CREATE INDEX idx_bottlenecks_team_cycle ON bottlenecks(team_id, sam1_cycle_id);
CREATE INDEX idx_bottlenecks_budget_centre_cycle ON bottlenecks(budget_centre_id, sam1_cycle_id);
CREATE INDEX idx_bottlenecks_severity ON bottlenecks(severity);
CREATE INDEX idx_bottlenecks_escalation ON bottlenecks(escalation_required);

-- migrate:down
DROP TABLE IF EXISTS bottlenecks;
DROP TYPE IF EXISTS corrective_action_status;
DROP TYPE IF EXISTS bottleneck_status;
