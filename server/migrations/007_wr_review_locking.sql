-- migrate:up
CREATE TABLE country_review_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  budget_centre_id UUID REFERENCES budget_centres(id) ON DELETE SET NULL,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  chair_user_id UUID REFERENCES users(id),
  facilitator_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Not started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  signed_off_by UUID REFERENCES users(id),
  signed_off_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wr_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL UNIQUE REFERENCES country_review_meetings(id) ON DELETE CASCADE,
  performance_signal TEXT,
  overall_assessment TEXT,
  main_delivery_concern TEXT,
  main_corrective_decision TEXT,
  regional_support_required TEXT,
  wr_chair_confirmation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE final_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES country_review_meetings(id) ON DELETE CASCADE,
  issue TEXT NOT NULL DEFAULT '',
  product_service_id UUID REFERENCES products_services(id) ON DELETE SET NULL,
  result_output TEXT,
  decision TEXT NOT NULL DEFAULT '',
  responsible_person TEXT NOT NULL DEFAULT '',
  deadline DATE,
  escalation_required BOOLEAN NOT NULL DEFAULT false,
  escalation_level TEXT,
  status TEXT NOT NULL DEFAULT 'In progress',
  source TEXT NOT NULL DEFAULT 'Manual entry',
  source_entity_type TEXT,
  source_entity_id UUID,
  finalized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE validated_learning_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES country_review_meetings(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  regional_sharing BOOLEAN NOT NULL DEFAULT false,
  accepted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE submission_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL UNIQUE REFERENCES country_review_meetings(id) ON DELETE CASCADE,
  locked_by UUID NOT NULL REFERENCES users(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lock_reason TEXT NOT NULL,
  version INTEGER NOT NULL
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_review_meetings_cycle ON country_review_meetings(sam1_cycle_id, created_at DESC);
CREATE INDEX idx_decision_logs_meeting ON final_decision_logs(meeting_id);
CREATE INDEX idx_learning_themes_meeting ON validated_learning_themes(meeting_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- migrate:down
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS submission_locks;
DROP TABLE IF EXISTS validated_learning_themes;
DROP TABLE IF EXISTS final_decision_logs;
DROP TABLE IF EXISTS wr_assessments;
DROP TABLE IF EXISTS country_review_meetings;
