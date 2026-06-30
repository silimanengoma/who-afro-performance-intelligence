import { withTransaction } from '../db.js';

export async function persistImport(parsed, uploadedBy) {
  return withTransaction(async (db) => {
    const centreIds = new Map();
    const teamIds = new Map();

    for (const centre of parsed.budgetCentres) {
      const { rows } = await db.query(
        `INSERT INTO budget_centres (code, name, centre_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, centre_type = EXCLUDED.centre_type
         RETURNING id`,
        [centre.code, centre.name, centre.centreType]
      );
      centreIds.set(centre.code, rows[0].id);
    }

    for (const team of parsed.teams) {
      const { rows } = await db.query(
        `INSERT INTO teams (budget_centre_id, name, plan_type, biennium, total_cost, funding_sources)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (budget_centre_id, name, plan_type, biennium)
         DO UPDATE SET total_cost = EXCLUDED.total_cost, funding_sources = EXCLUDED.funding_sources
         RETURNING id`,
        [centreIds.get(team.budgetCentreCode), team.name, team.planType, team.biennium, team.totalCost, team.fundingSources]
      );
      teamIds.set(team.key, rows[0].id);
    }

    const { rows: importRows } = await db.query(
      `INSERT INTO spm_imports (
        uploaded_by, filename, total_rows, approved_rows, excluded_rows,
        budget_centre_count, team_count, product_service_count,
        duplicate_count, missing_approval_count, missing_pe_count, missing_output_count,
        exclusion_reasons, raw_rows
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        uploadedBy,
        parsed.filename,
        parsed.totalRows,
        parsed.approvedRows,
        parsed.excludedRows,
        parsed.budgetCentreCount,
        parsed.teamCount,
        parsed.productServiceCount,
        parsed.duplicateCount,
        parsed.missingApprovalCount,
        parsed.missingPeCount,
        parsed.missingOutputCount,
        parsed.exclusionReasons,
        parsed.rawRows
      ]
    );

    const importId = importRows[0].id;
    for (const row of parsed.approvedRowsData) {
      const teamKey = [row.budgetCentreCode, row.teamName, row.planType, row.biennium].join('|');
      await db.query(
        `INSERT INTO workplans (import_id, team_id, plan_name, approval_status, raw_row)
         VALUES ($1, $2, $3, $4, $5)`,
        [importId, teamIds.get(teamKey), row.planName, row.approvalStatus, row.rawRow]
      );
    }

    for (const product of parsed.products) {
      await db.query(
        `INSERT INTO products_services (
          import_id, team_id, pe_name, result_output, total_cost, funding_sources,
          plan_names, planned_cost, metadata
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          importId,
          teamIds.get(product.teamKey),
          product.peName,
          product.resultOutput,
          product.totalCost,
          product.fundingSources,
          product.planNames,
          product.plannedCost,
          { statusFields: product.statusFields }
        ]
      );
    }

    return importRows[0];
  });
}

export function importSummary(row) {
  if (!row) return null;
  return {
    id: row.id,
    filename: row.filename,
    createdAt: row.created_at,
    totals: {
      total: row.total_rows,
      approved: row.approved_rows,
      excluded: row.excluded_rows,
      budgetCentres: row.budget_centre_count,
      teams: row.team_count,
      productsServices: row.product_service_count
    },
    dataQuality: {
      duplicates: row.duplicate_count,
      missingApproval: row.missing_approval_count,
      missingPe: row.missing_pe_count,
      missingOutput: row.missing_output_count
    },
    exclusionReasons: row.exclusion_reasons
  };
}
