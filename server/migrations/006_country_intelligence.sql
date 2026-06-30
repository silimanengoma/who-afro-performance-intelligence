-- migrate:up
CREATE TABLE country_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sam1_cycle_id, version)
);

CREATE TABLE review_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES country_reviews(id) ON DELETE CASCADE,
  teams_participating INTEGER NOT NULL DEFAULT 0,
  teams_completed INTEGER NOT NULL DEFAULT 0,
  teams_in_progress INTEGER NOT NULL DEFAULT 0,
  assessed_products_services INTEGER NOT NULL DEFAULT 0,
  completed_assessments INTEGER NOT NULL DEFAULT 0,
  bottlenecks INTEGER NOT NULL DEFAULT 0,
  corrective_actions INTEGER NOT NULL DEFAULT 0,
  escalation_candidates INTEGER NOT NULL DEFAULT 0,
  readiness_indicator TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE country_intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES country_reviews(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE country_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES country_reviews(id) ON DELETE CASCADE,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE learning_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES country_reviews(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  theme TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE executive_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES country_reviews(id) ON DELETE SET NULL,
  sam1_cycle_id TEXT NOT NULL,
  content TEXT NOT NULL,
  edited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_country_reviews_cycle ON country_reviews(sam1_cycle_id, version DESC);
CREATE INDEX idx_executive_summaries_cycle ON executive_summaries(sam1_cycle_id, updated_at DESC);

-- migrate:down
DROP TABLE IF EXISTS executive_summaries;
DROP TABLE IF EXISTS learning_clusters;
DROP TABLE IF EXISTS country_summary;
DROP TABLE IF EXISTS country_intelligence_snapshots;
DROP TABLE IF EXISTS review_readiness;
DROP TABLE IF EXISTS country_reviews;
