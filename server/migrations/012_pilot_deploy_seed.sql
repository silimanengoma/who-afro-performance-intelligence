-- migrate:up
INSERT INTO budget_centres (code, name, centre_type) VALUES
  ('ZMB', 'Zambia Country Office', 'country_office'),
  ('SLE', 'Sierra Leone Country Office', 'country_office'),
  ('TCD', 'Chad Country Office', 'country_office')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  centre_type = EXCLUDED.centre_type;

INSERT INTO users (name, role, centre_code) VALUES
  ('Chad PMO', 'pmo', 'TCD'),
  ('Chad WR', 'wr', 'TCD'),
  ('Chad Team Lead', 'team_lead', 'TCD')
ON CONFLICT DO NOTHING;

INSERT INTO pilot_workspaces (country_name, country_code, budget_centre_id, sam1_cycle_id, language_preference, time_zone, status)
SELECT 'Zambia', 'ZMB', id, '2026-SAM1', 'English', 'Africa/Lusaka', 'active'
FROM budget_centres
WHERE code = 'ZMB'
ON CONFLICT (country_code) DO UPDATE SET
  budget_centre_id = EXCLUDED.budget_centre_id,
  status = 'active',
  updated_at = now();

INSERT INTO pilot_workspaces (country_name, country_code, budget_centre_id, sam1_cycle_id, language_preference, time_zone, status)
SELECT 'Sierra Leone', 'SLE', id, '2026-SAM1', 'English', 'Africa/Freetown', 'active'
FROM budget_centres
WHERE code = 'SLE'
ON CONFLICT (country_code) DO UPDATE SET
  budget_centre_id = EXCLUDED.budget_centre_id,
  status = 'active',
  updated_at = now();

INSERT INTO pilot_workspaces (country_name, country_code, budget_centre_id, sam1_cycle_id, language_preference, time_zone, status)
SELECT 'Chad', 'TCD', id, '2026-SAM1', 'French', 'Africa/Ndjamena', 'active'
FROM budget_centres
WHERE code = 'TCD'
ON CONFLICT (country_code) DO UPDATE SET
  budget_centre_id = EXCLUDED.budget_centre_id,
  status = 'active',
  updated_at = now();

UPDATE go_live_checklist
SET completed = true, evidence = 'Pilot countries and demo users seeded during deployment migration.', updated_at = now()
WHERE item_key IN ('users_configured', 'roles_assigned', 'pilot_workspace_created');

-- migrate:down
DELETE FROM pilot_workspaces WHERE country_code IN ('ZMB', 'SLE', 'TCD');
DELETE FROM users WHERE name IN ('Chad PMO', 'Chad WR', 'Chad Team Lead');
