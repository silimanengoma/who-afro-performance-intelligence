import { pool, withTransaction } from '../db.js';
import { countryIntelligence } from './countryRepository.js';
import { regionalDashboard } from './regionalRepository.js';
import { assertAdmin, connectorIds, integrationEvent, maskConnector } from './integrationRules.js';

class MockConnector {
  constructor(id) {
    this.id = id;
  }
  async initialize() {
    return { initialized: true, connectorId: this.id };
  }
  async authenticate() {
    return { authenticated: true, authMode: 'mock' };
  }
  async testConnection() {
    await this.authenticate();
    return { ok: true, connectorId: this.id, mode: 'mock' };
  }
  async fetchData() {
    return [];
  }
  async transformData(rawData) {
    return rawData;
  }
  async validateData(transformedData) {
    return { valid: true, records: transformedData.length };
  }
  async sync(params = {}, userId = null) {
    return runConnectorSync(this.id, params, userId);
  }
  async getLastSyncStatus() {
    return connectorStatus(this.id);
  }
  async handleError(error) {
    return { category: 'unknown_error', message: error.message };
  }
  async logSyncEvent(event) {
    return event;
  }
  async disconnect() {
    return { disconnected: true };
  }
}

export const connectorRegistry = Object.fromEntries(connectorIds.map((id) => [id, new MockConnector(id)]));

async function ensureConnector(id) {
  const { rows } = await pool.query('SELECT * FROM connector_registry WHERE connector_id = $1', [id]);
  if (!rows.length) throw Object.assign(new Error('Connector not registered.'), { status: 404 });
  return rows[0];
}

export async function listConnectors() {
  const { rows } = await pool.query('SELECT * FROM connector_registry ORDER BY connector_id');
  return rows.map(maskConnector);
}

export async function connectorStatus(id) {
  return maskConnector(await ensureConnector(id));
}

export async function connectorErrors(id) {
  const { rows } = await pool.query('SELECT * FROM sync_errors WHERE connector_id = $1 ORDER BY created_at DESC LIMIT 50', [id]);
  return rows;
}

export async function lastSync(id) {
  const { rows } = await pool.query('SELECT * FROM sync_runs WHERE connector_id = $1 ORDER BY started_at DESC LIMIT 1', [id]);
  return rows[0] ?? null;
}

async function createRun(db, connectorId, params, userId) {
  const { rows } = await db.query(
    'INSERT INTO sync_runs (connector_id, status, triggered_by, params) VALUES ($1, $2, $3, $4) RETURNING *',
    [connectorId, 'running', userId, params]
  );
  return rows[0];
}

async function finishRun(db, run, connectorId, status, counts, eventName, errorMessage = null) {
  await db.query(
    `UPDATE sync_runs SET status = $1, completed_at = now(), records_fetched = $2, records_synced = $3,
       event_name = $4, cache_invalidated = $5 WHERE id = $6`,
    [status, counts.fetched, counts.synced, eventName, status === 'success', run.id]
  );
  await db.query(
    `UPDATE connector_registry SET last_sync_at = now(), last_sync_status = $1, status = CASE WHEN $1 = 'success' THEN 'mock' ELSE 'failed' END,
       error_message = $2, updated_at = now() WHERE connector_id = $3`,
    [status, errorMessage, connectorId]
  );
}

async function addLineage(db, entityType, entityId, sourceSystem, sourceRecordId, syncRunId, userId, metadata = {}) {
  await db.query(
    `INSERT INTO source_lineage (
      entity_type, entity_id, source_system, source_record_id, sync_run_id, imported_by, confidence_level, validation_status, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,'mock','valid',$7)`,
    [entityType, entityId, sourceSystem, sourceRecordId, syncRunId, userId, metadata]
  );
}

export async function runConnectorSync(connectorId, params = {}, userId = null) {
  await ensureConnector(connectorId);
  return withTransaction(async (db) => {
    const run = await createRun(db, connectorId, params, userId);
    try {
      let counts = { fetched: 0, synced: 0 };
      if (connectorId === 'spm') counts = await syncSpm(db, run, userId);
      if (connectorId === 'gsm') counts = await syncGsm(db, run, params, userId);
      if (connectorId === 'hr') counts = await syncHr(db, run, params, userId);
      if (connectorId === 'powerbi') counts = { fetched: 5, synced: 5 };
      if (connectorId === 'sso') counts = { fetched: 2, synced: 2 };
      if (connectorId === 'sharepoint') counts = { fetched: 0, synced: 0 };
      const eventName = integrationEvent(connectorId, 'sync', 'success');
      await finishRun(db, run, connectorId, 'success', counts, eventName);
      return { syncRunId: run.id, connectorId, status: 'success', eventName, ...counts };
    } catch (error) {
      const eventName = integrationEvent(connectorId, 'sync', 'failed');
      await finishRun(db, run, connectorId, 'failed', { fetched: 0, synced: 0 }, eventName, error.message);
      await db.query(
        'INSERT INTO sync_errors (sync_run_id, connector_id, error_category, user_message, technical_details) VALUES ($1,$2,$3,$4,$5)',
        [run.id, connectorId, 'unknown_error', 'Sync failed. Existing validated data was not changed.', error.stack ?? error.message]
      );
      throw error;
    }
  });
}

async function syncSpm(db, run, userId) {
  const { rows } = await db.query(
    `SELECT ps.id, ps.pe_name, ps.result_output, ps.import_id, t.name AS team_name, bc.code AS centre_code
     FROM products_services ps
     JOIN teams t ON t.id = ps.team_id
     JOIN budget_centres bc ON bc.id = t.budget_centre_id
     ORDER BY ps.created_at DESC LIMIT 500`
  );
  for (const row of rows) {
    await addLineage(db, 'products_services', row.id, 'SPM', row.id, run.id, userId, { importId: row.import_id, team: row.team_name, centre: row.centre_code });
  }
  return { fetched: rows.length, synced: rows.length };
}

async function syncGsm(db, run, params, userId) {
  const { rows: centres } = await db.query('SELECT id, code FROM budget_centres ORDER BY code LIMIT 10');
  let synced = 0;
  for (const [index, centre] of centres.entries()) {
    const allocation = 100000 + index * 15000;
    const expenditure = 45000 + index * 10000;
    const encumbrance = 8000 + index * 500;
    const execution = Number(((expenditure / allocation) * 100).toFixed(2));
    const snapshot = await db.query(
      `INSERT INTO financial_snapshots (sync_run_id, budget_centre_id, reporting_period, allocation, expenditure, encumbrance, burn_rate, funding_gap, execution_percentage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [run.id, centre.id, params.reportingPeriod ?? 'MVP', allocation, expenditure, encumbrance, execution, allocation - expenditure - encumbrance, execution]
    );
    await addLineage(db, 'financial_snapshots', snapshot.rows[0].id, 'GSM', `gsm-${centre.code}`, run.id, userId);
    if (execution < 50) {
      await db.query(
        'INSERT INTO procurement_signals (sync_run_id, budget_centre_id, signal_type, severity, description) VALUES ($1,$2,$3,$4,$5)',
        [run.id, centre.id, 'underutilization', 'Medium', 'Mock GSM signal: budget execution below 50%.']
      );
    }
    synced += 1;
  }
  return { fetched: centres.length, synced };
}

async function syncHr(db, run, params, userId) {
  const { rows: teams } = await db.query('SELECT t.id, t.name, t.budget_centre_id FROM teams t ORDER BY t.created_at DESC LIMIT 10');
  let synced = 0;
  for (const [index, team] of teams.entries()) {
    const vacancies = index % 3;
    const snapshot = await db.query(
      `INSERT INTO workforce_snapshots (sync_run_id, budget_centre_id, team_id, reporting_period, staff_count, vacancy_count, critical_positions_vacant)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [run.id, team.budget_centre_id, team.id, params.reportingPeriod ?? 'MVP', 8 + index, vacancies, vacancies > 1 ? 1 : 0]
    );
    await addLineage(db, 'workforce_snapshots', snapshot.rows[0].id, 'HR', `hr-${team.id}`, run.id, userId);
    if (vacancies > 0) {
      await db.query(
        'INSERT INTO workforce_risk_signals (sync_run_id, budget_centre_id, team_id, signal_type, severity, description) VALUES ($1,$2,$3,$4,$5,$6)',
        [run.id, team.budget_centre_id, team.id, 'vacancy_affecting_delivery', vacancies > 1 ? 'High' : 'Medium', 'Mock HR signal: vacancy may affect delivery.']
      );
    }
    synced += 1;
  }
  return { fetched: teams.length, synced };
}

export async function testConnector(connectorId) {
  await ensureConnector(connectorId);
  return connectorRegistry[connectorId].testConnection();
}

export async function budgetCentreFinance(id) {
  const { rows } = await pool.query('SELECT * FROM financial_snapshots WHERE budget_centre_id = $1 ORDER BY created_at DESC', [id]);
  return rows;
}

export async function budgetCentreWorkforce(id) {
  const { rows } = await pool.query('SELECT * FROM workforce_snapshots WHERE budget_centre_id = $1 ORDER BY created_at DESC', [id]);
  return rows;
}

export async function authProviders() {
  return {
    providers: [
      { id: 'mock', name: 'Mock seeded login', active: true },
      { id: 'who_sso_placeholder', name: 'WHO SSO placeholder', active: false, protocols: ['OIDC', 'SAML'] }
    ],
    requiredClaims: ['email', 'name', 'groups', 'budget_centre', 'role']
  };
}

export async function sharePointUpload(body, userId) {
  return withTransaction(async (db) => {
    const exportRows = await db.query(
      'INSERT INTO document_exports (document_type, filename, content_type, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [body.documentType ?? 'report', body.filename ?? 'sam1-document.html', body.contentType ?? 'text/html', userId]
    );
    const url = `https://sharepoint.example.mock/sites/sam1/${exportRows.rows[0].id}/${encodeURIComponent(exportRows.rows[0].filename)}`;
    const linkRows = await db.query(
      'INSERT INTO document_storage_links (document_export_id, connector_id, storage_url, version) VALUES ($1,$2,$3,$4) RETURNING *',
      [exportRows.rows[0].id, 'sharepoint', url, 1]
    );
    const run = await createRun(db, 'sharepoint', { filename: exportRows.rows[0].filename }, userId);
    await finishRun(db, run, 'sharepoint', 'success', { fetched: 1, synced: 1 }, integrationEvent('sharepoint', 'upload', 'success'));
    return { document: exportRows.rows[0], link: linkRows.rows[0], url };
  });
}

export async function documentLink(id) {
  const { rows } = await pool.query(
    `SELECT d.*, l.storage_url, l.version
     FROM document_exports d
     LEFT JOIN document_storage_links l ON l.document_export_id = d.id
     WHERE d.id = $1`,
    [id]
  );
  if (!rows.length) throw Object.assign(new Error('Document not found.'), { status: 404 });
  return rows[0];
}

export async function powerBiDataset(name) {
  if (name === 'country-intelligence') return countryIntelligence();
  if (name === 'regional-intelligence') return regionalDashboard();
  if (name === 'decision-tracker') {
    const { rows } = await pool.query('SELECT * FROM final_decision_logs ORDER BY updated_at DESC');
    return { decisions: rows };
  }
  if (name === 'bottlenecks') {
    const { rows } = await pool.query('SELECT * FROM bottlenecks ORDER BY updated_at DESC');
    return { bottlenecks: rows };
  }
  if (name === 'outputs') {
    const { rows } = await pool.query('SELECT result_output, COUNT(*)::int AS count FROM products_services GROUP BY result_output ORDER BY count DESC');
    return { outputs: rows };
  }
  throw Object.assign(new Error('Unknown Power BI dataset.'), { status: 404 });
}

export function requireConnectorAdmin(req) {
  assertAdmin(req.user);
}
