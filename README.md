# SAM 1 Platform - Pilot Release 1.0 Readiness

Technical foundation plus Team Workspace, Country Intelligence, WR Review sign-off/locking, Regional Performance Intelligence, integrations, AI Copilot, and Pilot Release enablement.

Deployment manifests are included for Vercel and Render. See [Deployment Guide](docs/deployment.md).

## Quick Start

```bash
pnpm install
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
docker compose up -d db
pnpm run migrate
pnpm run dev
```

Open `http://localhost:5173`.

Seeded upload users are `MSC Admin`, `Zambia PMO`, and `Sierra Leone PMO`. Team Leads can open their Budget Centre teams and manage Top 5 selections after an import.

## Sprint 2 Workflow

1. Log in as `MSC Admin`, a PMO, or a Team Lead.
2. Import the SPM extract if one is not already loaded.
3. Use the Budget Centre Dashboard to open a Team Workspace.
4. Search and filter approved Products & Services by name, GPW14 Output, Funding Source, or Plan Name.
5. Select up to five Products & Services.
6. Rank selected items from 1 to 5 and enter a short rationale for each.
7. Save drafts at any time, then mark the selection complete once all five rationales are present.

## Manual Test Notes

- Select one Product & Service and refresh the page; the selection should persist.
- Try to select a sixth Product & Service; the API should reject it.
- Try to select the same Product & Service twice; the API should reject it.
- Try to complete with a missing rationale; completion should be blocked.
- Try to assign the same rank to two selections; the API should reject it.
- Remove a selected Product & Service; remaining ranks are compacted and returned to draft.
- Return to the Budget Centre Dashboard; team status should show `0/5 Not started`, `1/5 In progress`, `5/5 Ready to complete`, or `Completed`.

## Sprint 3 Workflow

1. Complete a team's Top 5 selection.
2. In the Team Workspace, use the Assessment Status panel to continue the next incomplete assessment.
3. Complete the four wizard steps:
   - Delivery status and planned versus actual deliverables
   - Evidence/source and data confidence
   - Contribution to the related GPW14 Output
   - Review and submit
4. Save as draft at any step, or mark complete when mandatory fields are valid.
5. Return to the Budget Centre Dashboard to review PMO-level assessment completion and delivery status distribution.

## Sprint 3 Manual Test Notes

- A selected Top 5 Product & Service can be assessed from the Assessment Dashboard.
- A non-selected Product & Service has no assessment endpoint entry and cannot be assessed.
- Draft assessment fields persist after saving and refreshing.
- Completion is blocked when mandatory fields are missing.
- Contribution narrative is required before completion.
- Progress percentage must be between 0 and 100.
- Completed assessments show as `Complete` on the Team Assessment Dashboard.
- PMO Budget Centre Dashboard reflects completed and pending assessments.
- Warnings appear when `Completed` is not 100%, `Not started` is not 0%, or data confidence is `Unavailable`.

## Sprint 4 Workflow

1. Complete or draft assessments for selected Top 5 Products & Services.
2. Open the Team Workspace Bottleneck Dashboard.
3. Review assessed P/S by delivery status, progress, output risk, bottleneck count, and highest severity.
4. Add bottlenecks one by one with category, severity, root cause, consequence, corrective action, support required, and escalation details.
5. Save draft or mark the bottleneck complete once required fields are valid.
6. Review the heatmap, high/critical items, escalation candidates, and corrective action pipeline.
7. Return to the Budget Centre Dashboard for consolidated PMO analytics.

## Sprint 4 Manual Test Notes

- A bottleneck can be added to an assessed Product & Service.
- Multiple bottlenecks can be added to the same assessed Product & Service.
- High/Critical bottlenecks require root cause and corrective action.
- Escalation level is required when escalation is marked `Yes`.
- Corrective action requires responsible person and target deadline.
- The bottleneck heatmap updates after adding bottlenecks.
- PMO dashboard shows High/Critical bottlenecks and escalation candidates through the Budget Centre summary.
- Corrective action list is generated from bottlenecks with proposed actions.
- Bottleneck data persists after refresh.
- Draft bottlenecks can be edited and deleted before completion.

## Sprint 5 Workflow

1. Log in as `MSC Admin`, PMO, or WR.
2. Open the Country Intelligence Workspace from the main dashboard.
3. Review Country Readiness, Delivery Intelligence, GPW14 Output Intelligence, Bottleneck Intelligence, Escalation Candidates, Learning Intelligence, and Corrective Actions.
4. Edit and save the Country Executive Summary.
5. Generate the Country Review Pack. The API returns versioned HTML plus MVP portable HTML payloads for PDF and DOCX rendering.

## Sprint 5 Manual Test Notes

- Country readiness updates from team selection, assessment, and bottleneck completion.
- Completion percentages calculate from completed participating teams.
- Delivery status aggregation reflects completed assessments.
- Output cards aggregate GPW14 contribution, risk, evidence, and bottleneck impact.
- Bottleneck category/severity charts update from bottleneck entries.
- Escalation candidates appear for High/Critical or explicitly escalated bottlenecks.
- Learning themes are generated from assessment and bottleneck patterns.
- Executive Summary can be edited and saved.
- Country Review Pack generation creates a versioned review, readiness snapshot, intelligence snapshot, learning clusters, and pack payload.

## Sprint 6 Workflow

1. Log in as `MSC Admin`, PMO, or WR.
2. Open `WR Review Meeting Mode` from the main dashboard.
3. Start the meeting once Country Intelligence is `Ready for WR Review`.
4. Navigate the agenda: Delivery, Outputs, Bottlenecks, Corrective Actions, Escalations, Learning, WR Assessment, Decision Log, and Sign-off.
5. Convert delivery issues or escalation candidates into Decision Log entries.
6. Validate learning themes.
7. Complete and save the WR Assessment.
8. Finalize the Decision Log.
9. WR signs off, then lock the Country SAM 1 submission.
10. Export the official submission package or Decision Log CSV from the API.

## Sprint 6 Manual Test Notes

- WR Review cannot start if the Country Intelligence package is not ready.
- PMO can start meeting preparation once ready.
- WR Assessment is required before sign-off.
- Corrective actions and escalations can be converted into Decision Log entries.
- Decision Log cannot be finalized with missing decision, owner, or deadline.
- Escalated decisions require escalation level.
- Sign-off fails if Decision Log is not finalized.
- Sign-off fails if learning themes are not validated.
- Sign-off succeeds when the checklist is complete.
- Submission lock records an audit event.
- Final submission package returns HTML/PDF-compatible HTML/DOCX-compatible HTML payloads.
- Decision Log CSV export is available at `/api/wr-review/:meetingId/export/decision-log.csv`.

## Sprint 7 Workflow

1. Lock one or more Country SAM 1 submissions through Sprint 6.
2. Log in as Admin/PMO/WR and open `Regional Intelligence`.
3. Switch between Cluster Director, MSC Regional, DPM Executive, and MEC Briefing workspaces.
4. Review regional KPIs, submission control tower, output risks, bottleneck heatmaps, escalation queue, decision tracker, learning hub, and MEC briefing material.
5. Save a Regional Intelligence Note for MSC/DPM/MEC use.

## Sprint 7 Manual Test Notes

- Regional dashboard aggregates locked submissions and country intelligence.
- KPIs calculate from assessments, bottlenecks, decisions, learnings, and support actions.
- Drill-down cards retain country/team/Product & Service traceability in API payloads.
- Regional reports and MEC briefing payloads are available from `/api/regional/mec-briefing`.
- Decision tracker reflects finalized country decision logs.
- Learning hub aggregates accepted/validated learning themes only.
- Regional Intelligence Note can be created with `POST /api/regional/intelligence-note`.

## Integration Planning Workflow

1. Log in as `MSC Admin`.
2. Open `Integrations`.
3. Review connector status for SPM, GSM, HR, WHO SSO, SharePoint, and Power BI.
4. Test connector connections.
5. Run mock SPM/GSM/HR syncs.
6. Use mock SharePoint upload to generate a document link.
7. Review sync errors and Power BI dataset feed URLs.

## Integration Manual Test Notes

- Connector registry returns all six connectors.
- Non-admin users can view connector status but cannot run sync/test actions.
- Mock SPM sync reads existing import data and attaches source lineage.
- GSM and HR syncs create financial/workforce mock snapshots and risk signals.
- Failed syncs are logged in `sync_errors` without deleting validated data.
- SharePoint mock upload returns a document storage URL.
- Power BI dataset endpoints return structured country, regional, decision, bottleneck, and output data.
- SSO providers include mock login and WHO SSO placeholder.
- Connector secret-like config keys are masked in API responses.

See [docs/integration-architecture.md](docs/integration-architecture.md) for connector contracts, lineage, security assumptions, and the live integration checklist.

## AI Copilot Workflow

1. Log in and open `Copilot`.
2. Ask a performance question or generate a briefing.
3. Review the AI-generated draft, citations, prompt version, and audit metadata.
4. Edit the draft directly in the Copilot output panel.
5. Use generated content only after human validation.

## AI Manual Test Notes

- AI outputs are labelled `AI-generated draft`.
- AI outputs include citations.
- Prompt versions are stored and shown.
- AI audit logs are created for every generation.
- Drafts are editable and stored as user edits.
- Provider abstraction defaults to deterministic mock provider.
- Non-admin users are scoped to their Budget Centre where applicable.

See [docs/ai-governance.md](docs/ai-governance.md) for AI design principles, auditability, provider abstraction, and prompt governance.

## Pilot Release 1.0 Workflow

1. Log in as `MSC Admin`.
2. Open `Pilot Centre`.
3. Configure the initial pilot workspaces for Zambia, Sierra Leone, and Chad.
4. Review onboarding steps, Help Centre, Training Library, Feature Flags, Notification Centre, and Go-Live Checklist.
5. Run performance tests and security checklist.
6. Run the end-to-end pilot simulation.
7. Record Release 1.0 approval.

## Pilot Release Manual Test Notes

- Three pilot countries can be configured.
- Role-based onboarding steps are returned.
- Help Centre and training resources are visible.
- Feedback submission works.
- Feature flags are visible and admin-configurable.
- Notifications can be listed and updated.
- Pilot Command Centre shows traffic-light status.
- Go-Live Checklist calculates readiness score.
- Security checklist and performance tests record results.
- End-to-end pilot simulation completes without manual database intervention.
- Release 1.0 can be recorded.

## Verification

```bash
pnpm run test
pnpm run lint
pnpm run build
```
