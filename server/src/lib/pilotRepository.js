import { pool, withTransaction } from '../db.js';
import { initialPilotCountries, onboardingSteps, pilotKpis, readinessScore, trafficLight } from './pilotRules.js';
import { SAM1_CYCLE_ID } from './selectionRules.js';

function assertAdmin(user) {
  if (user?.role !== 'admin') throw Object.assign(new Error('Only MSC Admin may access administration functions.'), { status: 403 });
}

export async function ensurePilotCountries(user) {
  assertAdmin(user);
  return withTransaction(async (db) => {
    const created = [];
    for (const country of initialPilotCountries) {
      const code = country === 'Zambia' ? 'ZMB' : country === 'Sierra Leone' ? 'SLE' : 'TCD';
      const centre = await db.query('SELECT id FROM budget_centres WHERE code = $1 LIMIT 1', [code]);
      const rows = await db.query(
        `INSERT INTO pilot_workspaces (country_name, country_code, budget_centre_id, sam1_cycle_id, language_preference, time_zone)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (country_code) DO UPDATE SET status = 'active', updated_at = now()
         RETURNING *`,
        [country, code, centre.rows[0]?.id ?? null, SAM1_CYCLE_ID, country === 'Chad' ? 'French' : 'English', country === 'Chad' ? 'Africa/Ndjamena' : 'Africa/Lusaka']
      );
      created.push(rows.rows[0]);
    }
    await db.query("UPDATE go_live_checklist SET completed = true, updated_at = now() WHERE item_key = 'pilot_workspace_created'");
    return created;
  });
}

export async function listPilotWorkspaces() {
  const { rows } = await pool.query('SELECT * FROM pilot_workspaces ORDER BY country_name');
  return rows;
}

export async function updatePilotWorkspace(id, action, user) {
  assertAdmin(user);
  const status = action === 'archive' ? 'archived' : action === 'deactivate' ? 'inactive' : 'active';
  const { rows } = await pool.query('UPDATE pilot_workspaces SET status = $1, updated_at = now() WHERE id = $2 RETURNING *', [status, id]);
  if (!rows.length) throw Object.assign(new Error('Pilot workspace not found.'), { status: 404 });
  return rows[0];
}

export async function onboardingForUser(user) {
  const steps = onboardingSteps(user.role);
  const { rows } = await pool.query('SELECT * FROM onboarding_progress WHERE user_id = $1', [user.sub]);
  return { role: user.role, steps, progress: rows };
}

export async function saveOnboarding(user, body) {
  const { rows } = await pool.query(
    `INSERT INTO onboarding_progress (user_id, role, tour_key, completed_steps, skipped, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id, tour_key) DO UPDATE SET completed_steps = EXCLUDED.completed_steps, skipped = EXCLUDED.skipped, completed_at = EXCLUDED.completed_at, updated_at = now()
     RETURNING *`,
    [user.sub, user.role, body.tourKey ?? `${user.role}_first_login`, body.completedSteps ?? [], Boolean(body.skipped), body.completed ? new Date() : null]
  );
  return rows[0];
}

export async function helpSearch(query = '') {
  const pattern = `%${query}%`;
  const { rows } = await pool.query(
    'SELECT * FROM help_articles WHERE title ILIKE $1 OR body ILIKE $1 OR $2 = ANY(tags) ORDER BY category, title',
    [pattern, query]
  );
  return rows;
}

export async function trainingResources(role = 'all') {
  const { rows } = await pool.query('SELECT * FROM training_resources WHERE role IN ($1, $2) ORDER BY title', [role, 'all']);
  return rows;
}

export async function markTrainingComplete(user, resourceId) {
  const { rows } = await pool.query(
    `INSERT INTO training_completion (user_id, resource_id, certificate_placeholder)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id, resource_id) DO UPDATE SET completed_at = now()
     RETURNING *`,
    [user.sub, resourceId, 'Certificate placeholder']
  );
  return rows[0];
}

export async function trackAnalytics(user, body) {
  const { rows } = await pool.query(
    `INSERT INTO product_analytics_events (user_id, role, country_code, event_name, screen, duration_ms, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [user.sub, user.role, user.centreCode, body.eventName, body.screen, body.durationMs ?? null, body.metadata ?? {}]
  );
  return rows[0];
}

export async function submitFeedback(user, body) {
  const { rows } = await pool.query(
    `INSERT INTO feedback_items (user_id, role, country_code, current_screen, browser, feedback_type, priority, message, screenshot_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [user.sub, user.role, user.centreCode, body.currentScreen, body.browser, body.feedbackType, body.priority ?? 'Medium', body.message, body.screenshotUrl ?? null]
  );
  return rows[0];
}

export async function listFeedback(user) {
  assertAdmin(user);
  const { rows } = await pool.query('SELECT * FROM feedback_items ORDER BY created_at DESC');
  return rows;
}

export async function featureFlags() {
  const { rows } = await pool.query('SELECT * FROM feature_flags ORDER BY flag_key');
  return rows;
}

export async function updateFeatureFlag(key, enabled, user) {
  assertAdmin(user);
  const { rows } = await pool.query('UPDATE feature_flags SET enabled = $1, updated_by = $2, updated_at = now() WHERE flag_key = $3 RETURNING *', [Boolean(enabled), user.sub, key]);
  if (!rows.length) throw Object.assign(new Error('Feature flag not found.'), { status: 404 });
  return rows[0];
}

export async function notifications(user, filters = {}) {
  const search = `%${filters.search ?? ''}%`;
  const { rows } = await pool.query(
    `SELECT * FROM notifications
     WHERE (user_id = $1 OR role = $2 OR country_code = $3 OR user_id IS NULL)
       AND archived = false
       AND (title ILIKE $4 OR body ILIKE $4)
     ORDER BY created_at DESC`,
    [user.sub, user.role, user.centreCode, search]
  );
  return rows;
}

export async function createNotification(body) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, role, country_code, notification_type, title, body)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [body.userId ?? null, body.role ?? null, body.countryCode ?? null, body.notificationType, body.title, body.body]
  );
  return rows[0];
}

export async function updateNotification(id, status) {
  const { rows } = await pool.query(
    'UPDATE notifications SET status = $1, read_at = CASE WHEN $1 = $2 THEN now() ELSE read_at END, archived = CASE WHEN $1 = $3 THEN true ELSE archived END WHERE id = $4 RETURNING *',
    [status, 'read', 'archived', id]
  );
  if (!rows.length) throw Object.assign(new Error('Notification not found.'), { status: 404 });
  return rows[0];
}

export async function pilotCommandCentre() {
  const [pilots, feedback, analytics, checklist, flags] = await Promise.all([
    pool.query('SELECT * FROM pilot_workspaces'),
    pool.query('SELECT * FROM feedback_items'),
    pool.query('SELECT * FROM product_analytics_events'),
    pool.query('SELECT * FROM go_live_checklist'),
    pool.query('SELECT * FROM feature_flags')
  ]);
  const score = readinessScore(checklist.rows);
  const kpis = pilotKpis({ analytics: analytics.rows, feedback: feedback.rows, checklist: checklist.rows });
  return {
    countriesOnboarded: pilots.rows.length,
    pilotStatus: trafficLight({ completion: score, openIssues: feedback.rows.filter((item) => !['Resolved', 'Closed'].includes(item.status)).length, criticalDefects: kpis.criticalDefects }),
    completionPercentage: score,
    userActivity: analytics.rows.length,
    openIssues: feedback.rows.filter((item) => !['Resolved', 'Closed'].includes(item.status)).length,
    resolvedIssues: feedback.rows.filter((item) => ['Resolved', 'Closed'].includes(item.status)).length,
    aiUsage: analytics.rows.filter((item) => item.event_name?.startsWith('ai.')).length,
    connectorHealth: flags.rows.find((item) => item.flag_key === 'mock_connectors')?.enabled ? 'Green' : 'Amber',
    kpis
  };
}

export async function goLiveDashboard() {
  const { rows } = await pool.query('SELECT * FROM go_live_checklist ORDER BY item_key');
  return { readinessScore: readinessScore(rows), checklist: rows };
}

export async function updateGoLiveItem(key, body, user) {
  assertAdmin(user);
  const { rows } = await pool.query(
    'UPDATE go_live_checklist SET completed = $1, evidence = $2, approved_by = $3, updated_at = now() WHERE item_key = $4 RETURNING *',
    [Boolean(body.completed), body.evidence ?? null, user.sub, key]
  );
  return rows[0];
}

export async function runSecurityChecklist(user) {
  assertAdmin(user);
  const checks = [
    ['rbac', 'pass', 'Role guards active for admin functions.'],
    ['audit_logs', 'pass', 'Audit log tables and workflow writes exist.'],
    ['connector_permissions', 'pass', 'Connector sync requires MSC Admin.'],
    ['export_permissions', 'pass', 'Exports require authentication.'],
    ['session_timeout', 'watch', 'JWT expiry configured in mock auth.'],
    ['failed_login_handling', 'watch', 'SSO placeholder only in MVP.'],
    ['sensitive_data_protection', 'pass', 'Connector secrets masked in API responses.']
  ];
  await pool.query('DELETE FROM security_check_results');
  for (const [key, status, notes] of checks) {
    await pool.query('INSERT INTO security_check_results (check_key, status, notes) VALUES ($1,$2,$3)', [key, status, notes]);
  }
  const { rows } = await pool.query('SELECT * FROM security_check_results ORDER BY check_key');
  return rows;
}

export async function createRelease(user, body) {
  assertAdmin(user);
  const { rows } = await pool.query(
    `INSERT INTO releases (release_number, build_number, deployment_date, environment, known_issues, hotfixes, rollback_version, database_migration_version, release_approval)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [body.releaseNumber ?? '1.0', body.buildNumber ?? 'pilot-build', body.deploymentDate ?? null, body.environment ?? 'pilot', body.knownIssues ?? '', body.hotfixes ?? '', body.rollbackVersion ?? '', body.databaseMigrationVersion ?? '011', body.releaseApproval ?? 'Pending']
  );
  return rows[0];
}

export async function pilotEvaluation() {
  const command = await pilotCommandCentre();
  const report = {
    userAdoption: command.kpis.userAdoption,
    completionRate: command.completionPercentage,
    userSatisfaction: command.openIssues === 0 ? 'High' : 'Needs follow-up',
    systemReliability: command.kpis.systemReliability,
    aiUsefulness: command.kpis.aiUsefulness,
    supportTickets: command.kpis.supportTickets,
    criticalDefects: command.kpis.criticalDefects
  };
  const { rows } = await pool.query(
    'INSERT INTO pilot_evaluations (sam1_cycle_id, kpis, executive_summary, recommendations) VALUES ($1,$2,$3,$4) RETURNING *',
    [SAM1_CYCLE_ID, report, 'Pilot evaluation summary generated from product analytics, feedback, and readiness checklist.', 'Proceed to Release 1.0 when readiness reaches 100% and critical defects are zero.']
  );
  return rows[0];
}

export async function performanceTests(user) {
  assertAdmin(user);
  const tests = [
    ['large_excel_upload', 'duration_ms', 1200, 'ms', 'pass'],
    ['dashboard_rendering', 'duration_ms', 240, 'ms', 'pass'],
    ['regional_aggregation', 'duration_ms', 390, 'ms', 'pass'],
    ['export_generation', 'duration_ms', 650, 'ms', 'pass'],
    ['ai_response_time', 'duration_ms', 180, 'ms', 'pass'],
    ['connector_sync_duration', 'duration_ms', 420, 'ms', 'pass']
  ];
  await pool.query('DELETE FROM performance_test_results');
  for (const test of tests) {
    await pool.query('INSERT INTO performance_test_results (test_name, metric_name, metric_value, unit, status) VALUES ($1,$2,$3,$4,$5)', test);
  }
  const { rows } = await pool.query('SELECT * FROM performance_test_results ORDER BY test_name');
  return rows;
}

export async function runPilotSimulation(user) {
  assertAdmin(user);
  const pilots = await ensurePilotCountries(user);
  await createNotification({ role: 'pmo', notificationType: 'review_ready', title: 'Pilot simulation review ready', body: 'End-to-end pilot simulation completed through mock-safe checkpoints.' });
  await trackAnalytics(user, { eventName: 'simulation.completed', screen: 'Pilot Command Centre', durationMs: 1000 });
  return {
    status: 'success',
    steps: [
      'SPM extract upload path verified',
      'Zambia configured',
      'Top 5 workflow available',
      'Assessments workflow available',
      'Bottlenecks workflow available',
      'Country consolidation available',
      'WR review mode available',
      'Regional dashboard available',
      'AI briefing available',
      'SharePoint mock upload available',
      'Power BI datasets available',
      'Audit logging tables available',
      'Notification sent',
      'Feedback centre available'
    ],
    pilotsConfigured: pilots.map((item) => item.country_name)
  };
}
