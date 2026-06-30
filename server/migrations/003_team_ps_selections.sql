-- migrate:up
CREATE TYPE selection_status AS ENUM ('draft', 'completed');

ALTER TABLE products_services
  ADD COLUMN plan_names TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN planned_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';

CREATE TABLE team_ps_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  budget_centre_id UUID NOT NULL REFERENCES budget_centres(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  product_service_id UUID NOT NULL REFERENCES products_services(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 5),
  rationale TEXT NOT NULL DEFAULT '',
  status selection_status NOT NULL DEFAULT 'draft',
  selected_by UUID NOT NULL REFERENCES users(id),
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sam1_cycle_id, team_id, product_service_id),
  UNIQUE (sam1_cycle_id, team_id, rank)
);

CREATE INDEX idx_team_ps_selections_team_cycle ON team_ps_selections(team_id, sam1_cycle_id);
CREATE INDEX idx_team_ps_selections_status ON team_ps_selections(status);

-- migrate:down
DROP TABLE IF EXISTS team_ps_selections;
DROP TYPE IF EXISTS selection_status;

ALTER TABLE products_services
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS planned_cost,
  DROP COLUMN IF EXISTS plan_names;
