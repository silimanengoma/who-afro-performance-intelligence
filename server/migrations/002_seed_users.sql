-- migrate:up
INSERT INTO users (name, role, centre_code) VALUES
  ('MSC Admin', 'admin', NULL),
  ('Zambia PMO', 'pmo', 'ZMB'),
  ('Zambia WR', 'wr', 'ZMB'),
  ('Zambia Team Lead', 'team_lead', 'ZMB'),
  ('Sierra Leone PMO', 'pmo', 'SLE'),
  ('Sierra Leone WR', 'wr', 'SLE'),
  ('Sierra Leone Team Lead', 'team_lead', 'SLE')
ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM users WHERE name IN (
  'MSC Admin',
  'Zambia PMO',
  'Zambia WR',
  'Zambia Team Lead',
  'Sierra Leone PMO',
  'Sierra Leone WR',
  'Sierra Leone Team Lead'
);
