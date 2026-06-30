import { pool, withTransaction } from '../db.js';
import {
  assertCanComplete,
  assertCanCreateSelection,
  assertCanUpdateSelection,
  completionStatus,
  MAX_SELECTIONS,
  SAM1_CYCLE_ID
} from './selectionRules.js';

function teamRow(row) {
  const selectedCount = Number(row.selected_count ?? 0);
  const hasCompleted = Boolean(row.has_completed);
  return {
    id: row.id,
    name: row.name,
    planType: row.plan_type,
    biennium: row.biennium,
    budgetCentreId: row.budget_centre_id,
    budgetCentreCode: row.budget_centre_code,
    budgetCentreName: row.budget_centre_name,
    totalAvailable: Number(row.total_available ?? 0),
    selectedCount,
    remainingSelections: Math.max(MAX_SELECTIONS - selectedCount, 0),
    completionStatus: completionStatus(selectedCount, hasCompleted),
    status: hasCompleted ? 'completed' : selectedCount === 0 ? 'not_started' : 'in_progress'
  };
}

function productRow(row) {
  return {
    id: row.id,
    teamId: row.team_id,
    productServiceName: row.pe_name,
    resultOutput: row.result_output,
    planNames: row.plan_names ?? [],
    plannedCost: Number(row.planned_cost ?? 0),
    amount: Number(row.total_cost ?? 0),
    fundingSources: row.funding_sources ?? [],
    statusFields: row.metadata?.statusFields ?? [],
    selection: row.selection_id ? {
      id: row.selection_id,
      rank: row.rank,
      rationale: row.rationale,
      status: row.selection_status
    } : null
  };
}

function selectionRow(row) {
  return {
    id: row.id,
    sam1CycleId: row.sam1_cycle_id,
    budgetCentreId: row.budget_centre_id,
    teamId: row.team_id,
    productServiceId: row.product_service_id,
    productServiceName: row.pe_name,
    resultOutput: row.result_output,
    planNames: row.plan_names ?? [],
    amount: Number(row.total_cost ?? 0),
    fundingSources: row.funding_sources ?? [],
    rank: row.rank,
    rationale: row.rationale,
    status: row.status,
    selectedBy: row.selected_by,
    selectedAt: row.selected_at,
    updatedAt: row.updated_at
  };
}

async function currentSelections(db, teamId) {
  const { rows } = await db.query(
    `SELECT id, product_service_id, rank, rationale, status
     FROM team_ps_selections
     WHERE team_id = $1 AND sam1_cycle_id = $2
     ORDER BY rank`,
    [teamId, SAM1_CYCLE_ID]
  );
  return rows;
}

async function productForTeam(db, teamId, productServiceId) {
  const { rows } = await db.query(
    `SELECT ps.*, t.budget_centre_id
     FROM products_services ps
     JOIN teams t ON t.id = ps.team_id
     JOIN workplans w ON w.import_id = ps.import_id AND w.team_id = ps.team_id
     WHERE ps.id = $1 AND ps.team_id = $2 AND lower(w.approval_status) = 'approved'
     LIMIT 1`,
    [productServiceId, teamId]
  );
  return rows[0];
}

export async function listBudgetCentres() {
  const { rows } = await pool.query(
    `SELECT bc.id, bc.code, bc.name, bc.centre_type,
       COUNT(DISTINCT t.id)::int AS team_count,
       COALESCE(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_count
     FROM budget_centres bc
     LEFT JOIN teams t ON t.budget_centre_id = bc.id
     LEFT JOIN (
       SELECT DISTINCT team_id, status
       FROM team_ps_selections
       WHERE sam1_cycle_id = $1 AND status = 'completed'
     ) s ON s.team_id = t.id
     GROUP BY bc.id
     ORDER BY bc.code`,
    [SAM1_CYCLE_ID]
  );
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    centreType: row.centre_type,
    teamCount: Number(row.team_count),
    completedCount: Number(row.completed_count)
  }));
}

export async function listTeamsForBudgetCentre(budgetCentreId) {
  const { rows } = await pool.query(
    `SELECT t.*, bc.code AS budget_centre_code, bc.name AS budget_centre_name,
       COUNT(DISTINCT ps.id)::int AS total_available,
       COUNT(DISTINCT s.id)::int AS selected_count,
       BOOL_OR(s.status = 'completed') AS has_completed
     FROM teams t
     JOIN budget_centres bc ON bc.id = t.budget_centre_id
     LEFT JOIN products_services ps ON ps.team_id = t.id
     LEFT JOIN team_ps_selections s ON s.team_id = t.id AND s.sam1_cycle_id = $2
     WHERE t.budget_centre_id = $1
     GROUP BY t.id, bc.code, bc.name
     ORDER BY t.name`,
    [budgetCentreId, SAM1_CYCLE_ID]
  );
  return rows.map(teamRow);
}

export async function getTeam(teamId) {
  const { rows } = await pool.query(
    `SELECT t.*, bc.code AS budget_centre_code, bc.name AS budget_centre_name,
       COUNT(DISTINCT ps.id)::int AS total_available,
       COUNT(DISTINCT s.id)::int AS selected_count,
       BOOL_OR(s.status = 'completed') AS has_completed
     FROM teams t
     JOIN budget_centres bc ON bc.id = t.budget_centre_id
     LEFT JOIN products_services ps ON ps.team_id = t.id
     LEFT JOIN team_ps_selections s ON s.team_id = t.id AND s.sam1_cycle_id = $2
     WHERE t.id = $1
     GROUP BY t.id, bc.code, bc.name`,
    [teamId, SAM1_CYCLE_ID]
  );
  return rows[0] ? teamRow(rows[0]) : null;
}

export async function listProductsForTeam(teamId) {
  const { rows } = await pool.query(
    `SELECT ps.*, s.id AS selection_id, s.rank, s.rationale, s.status AS selection_status
     FROM products_services ps
     LEFT JOIN team_ps_selections s
       ON s.product_service_id = ps.id AND s.team_id = ps.team_id AND s.sam1_cycle_id = $2
     WHERE ps.team_id = $1
     ORDER BY ps.pe_name, ps.result_output`,
    [teamId, SAM1_CYCLE_ID]
  );
  return rows.map(productRow);
}

export async function listSelectionsForTeam(teamId) {
  const { rows } = await pool.query(
    `SELECT s.*, ps.pe_name, ps.result_output, ps.plan_names, ps.total_cost, ps.funding_sources
     FROM team_ps_selections s
     JOIN products_services ps ON ps.id = s.product_service_id
     WHERE s.team_id = $1 AND s.sam1_cycle_id = $2
     ORDER BY s.rank`,
    [teamId, SAM1_CYCLE_ID]
  );
  return rows.map(selectionRow);
}

export async function createSelection(teamId, body, selectedBy) {
  return withTransaction(async (db) => {
    const selections = await currentSelections(db, teamId);
    const product = await productForTeam(db, teamId, body.productServiceId);
    const rank = Number(body.rank || selections.length + 1);
    assertCanCreateSelection({ selections, product, productServiceId: body.productServiceId, rank });

    const { rows } = await db.query(
      `INSERT INTO team_ps_selections (
        sam1_cycle_id, budget_centre_id, team_id, product_service_id, rank, rationale, selected_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [SAM1_CYCLE_ID, product.budget_centre_id, teamId, body.productServiceId, rank, body.rationale ?? '', selectedBy]
    );
    return rows[0];
  });
}

export async function updateSelection(teamId, selectionId, body) {
  return withTransaction(async (db) => {
    const selections = await currentSelections(db, teamId);
    assertCanUpdateSelection({ selections, selectionId, rank: body.rank });
    const { rows } = await db.query(
      `UPDATE team_ps_selections
       SET rank = COALESCE($1, rank),
           rationale = COALESCE($2, rationale),
           status = 'draft',
           updated_at = now()
       WHERE id = $3 AND team_id = $4 AND sam1_cycle_id = $5
       RETURNING *`,
      [body.rank ?? null, body.rationale ?? null, selectionId, teamId, SAM1_CYCLE_ID]
    );
    if (!rows.length) throw Object.assign(new Error('Selection not found.'), { status: 404 });
    return rows[0];
  });
}

export async function deleteSelection(teamId, selectionId) {
  await withTransaction(async (db) => {
    const { rows } = await db.query(
      `DELETE FROM team_ps_selections
       WHERE id = $1 AND team_id = $2 AND sam1_cycle_id = $3
       RETURNING rank`,
      [selectionId, teamId, SAM1_CYCLE_ID]
    );
    if (!rows.length) throw Object.assign(new Error('Selection not found.'), { status: 404 });

    const remaining = await currentSelections(db, teamId);
    for (let index = 0; index < remaining.length; index += 1) {
      await db.query(
        `UPDATE team_ps_selections SET rank = $1, status = 'draft', updated_at = now() WHERE id = $2`,
        [index + 1, remaining[index].id]
      );
    }
  });
}

export async function completeSelections(teamId) {
  return withTransaction(async (db) => {
    const selections = await currentSelections(db, teamId);
    assertCanComplete(selections);
    const { rows } = await db.query(
      `UPDATE team_ps_selections
       SET status = 'completed', updated_at = now()
       WHERE team_id = $1 AND sam1_cycle_id = $2
       RETURNING *`,
      [teamId, SAM1_CYCLE_ID]
    );
    return rows;
  });
}
