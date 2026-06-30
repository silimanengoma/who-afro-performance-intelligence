-- migrate:up
CREATE TABLE ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_key, version)
);

CREATE TABLE ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  prompt_template_key TEXT NOT NULL,
  prompt_version INTEGER NOT NULL,
  requested_by UUID REFERENCES users(id),
  input_context JSONB NOT NULL DEFAULT '{}',
  data_sources JSONB NOT NULL DEFAULT '[]',
  output JSONB NOT NULL,
  token_estimate INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_generated_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id UUID REFERENCES ai_audit_logs(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  output_type TEXT NOT NULL,
  content TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  user_edits TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO ai_prompt_templates (template_key, version, title, prompt_text) VALUES
  ('assessment_narrative', 1, 'Assessment Narrative Draft', 'Generate a delivery narrative, contribution narrative, evidence summary, risks, and confidence note from structured P/S assessment fields. Cite every fact.'),
  ('bottleneck_summary', 1, 'Bottleneck Analyzer', 'Summarize observed bottlenecks, distinguish facts from hypotheses, and suggest questions for management discussion.'),
  ('decision_recommendation', 1, 'Decision Advisor', 'Suggest editable management actions with rationale, evidence, risks, and suggested level.'),
  ('learning_synthesis', 1, 'Learning Synthesis', 'Cluster validated learning into themes, innovations, implementation challenges, shareable practices, and MEAL topics.'),
  ('executive_briefing', 1, 'Executive Briefing', 'Generate a briefing note for the requested audience with evidence-linked paragraphs.'),
  ('regional_patterns', 1, 'Regional Pattern Detection', 'Identify repeated bottlenecks, delays, high-risk outputs, constraints, strong performers, and emerging risks.'),
  ('qa_response', 1, 'Performance Intelligence Q&A', 'Answer a user question using only authorized structured platform data and citations.')
ON CONFLICT (template_key, version) DO NOTHING;

-- migrate:down
DROP TABLE IF EXISTS ai_generated_outputs;
DROP TABLE IF EXISTS ai_audit_logs;
DROP TABLE IF EXISTS ai_prompt_templates;
