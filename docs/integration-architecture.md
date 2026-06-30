# SAM 1 Integration Architecture

## Overview

SAM 1 remains the intelligence and workflow layer. Corporate systems remain authoritative. Excel upload remains the active SPM fallback during MVP, while connector abstractions prepare the platform for live SPM, GSM, HR, WHO SSO, SharePoint, and Power BI integrations.

## Connector Registry

Connectors are stored in `connector_registry` with status, auth mode, owner, environment, masked configuration, last sync status, and enabled flag. Supported connectors:

- `spm`
- `gsm`
- `hr`
- `sso`
- `sharepoint`
- `powerbi`

## Connector Interface Contract

Every connector implements:

- `initialize()`
- `authenticate()`
- `testConnection()`
- `fetchData(params)`
- `transformData(rawData)`
- `validateData(transformedData)`
- `sync(params)`
- `getLastSyncStatus()`
- `handleError(error)`
- `logSyncEvent(event)`
- `disconnect()`

Current implementations are mock connectors. Business logic calls the shared interface, so live connectors can replace mocks without rewriting workflows.

## SPM Plan

SPM remains authoritative for workplans, approval status, Products and Services, GPW14 Outputs, planned costs, Budget Centres, and Teams. The mock SPM connector reads existing import tables and attaches `source_lineage`. Future live SPM API sync should replace the Excel reader behind the same connector contract.

## GSM Plan

GSM mock sync creates `financial_snapshots`, `budget_execution`, and `procurement_signals`. Live GSM should provide allocations, expenditure, encumbrance, burn rate, funding gaps, execution percentage, procurement status, programme area, Budget Centre, and workplan/output references.

## HR Plan

HR mock sync creates `workforce_snapshots`, `positions`, `vacancies`, and `workforce_risk_signals`. Live HR should provide staffing, vacancies, critical positions, contract end dates where available, absence signals, and workforce gap mapping by Budget Centre and Team.

## WHO SSO Plan

Mock login remains active. WHO SSO is represented as a placeholder provider compatible with OIDC or SAML. Required claims:

- `email`
- `name`
- `groups`
- `budget_centre`
- `role`

Role and Budget Centre mapping should be configured from identity groups. Fallback login remains available until WHO SSO is production-ready.

## SharePoint Plan

Mock SharePoint upload writes document export metadata and returns a mock SharePoint URL. Live SharePoint should upload Country Review Packs, final submissions, Decision Logs, evidence, Regional Intelligence Notes, and MEC briefing documents into configured document libraries.

## Power BI Plan

Power BI endpoints expose structured data feeds for:

- country intelligence
- regional intelligence
- decision tracker
- bottlenecks
- outputs

Future options include push datasets, secured API feeds, or embedded dashboards. Row-level security should filter by role, Budget Centre, country, or cluster.

## Source Lineage

All synced records can be traced through `source_lineage`:

- `source_system`
- `source_record_id`
- `source_file_id`
- `source_import_id`
- `sync_run_id`
- `imported_at`
- `imported_by`
- `source_last_modified_at`
- `confidence_level`
- `validation_status`

## Sync Error Handling

Sync runs are stored in `sync_runs`; failed records and details are stored in `sync_errors`. Error categories include authentication, authorization, network, timeout, schema mismatch, missing required field, duplicate record, validation failure, transformation failure, and unknown errors.

Failed syncs must not delete or corrupt existing validated data. Failed records are quarantined in `sync_errors.quarantined_record`.

## Security Assumptions

- No real credentials are stored in code.
- Secrets must be supplied via environment variables or managed secret storage.
- API responses mask secret-like config keys.
- Only MSC Admin can test or run connector syncs.
- DPM and other users may view status where permitted.
- Logs must not expose credentials or tokens.

## Live Integration Checklist

1. Confirm authoritative API endpoints and data contracts.
2. Configure secrets outside source control.
3. Map identity groups to SAM 1 roles.
4. Validate source lineage fields for each source.
5. Run connector in test environment.
6. Compare live sync output against Excel fallback.
7. Enable incremental sync and source-last-modified tracking.
8. Monitor sync errors and quarantine rates.
9. Enable production connector.
10. Retain Excel upload fallback until live sync is proven stable.
