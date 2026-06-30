-- migrate:up
CREATE TABLE pilot_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL,
  country_code TEXT NOT NULL UNIQUE,
  budget_centre_id UUID REFERENCES budget_centres(id) ON DELETE SET NULL,
  wr_user_id UUID REFERENCES users(id),
  pmo_user_id UUID REFERENCES users(id),
  reporting_period TEXT NOT NULL DEFAULT 'Pilot',
  sam1_cycle_id TEXT NOT NULL,
  country_logo_url TEXT,
  language_preference TEXT NOT NULL DEFAULT 'English',
  time_zone TEXT NOT NULL DEFAULT 'Africa/Lusaka',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  tour_key TEXT NOT NULL,
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  skipped BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tour_key)
);

CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role TEXT,
  country_code TEXT,
  event_name TEXT NOT NULL,
  screen TEXT,
  duration_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feedback_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role TEXT,
  country_code TEXT,
  current_screen TEXT,
  browser TEXT,
  feedback_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'New',
  message TEXT NOT NULL,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feature_flags (
  flag_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE performance_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(12, 2) NOT NULL,
  unit TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,
  country_code TEXT,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE TABLE training_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE training_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES training_resources(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_placeholder TEXT,
  UNIQUE (user_id, resource_id)
);

CREATE TABLE go_live_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  evidence TEXT,
  approved_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pilot_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sam1_cycle_id TEXT NOT NULL,
  kpis JSONB NOT NULL,
  executive_summary TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE security_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_key TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_number TEXT NOT NULL,
  build_number TEXT NOT NULL,
  deployment_date DATE,
  environment TEXT NOT NULL DEFAULT 'pilot',
  known_issues TEXT,
  hotfixes TEXT,
  rollback_version TEXT,
  database_migration_version TEXT,
  release_approval TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO feature_flags (flag_key, label, enabled, description) VALUES
  ('ai_enabled', 'AI Enabled', true, 'Enable Performance Intelligence Copilot'),
  ('powerbi_enabled', 'Power BI Enabled', true, 'Expose Power BI feed endpoints'),
  ('sharepoint_enabled', 'SharePoint Enabled', true, 'Enable mock SharePoint document links'),
  ('regional_dashboard', 'Regional Dashboard', true, 'Enable regional intelligence layer'),
  ('chat_assistant', 'Chat Assistant', true, 'Enable AI chat assistant'),
  ('notifications', 'Notifications', true, 'Enable notification inbox'),
  ('pilot_feedback', 'Pilot Feedback', true, 'Enable pilot feedback centre'),
  ('mock_connectors', 'Mock Connectors', true, 'Enable mock integration connectors'),
  ('live_connectors', 'Live Connectors', false, 'Enable future live connectors'),
  ('country_locking', 'Country Locking', true, 'Enable country submission locking'),
  ('wr_signoff', 'WR Sign-off', true, 'Enable WR sign-off workflow')
ON CONFLICT (flag_key) DO NOTHING;

INSERT INTO help_articles (category, title, body, roles, tags) VALUES
  ('Concepts', 'What is SAM 1?', 'SAM 1 is the structured review of delivery performance, risks, bottlenecks, decisions, and learning.', '{admin,pmo,wr,team_lead}', '{sam1,overview}'),
  ('Concepts', 'What is a Product & Service?', 'A Product & Service is an approved SPM item selected for performance intelligence review.', '{pmo,team_lead}', '{product,service}'),
  ('Concepts', 'GPW14 Output', 'GPW14 Output links Product & Service delivery to expected programme results.', '{admin,pmo,wr,team_lead}', '{output,gpw14}'),
  ('Workflow', 'Decision Log', 'The Decision Log captures official WR and management decisions, owners, deadlines, and escalations.', '{pmo,wr}', '{decision,review}'),
  ('Workflow', 'Country Review', 'The Country Review prepares the WR to chair a structured management review.', '{pmo,wr}', '{country,review}')
ON CONFLICT DO NOTHING;

INSERT INTO training_resources (title, role, resource_type, content, video_url) VALUES
  ('PMO Guide', 'pmo', 'guide', 'How to monitor completion and prepare WR Review.', 'placeholder://pmo-video'),
  ('WR Guide', 'wr', 'guide', 'How to use executive dashboards, meeting mode, and sign-off.', 'placeholder://wr-video'),
  ('Team Lead Guide', 'team_lead', 'guide', 'How to select Top 5, complete assessments, and add bottlenecks.', 'placeholder://team-video'),
  ('MSC Guide', 'admin', 'guide', 'How to administer pilots, integrations, analytics, and releases.', 'placeholder://msc-video'),
  ('Quick Start', 'all', 'quick_reference', 'Pilot quick start checklist.', 'placeholder://quick-start')
ON CONFLICT DO NOTHING;

INSERT INTO go_live_checklist (item_key, label, completed) VALUES
  ('users_configured', 'Users configured', true),
  ('roles_assigned', 'Roles assigned', true),
  ('pilot_workspace_created', 'Pilot workspace created', false),
  ('spm_data_imported', 'SPM data imported', false),
  ('validation_completed', 'Validation completed', false),
  ('assessments_tested', 'Assessments tested', false),
  ('wr_signoff_tested', 'WR sign-off tested', false),
  ('regional_dashboard_tested', 'Regional dashboard tested', true),
  ('ai_enabled', 'AI enabled', true),
  ('backup_completed', 'Backup completed', false),
  ('audit_logging_enabled', 'Audit logging enabled', true),
  ('notifications_working', 'Notifications working', true),
  ('help_centre_available', 'Help Centre available', true),
  ('training_completed', 'Training completed', false),
  ('system_health_green', 'System health green', true),
  ('go_live_approval_recorded', 'Go-live approval recorded', false)
ON CONFLICT (item_key) DO NOTHING;

-- migrate:down
DROP TABLE IF EXISTS releases;
DROP TABLE IF EXISTS security_check_results;
DROP TABLE IF EXISTS pilot_evaluations;
DROP TABLE IF EXISTS go_live_checklist;
DROP TABLE IF EXISTS training_completion;
DROP TABLE IF EXISTS training_resources;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS performance_test_results;
DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS feedback_items;
DROP TABLE IF EXISTS product_analytics_events;
DROP TABLE IF EXISTS help_articles;
DROP TABLE IF EXISTS onboarding_progress;
DROP TABLE IF EXISTS pilot_workspaces;
