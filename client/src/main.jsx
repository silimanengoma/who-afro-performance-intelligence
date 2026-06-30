import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, ClipboardList, Database, FileUp, LockKeyhole, RefreshCcw, Search, ShieldCheck } from 'lucide-react';
import './styles.css';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function money(value) {
  return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function StatusPill({ status }) {
  const label = status || 'Not started';
  return <span className={`status-pill ${label.toLowerCase().replaceAll(' ', '-').replaceAll('/', '')}`}>{label}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function UserPicker({ users, activeUser, onLogin }) {
  return (
    <section className="panel login-panel">
      <div className="panel-title">
        <LockKeyhole size={20} />
        <h2>Seeded Login</h2>
      </div>
      <div className="user-grid">
        {users.map((user) => (
          <button className={activeUser?.id === user.id ? 'user selected' : 'user'} key={user.id} onClick={() => onLogin(user.id)}>
            <span>{user.name}</span>
            <small>{user.role.replace('_', ' ')}{user.centre_code ? ` - ${user.centre_code}` : ' - all'}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function UploadPanel({ canUpload, token, onImported }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function uploadFile(event) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await api('/imports', { method: 'POST', body, token });
      onImported(data.import);
      setMessage('Import complete. Budget Centre and Team workspaces are ready.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!canUpload) {
    return (
      <section className="panel readonly-panel">
        <ShieldCheck size={20} />
        <h2>View Only</h2>
        <p>Uploads are reserved for admin and PMO users. Team Leads can make Top 5 selections after an import.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <FileUp size={20} />
        <h2>SPM Import</h2>
      </div>
      <form className="upload-form" onSubmit={uploadFile}>
        <input type="file" accept=".xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <button disabled={!file || busy} type="submit">{busy ? 'Importing...' : 'Import SPM Extract'}</button>
      </form>
      {message && <p className="message">{message}</p>}
    </section>
  );
}

function ImportSummary({ summary, onRefresh }) {
  if (!summary) {
    return (
      <section className="panel empty">
        <Database size={28} />
        <h2>No Import Yet</h2>
        <p>Upload an approved SPM extract to populate the SAM 1 workspace.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="dashboard-header">
        <div>
          <h2>Import Summary</h2>
          <p>{summary.filename} - {new Date(summary.createdAt).toLocaleString()}</p>
        </div>
        <button className="icon-button" title="Refresh summary" onClick={onRefresh}>
          <RefreshCcw size={18} />
        </button>
      </div>
      <div className="stat-grid compact">
        <Stat label="Approved" value={money(summary.totals.approved)} />
        <Stat label="Budget Centres" value={money(summary.totals.budgetCentres)} />
        <Stat label="Teams" value={money(summary.totals.teams)} />
        <Stat label="Products & Services" value={money(summary.totals.productsServices)} />
      </div>
    </section>
  );
}

function BudgetCentreDashboard({ token, session, onOpenTeam, refreshKey }) {
  const [centres, setCentres] = useState([]);
  const [activeCentreId, setActiveCentreId] = useState('');
  const [teams, setTeams] = useState([]);
  const [assessmentStatus, setAssessmentStatus] = useState([]);
  const [bottleneckSummary, setBottleneckSummary] = useState(null);
  const [correctiveActions, setCorrectiveActions] = useState([]);

  useEffect(() => {
    if (!token) return;
    api('/budget-centres', { token }).then((data) => {
      const visible = session.user.role === 'admin'
        ? data.budgetCentres
        : data.budgetCentres.filter((centre) => centre.code === session.user.centre_code);
      setCentres(visible);
      setActiveCentreId((current) => current || visible[0]?.id || '');
    });
  }, [token, session, refreshKey]);

  useEffect(() => {
    if (!activeCentreId) {
      setTeams([]);
      return;
    }
    Promise.all([
      api(`/budget-centres/${activeCentreId}/teams`, { token }),
      api(`/budget-centres/${activeCentreId}/assessment-status`, { token }),
      api(`/budget-centres/${activeCentreId}/bottleneck-summary`, { token }),
      api(`/budget-centres/${activeCentreId}/corrective-actions`, { token })
    ]).then(([teamData, assessmentData, bottleneckData, actionsData]) => {
      setTeams(teamData.teams);
      setAssessmentStatus(assessmentData.teams);
      setBottleneckSummary(bottleneckData);
      setCorrectiveActions(actionsData.correctiveActions);
    });
  }, [activeCentreId, token, refreshKey]);

  const assessmentByTeam = useMemo(() => new Map(assessmentStatus.map((item) => [item.teamId, item])), [assessmentStatus]);

  return (
    <section className="panel full">
      <div className="dashboard-header">
        <div>
          <h2>Budget Centre Dashboard</h2>
          <p>Team-level Top 5 selection status for this SAM 1 cycle.</p>
        </div>
        <select value={activeCentreId} onChange={(event) => setActiveCentreId(event.target.value)}>
          {centres.map((centre) => <option key={centre.id} value={centre.id}>{centre.code} - {centre.name}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Available P/S</th>
              <th>Selected</th>
              <th>Status</th>
              <th>Assessments</th>
              <th>Delivery</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const assessment = assessmentByTeam.get(team.id);
              const delivery = assessment?.deliveryDistribution ?? {};
              return (
                <tr key={team.id}>
                  <td>
                    <strong>{team.name}</strong>
                    <span>{team.biennium || 'Cycle'} - {team.planType || 'Plan'}</span>
                  </td>
                  <td>{team.totalAvailable}</td>
                  <td>{team.selectedCount}/5</td>
                  <td><StatusPill status={team.completionStatus} /></td>
                  <td>
                    <strong>{assessment?.completedAssessments ?? 0}/{assessment?.selectedCount ?? team.selectedCount}</strong>
                    <span>{assessment?.pendingAssessments ?? team.selectedCount} pending - {assessment?.completionPercentage ?? 0}%</span>
                  </td>
                  <td>{Object.entries(delivery).map(([key, value]) => `${key}: ${value}`).join(', ') || 'Not captured'}</td>
                  <td><button className="small-button" onClick={() => onOpenTeam(team.id)}>Open Team Workspace</button></td>
                </tr>
              );
            })}
            {!teams.length && <tr><td colSpan="7" className="muted-cell">No teams found for this Budget Centre.</td></tr>}
          </tbody>
        </table>
      </div>
      {bottleneckSummary && <HeatmapSummary summary={bottleneckSummary} />}
      <CorrectiveActionTable actions={correctiveActions} />
    </section>
  );
}

function ProductFilters({ filters, setFilters, options }) {
  return (
    <div className="filters">
      <label className="search-box">
        <Search size={16} />
        <input value={filters.search} placeholder="Search Products & Services" onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
      </label>
      <select value={filters.output} onChange={(event) => setFilters({ ...filters, output: event.target.value })}>
        <option value="">All GPW14 Outputs</option>
        {options.outputs.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select value={filters.funding} onChange={(event) => setFilters({ ...filters, funding: event.target.value })}>
        <option value="">All Funding Sources</option>
        {options.fundingSources.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <select value={filters.plan} onChange={(event) => setFilters({ ...filters, plan: event.target.value })}>
        <option value="">All Plans / Teams</option>
        {options.plans.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </div>
  );
}

function ProductsTable({ products, selections, onSelect, onRemove, canEdit }) {
  const selectedIds = new Set(selections.map((selection) => selection.productServiceId));
  return (
    <section className="panel table-panel">
      <h2>Available Products & Services</h2>
      <div className="table-wrap tall">
        <table>
          <thead>
            <tr>
              <th>Product / Service</th>
              <th>GPW14 Output</th>
              <th>Plan Name</th>
              <th>Planned Cost</th>
              <th>Amount</th>
              <th>Funding Source</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const selected = selectedIds.has(product.id);
              const selection = selections.find((item) => item.productServiceId === product.id);
              return (
                <tr key={product.id}>
                  <td><strong>{product.productServiceName}</strong></td>
                  <td>{product.resultOutput || 'Unspecified'}</td>
                  <td>{product.planNames?.join(', ') || 'Unspecified'}</td>
                  <td>{money(product.plannedCost)}</td>
                  <td>{money(product.amount)}</td>
                  <td>{product.fundingSources?.join(', ') || 'Unspecified'}</td>
                  <td><StatusPill status={selected ? `Selected #${selection.rank}` : 'Not selected'} /></td>
                  <td>
                    {canEdit ? (
                      <button className={selected ? 'ghost-button' : 'small-button'} onClick={() => selected ? onRemove(selection.id) : onSelect(product.id)}>
                        {selected ? 'Remove' : 'Select'}
                      </button>
                    ) : <span>View only</span>}
                  </td>
                </tr>
              );
            })}
            {!products.length && <tr><td colSpan="8" className="muted-cell">No Products & Services match the current filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SelectionPanel({ selections, onUpdate, onRemove, onComplete, saving, canEdit }) {
  const ranks = [1, 2, 3, 4, 5];
  return (
    <section className="panel selection-panel">
      <div className="panel-title">
        <CheckCircle2 size={20} />
        <h2>Top 5 Selection Panel</h2>
      </div>
      <p className="guide">Select the five Products & Services that best represent delivery performance, strategic importance, risk, or learning value for this SAM 1 period.</p>
      <div className="selection-list">
        {selections.map((selection) => (
          <div className="selection-card" key={selection.id}>
            <div>
              <strong>{selection.productServiceName}</strong>
              <span>{selection.resultOutput || 'No GPW14 Output'}</span>
            </div>
            <select disabled={!canEdit} value={selection.rank} onChange={(event) => onUpdate(selection.id, { rank: Number(event.target.value) })}>
              {ranks.map((rank) => <option key={rank} value={rank}>Rank {rank}</option>)}
            </select>
            <textarea
              value={selection.rationale}
              disabled={!canEdit}
              placeholder="Short rationale required before completion"
              onChange={(event) => onUpdate(selection.id, { rationale: event.target.value })}
            />
            {!selection.rationale?.trim() && <p className="field-error">Rationale is required before completion.</p>}
            {canEdit && <button className="ghost-button" onClick={() => onRemove(selection.id)}>Remove</button>}
          </div>
        ))}
        {!selections.length && <p className="message">No selections yet. Choose up to five from the table.</p>}
      </div>
      {canEdit && (
        <div className="selection-actions">
          <button className="small-button" disabled={saving} onClick={() => onComplete(false)}>Save</button>
          <button className="complete-button" disabled={saving || selections.length !== 5} onClick={() => onComplete(true)}>Mark Selection Complete</button>
        </div>
      )}
    </section>
  );
}

const emptyAssessment = {
  deliveryStatus: '',
  progressPercentage: '',
  plannedDeliverable: '',
  actualDeliverable: '',
  reportingPeriodComment: '',
  evidenceSource: '',
  evidenceReference: '',
  dataConfidence: '',
  dataQualityIssue: false,
  dataQualityIssueDescription: '',
  contributionNarrative: '',
  contributionStrength: '',
  contributionEvidence: '',
  outputRiskFlag: ''
};

function formFromAssessment(assessment) {
  return {
    ...emptyAssessment,
    deliveryStatus: assessment.deliveryStatus ?? '',
    progressPercentage: assessment.progressPercentage ?? '',
    plannedDeliverable: assessment.plannedDeliverable ?? '',
    actualDeliverable: assessment.actualDeliverable ?? '',
    reportingPeriodComment: assessment.reportingPeriodComment ?? '',
    evidenceSource: assessment.evidenceSource ?? '',
    evidenceReference: assessment.evidenceReference ?? '',
    dataConfidence: assessment.dataConfidence ?? '',
    dataQualityIssue: Boolean(assessment.dataQualityIssue),
    dataQualityIssueDescription: assessment.dataQualityIssueDescription ?? '',
    contributionNarrative: assessment.contributionNarrative ?? '',
    contributionStrength: assessment.contributionStrength ?? '',
    contributionEvidence: assessment.contributionEvidence ?? '',
    outputRiskFlag: assessment.outputRiskFlag ?? ''
  };
}

function localWarnings(form) {
  const warnings = [];
  if (form.deliveryStatus === 'Completed' && Number(form.progressPercentage) !== 100) warnings.push('Completed work usually has 100% progress.');
  if (form.deliveryStatus === 'Not started' && Number(form.progressPercentage) !== 0) warnings.push('Not started work usually has 0% progress.');
  if (form.dataConfidence === 'Unavailable') warnings.push('Unavailable data confidence may affect submission quality.');
  return warnings;
}

function TeamAssessmentStatusPanel({ summary, assessments, onContinue }) {
  return (
    <section className="panel assessment-status">
      <div className="panel-title">
        <ClipboardList size={20} />
        <h2>Assessment Status</h2>
      </div>
      <div className="stat-grid compact">
        <Stat label="Selected P/S" value={summary.total} />
        <Stat label="Complete" value={summary.completed} />
        <Stat label="Draft" value={summary.drafts} />
        <Stat label="Not Started" value={summary.notStarted} />
      </div>
      <div className="completion-bar" aria-label="Overall assessment completion">
        <span style={{ width: `${summary.completionPercentage}%` }} />
      </div>
      <div className="selection-actions">
        <strong>{summary.completionPercentage}% complete</strong>
        <button className="small-button" disabled={!assessments.some((item) => item.status !== 'complete')} onClick={onContinue}>Continue Next Incomplete</button>
      </div>
    </section>
  );
}

function AssessmentDashboard({ assessments, summary, onOpen }) {
  return (
    <section className="panel full">
      <div className="dashboard-header">
        <div>
          <h2>Assessment Dashboard</h2>
          <p>Assess each selected Top 5 Product & Service against delivery, evidence, and contribution to GPW14 Output.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Product / Service</th>
              <th>GPW14 Output</th>
              <th>Selection Rationale</th>
              <th>Assessment</th>
              <th>Delivery</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((assessment) => (
              <tr key={assessment.selectionId}>
                <td>#{assessment.rank}</td>
                <td><strong>{assessment.productServiceName}</strong></td>
                <td>{assessment.resultOutput || 'Unspecified'}</td>
                <td>{assessment.selectionRationale || 'No rationale captured'}</td>
                <td><StatusPill status={assessment.statusLabel} /></td>
                <td>{assessment.deliveryStatus || 'Not captured'}</td>
                <td><button className="small-button" onClick={() => onOpen(assessment)}>{assessment.status === 'not_started' ? 'Start' : 'Continue'} Assessment</button></td>
              </tr>
            ))}
            {!summary.total && <tr><td colSpan="7" className="muted-cell">Complete Top 5 selections before assessment.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AssessmentWizard({ assessment, token, canEdit, onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(formFromAssessment(assessment));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const warnings = localWarnings(form);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveDraft() {
    if (!canEdit) return;
    setSaving(true);
    setMessage('');
    try {
      const payload = JSON.stringify(form);
      if (assessment.id) {
        await api(`/assessments/${assessment.id}`, { method: 'PATCH', token, body: payload });
      } else {
        await api(`/selections/${assessment.selectionId}/assessment`, { method: 'POST', token, body: payload });
      }
      setMessage('Draft saved.');
      await onSaved();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function complete() {
    if (!canEdit) return;
    setSaving(true);
    setMessage('');
    try {
      let assessmentId = assessment.id;
      if (!assessmentId) {
        const created = await api(`/selections/${assessment.selectionId}/assessment`, { method: 'POST', token, body: JSON.stringify(form) });
        assessmentId = created.assessment.id;
      } else {
        await api(`/assessments/${assessmentId}`, { method: 'PATCH', token, body: JSON.stringify(form) });
      }
      await api(`/assessments/${assessmentId}/complete`, { method: 'POST', token });
      setMessage('Assessment marked complete.');
      await onSaved();
      onClose();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel wizard-panel">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Step {step} of 4</p>
          <h2>{assessment.productServiceName}</h2>
          <p>Related GPW14 Output: {assessment.resultOutput || 'Unspecified'}</p>
        </div>
        <button className="ghost-button" onClick={onClose}>Close</button>
      </div>

      {warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
      {message && <p className={message.includes('required') || message.includes('between') ? 'error' : 'notice'}>{message}</p>}

      <div className="step-tabs">
        {[1, 2, 3, 4].map((item) => <button className={step === item ? 'active' : ''} key={item} onClick={() => setStep(item)}>{item}</button>)}
      </div>

      {step === 1 && (
        <div className="wizard-grid">
          <label>Delivery status<select value={form.deliveryStatus} onChange={(event) => setField('deliveryStatus', event.target.value)}><option value="">Select status</option>{['Completed', 'On track', 'Delayed', 'Not started', 'At risk'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Progress percentage<input type="number" min="0" max="100" value={form.progressPercentage} onChange={(event) => setField('progressPercentage', event.target.value)} /></label>
          <label>Planned deliverable<textarea value={form.plannedDeliverable} onChange={(event) => setField('plannedDeliverable', event.target.value)} /></label>
          <label>Actual deliverable<textarea value={form.actualDeliverable} onChange={(event) => setField('actualDeliverable', event.target.value)} /></label>
          <label className="wide">Reporting period comment<textarea value={form.reportingPeriodComment} onChange={(event) => setField('reportingPeriodComment', event.target.value)} /></label>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-grid">
          <label>Evidence/source<textarea value={form.evidenceSource} onChange={(event) => setField('evidenceSource', event.target.value)} /></label>
          <label>Evidence link or reference<input value={form.evidenceReference} onChange={(event) => setField('evidenceReference', event.target.value)} /></label>
          <label>Data confidence<select value={form.dataConfidence} onChange={(event) => setField('dataConfidence', event.target.value)}><option value="">Select confidence</option>{['Confirmed', 'Estimated', 'Unavailable'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Data quality issue<select value={form.dataQualityIssue ? 'Yes' : 'No'} onChange={(event) => setField('dataQualityIssue', event.target.value === 'Yes')}><option>No</option><option>Yes</option></select></label>
          {form.dataQualityIssue && <label className="wide">Data quality issue description<textarea value={form.dataQualityIssueDescription} onChange={(event) => setField('dataQualityIssueDescription', event.target.value)} /></label>}
        </div>
      )}

      {step === 3 && (
        <div className="wizard-grid">
          <p className="guide wide">Describe the contribution in terms of delivery, reach, quality, and expected result. Avoid general activity descriptions. Explain how this Product or Service moved the related GPW14 Output forward.</p>
          <label className="wide">Contribution narrative<textarea value={form.contributionNarrative} onChange={(event) => setField('contributionNarrative', event.target.value)} /></label>
          <label>Contribution strength<select value={form.contributionStrength} onChange={(event) => setField('contributionStrength', event.target.value)}><option value="">Select strength</option>{['Strong', 'Moderate', 'Weak', 'Unclear'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Output risk flag<select value={form.outputRiskFlag} onChange={(event) => setField('outputRiskFlag', event.target.value)}><option value="">Select risk</option>{['On track', 'At risk', 'Off track', 'Unknown'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="wide">Evidence of contribution<textarea value={form.contributionEvidence} onChange={(event) => setField('contributionEvidence', event.target.value)} /></label>
        </div>
      )}

      {step === 4 && (
        <div className="review-grid">
          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <span>{key.replace(/([A-Z])/g, ' $1')}</span>
              <strong>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || 'Not captured'}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="selection-actions">
        <button className="ghost-button" disabled={step === 1} onClick={() => setStep((value) => Math.max(value - 1, 1))}>Back</button>
        <button className="ghost-button" disabled={step === 4} onClick={() => setStep((value) => Math.min(value + 1, 4))}>Next</button>
        <button className="small-button" disabled={saving || !canEdit} onClick={saveDraft}>Save Draft</button>
        <button className="complete-button" disabled={saving || !canEdit} onClick={complete}>Mark Assessment Complete</button>
      </div>
    </section>
  );
}

const emptyBottleneck = {
  category: '',
  description: '',
  severity: '',
  rootCause: '',
  consequenceForDelivery: '',
  proposedCorrectiveAction: '',
  responsiblePerson: '',
  targetDeadline: '',
  supportRequired: 'None',
  escalationRequired: false,
  escalationLevel: '',
  evidenceReference: '',
  actionStatus: 'Draft'
};

function formFromBottleneck(bottleneck) {
  return {
    ...emptyBottleneck,
    category: bottleneck?.category ?? '',
    description: bottleneck?.description ?? '',
    severity: bottleneck?.severity ?? '',
    rootCause: bottleneck?.rootCause ?? '',
    consequenceForDelivery: bottleneck?.consequenceForDelivery ?? '',
    proposedCorrectiveAction: bottleneck?.proposedCorrectiveAction ?? '',
    responsiblePerson: bottleneck?.responsiblePerson ?? '',
    targetDeadline: bottleneck?.targetDeadline?.slice?.(0, 10) ?? '',
    supportRequired: bottleneck?.supportRequired ?? 'None',
    escalationRequired: Boolean(bottleneck?.escalationRequired),
    escalationLevel: bottleneck?.escalationLevel ?? '',
    evidenceReference: bottleneck?.evidenceReference ?? '',
    actionStatus: bottleneck?.actionStatus ?? 'Draft'
  };
}

function HeatmapSummary({ summary }) {
  const heatmap = summary?.heatmap ?? {};
  const categoryEntries = Object.entries(heatmap.categories ?? {});
  const severityEntries = Object.entries(heatmap.severities ?? {});
  return (
    <section className="heatmap-block">
      <div className="stat-grid compact">
        <Stat label="Bottlenecks" value={heatmap.count ?? 0} />
        <Stat label="High/Critical" value={heatmap.highCritical ?? 0} />
        <Stat label="Escalations" value={heatmap.escalations ?? 0} />
        <Stat label="Frequent Category" value={heatmap.mostFrequentCategory ?? 'None'} />
      </div>
      <div className="heatmap-grid">
        <div>
          <h3>By Category</h3>
          {categoryEntries.map(([key, value]) => <span className="heat-cell" key={key}>{key}<strong>{value}</strong></span>)}
          {!categoryEntries.length && <p className="message">No bottlenecks recorded.</p>}
        </div>
        <div>
          <h3>By Severity</h3>
          {severityEntries.map(([key, value]) => <span className={`heat-cell severity-${key.toLowerCase()}`} key={key}>{key}<strong>{value}</strong></span>)}
          {!severityEntries.length && <p className="message">No severity data yet.</p>}
        </div>
        <div>
          <h3>Most Affected Outputs</h3>
          {(heatmap.mostAffectedOutputs ?? []).map((item) => <span className="heat-cell" key={item.output}>{item.output}<strong>{item.count}</strong></span>)}
          {!heatmap.mostAffectedOutputs?.length && <p className="message">No affected outputs yet.</p>}
        </div>
      </div>
    </section>
  );
}

function CorrectiveActionTable({ actions }) {
  return (
    <section className="panel nested-table">
      <h2>Corrective Action Pipeline</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product / Service</th>
              <th>Output</th>
              <th>Bottleneck</th>
              <th>Severity</th>
              <th>Action</th>
              <th>Responsible</th>
              <th>Deadline</th>
              <th>Escalation</th>
              <th>Support</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr key={action.id}>
                <td><strong>{action.productServiceName}</strong></td>
                <td>{action.resultOutput || 'Unspecified'}</td>
                <td>{action.description}</td>
                <td><StatusPill status={action.severity} /></td>
                <td>{action.proposedCorrectiveAction}</td>
                <td>{action.responsiblePerson || 'Unassigned'}</td>
                <td>{action.targetDeadline?.slice?.(0, 10) || 'No deadline'}</td>
                <td>{action.escalationRequired ? action.escalationLevel || 'Yes' : 'No'}</td>
                <td>{action.supportRequired}</td>
                <td>{action.actionStatus}</td>
              </tr>
            ))}
            {!actions.length && <tr><td colSpan="10" className="muted-cell">No corrective actions proposed yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MiniBars({ data }) {
  const entries = Object.entries(data ?? {});
  const max = Math.max(...entries.map(([, value]) => value), 1);
  return (
    <div className="mini-bars">
      {entries.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <i style={{ width: `${(value / max) * 100}%` }} />
        </div>
      ))}
      {!entries.length && <p className="message">No data captured yet.</p>}
    </div>
  );
}

function CountryIntelligenceWorkspace({ token }) {
  const [intelligence, setIntelligence] = useState(null);
  const [summary, setSummary] = useState('');
  const [pack, setPack] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [intel, executive] = await Promise.all([
      api('/country/intelligence', { token }),
      api('/country/executive-summary', { token })
    ]);
    setIntelligence(intel);
    setSummary(executive.content);
  }, [token]);

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [load]);

  async function saveSummary() {
    await api('/country/executive-summary', { method: 'POST', token, body: JSON.stringify({ content: summary }) });
    setMessage('Executive summary saved.');
  }

  async function generatePack() {
    const data = await api('/country/review-pack', { token });
    setPack(data);
    setMessage(`Country Review Pack version ${data.version} generated.`);
  }

  if (!intelligence) return <section className="panel empty"><h2>Loading Country Intelligence...</h2></section>;

  return (
    <section className="country-workspace panel full">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Country Intelligence Workspace</p>
          <h2>Country SAM 1 Review Command Centre</h2>
          <p>The PMO can prepare the WR Review from consolidated team submissions.</p>
        </div>
        <button className="complete-button" onClick={generatePack}>Generate Review Pack</button>
      </div>
      {message && <p className="notice">{message}</p>}

      <section className="intelligence-section">
        <h3>Country Readiness</h3>
        <div className="stat-grid compact">
          <Stat label="Teams Participating" value={intelligence.readiness.teamsParticipating} />
          <Stat label="Teams Completed" value={intelligence.readiness.teamsCompleted} />
          <Stat label="Assessed P/S" value={intelligence.readiness.assessedProductsServices} />
          <Stat label="Readiness" value={intelligence.readiness.readinessIndicator} />
        </div>
        <div className="completion-bar"><span style={{ width: `${intelligence.readiness.completionPercentage}%` }} /></div>
      </section>

      <section className="intelligence-grid">
        <div className="panel inner-panel">
          <h3>Delivery Intelligence</h3>
          <MiniBars data={intelligence.delivery.distribution} />
        </div>
        <div className="panel inner-panel">
          <h3>Bottleneck Intelligence</h3>
          <MiniBars data={intelligence.bottleneckIntelligence.byCategory} />
        </div>
        <div className="panel inner-panel">
          <h3>Severity Heatmap</h3>
          <MiniBars data={intelligence.bottleneckIntelligence.bySeverity} />
        </div>
      </section>

      <section className="intelligence-section">
        <h3>GPW14 Output Intelligence</h3>
        <div className="output-card-grid">
          {intelligence.outputIntelligence.slice(0, 8).map((output) => (
            <article className="output-card" key={output.output}>
              <strong>{output.output}</strong>
              <span>{output.contributingProductsServices} contributing P/S</span>
              <span>{output.affectedByBottlenecks} bottlenecks</span>
              <span>{output.strongestEvidence} confirmed evidence items</span>
            </article>
          ))}
        </div>
      </section>

      <section className="intelligence-grid">
        <div className="panel inner-panel">
          <h3>Escalation Candidates</h3>
          <div className="selection-list">
            {intelligence.escalationCandidates.slice(0, 8).map((item) => (
              <article className="selection-card" key={item.id}>
                <strong>{item.productServiceName}</strong>
                <span>{item.reason}</span>
                <span>Suggested destination: {item.suggestedDestination}</span>
              </article>
            ))}
            {!intelligence.escalationCandidates.length && <p className="message">No escalation candidates yet.</p>}
          </div>
        </div>
        <div className="panel inner-panel">
          <h3>Learning Intelligence</h3>
          <div className="selection-list">
            {intelligence.learnings.map((item) => (
              <article className="selection-card" key={item.category}>
                <strong>{item.category}</strong>
                <span>{item.theme}</span>
              </article>
            ))}
            {!intelligence.learnings.length && <p className="message">No learning themes yet.</p>}
          </div>
        </div>
      </section>

      <CorrectiveActionTable actions={intelligence.correctiveActionIntelligence.map((item) => ({
        id: item.id,
        productServiceName: item.productServiceName,
        resultOutput: item.output,
        description: item.action,
        severity: item.priority,
        proposedCorrectiveAction: item.action,
        responsiblePerson: item.responsible,
        targetDeadline: item.deadline,
        escalationRequired: item.group !== 'Country action',
        escalationLevel: item.group,
        supportRequired: item.supportRequired,
        actionStatus: item.status
      }))} />

      <section className="panel inner-panel">
        <h3>Country Executive Summary</h3>
        <textarea className="summary-editor" value={summary} onChange={(event) => setSummary(event.target.value)} />
        <div className="selection-actions">
          <button className="small-button" onClick={saveSummary}>Save Executive Summary</button>
        </div>
      </section>

      {pack && (
        <section className="panel inner-panel">
          <h3>Country Review Pack</h3>
          <p className="message">Version {pack.version}. HTML, PDF, and DOCX payloads are available from the API response.</p>
          <textarea className="summary-editor" readOnly value={pack.formats.html} />
        </section>
      )}
    </section>
  );
}

const blankDecision = {
  issue: '',
  productServiceId: '',
  resultOutput: '',
  decision: '',
  responsiblePerson: '',
  deadline: '',
  escalationRequired: false,
  escalationLevel: '',
  status: 'In progress',
  source: 'Manual entry'
};

function WRReviewMeetingMode({ token, session }) {
  const [meeting, setMeeting] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [outputs, setOutputs] = useState([]);
  const [bottlenecks, setBottlenecks] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [learnings, setLearnings] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [wrAssessment, setWrAssessment] = useState({
    performanceSignal: 'Stable',
    overallAssessment: '',
    mainDeliveryConcern: '',
    mainCorrectiveDecision: '',
    regionalSupportRequired: '',
    wrChairConfirmation: false
  });
  const [decisionDraft, setDecisionDraft] = useState(blankDecision);
  const [activeAgenda, setActiveAgenda] = useState('Delivery performance');
  const [message, setMessage] = useState('');
  const agenda = ['Delivery performance', 'Output contribution', 'Bottlenecks', 'Corrective actions', 'Escalations', 'Learning', 'WR assessment', 'Final decision log', 'Sign-off'];

  const loadMeetingData = useCallback(async (meetingId) => {
    const [deliveryData, outputData, bottleneckData, escalationData, learningData, decisionData] = await Promise.all([
      api(`/wr-review/${meetingId}/delivery`, { token }),
      api(`/wr-review/${meetingId}/outputs`, { token }),
      api(`/wr-review/${meetingId}/bottlenecks`, { token }),
      api(`/wr-review/${meetingId}/escalations`, { token }),
      api(`/wr-review/${meetingId}/learnings`, { token }),
      api(`/wr-review/${meetingId}/decision-log`, { token })
    ]);
    setDelivery(deliveryData);
    setOutputs(outputData.outputs);
    setBottlenecks(bottleneckData);
    setEscalations(escalationData.escalationCandidates);
    setLearnings(learningData.learningThemes);
    setDecisions(decisionData.decisions);
  }, [token]);

  useEffect(() => {
    api('/wr-review/country', { token })
      .then(async (data) => {
        setMeeting(data.meeting);
        if (data.meeting?.id) await loadMeetingData(data.meeting.id);
      })
      .catch((error) => setMessage(error.message));
  }, [token, loadMeetingData]);

  async function startMeeting() {
    try {
      const data = await api('/wr-review/country/start', { method: 'POST', token });
      setMeeting(data.meeting);
      await loadMeetingData(data.meeting.id);
      setMessage('WR Review Meeting Mode started.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addDecision(patch = decisionDraft) {
    if (!meeting) return;
    const data = await api(`/wr-review/${meeting.id}/decision-log`, { method: 'POST', token, body: JSON.stringify(patch) });
    setDecisions((current) => [...current, data.decision]);
    setDecisionDraft(blankDecision);
  }

  async function finalizeDecisions() {
    const data = await api(`/wr-review/${meeting.id}/decision-log/finalize`, { method: 'POST', token });
    setDecisions(data.decisions);
    setMessage('Decision Log finalized.');
  }

  async function saveAssessment() {
    await api(`/wr-review/${meeting.id}/wr-assessment`, { method: 'POST', token, body: JSON.stringify(wrAssessment) });
    setMessage('WR Assessment saved.');
  }

  async function validateLearnings() {
    const data = await api(`/wr-review/${meeting.id}/learnings`, { method: 'POST', token, body: JSON.stringify({ themes: learnings.map((item) => ({ ...item, accepted: true })) }) });
    setLearnings(data.learningThemes);
    setMessage('Learning themes validated.');
  }

  async function signoff() {
    const data = await api(`/wr-review/${meeting.id}/signoff`, { method: 'POST', token });
    setMeeting(data.meeting);
    setMessage('WR sign-off recorded.');
  }

  async function lock() {
    await api(`/wr-review/${meeting.id}/lock`, { method: 'POST', token, body: JSON.stringify({ lockReason: 'WR signed off Country SAM 1 submission' }) });
    const html = await api(`/wr-review/${meeting.id}/submission-package`, { token });
    setMessage(`Submission locked. Package generated (${html.html.length.toLocaleString()} HTML characters).`);
  }

  return (
    <section className="panel full wr-mode">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">WR Review Meeting Mode</p>
          <h2>Country SAM 1 Review</h2>
          <p>SAM 1 cycle - Chair: WHO Representative - PMO/facilitator: {session.user.name}</p>
        </div>
        <div className="meeting-actions">
          <StatusPill status={meeting?.status || 'Not started'} />
          <button className="complete-button" onClick={startMeeting}>{meeting ? 'Restart Meeting Prep' : 'Start Meeting'}</button>
        </div>
      </div>
      {message && <p className={message.includes('Cannot') || message.includes('cannot') ? 'error' : 'notice'}>{message}</p>}
      <div className="review-layout">
        <nav className="agenda-nav">
          {agenda.map((item) => <button className={activeAgenda === item ? 'active' : ''} key={item} onClick={() => setActiveAgenda(item)}>{item}</button>)}
        </nav>
        <div className="review-main">
          <section className="stat-grid compact">
            <Stat label="Performance Signal" value={delivery?.performanceSignal || 'Insufficient evidence'} />
            <Stat label="Assessed P/S" value={delivery?.issues?.length ?? 0} />
            <Stat label="Outputs At Risk" value={outputs.filter((item) => item.risks?.['At risk'] || item.risks?.['Off track']).length} />
            <Stat label="Decisions Required" value={escalations.length} />
          </section>

          {activeAgenda === 'Delivery performance' && (
            <section className="panel inner-panel">
              <h3>Delivery Performance Review</h3>
              <MiniBars data={delivery?.distribution} />
              <div className="selection-list">
                {(delivery?.issues ?? []).map((issue) => (
                  <article className="selection-card" key={issue.id}>
                    <strong>{issue.productServiceName}</strong>
                    <span>{issue.output} - {issue.reason}</span>
                    <button className="small-button" onClick={() => addDecision({ ...blankDecision, issue: issue.reason, productServiceId: issue.productServiceId, resultOutput: issue.output, decision: `Resolve ${issue.category} issue for ${issue.productServiceName}`, escalationRequired: true, escalationLevel: issue.suggestedDestination, source: 'WR decision', sourceEntityType: 'bottleneck', sourceEntityId: issue.id })}>Add to Decision Log</button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeAgenda === 'Output contribution' && (
            <section className="output-card-grid">
              {outputs.map((output) => <article className="output-card" key={output.output}><strong>{output.output}</strong><span>{output.contributingProductsServices} contributing P/S</span><span>Risks: {Object.keys(output.risks ?? {}).join(', ') || 'None'}</span><textarea placeholder="WR comment / PMO note / Regional support required" /></article>)}
            </section>
          )}

          {activeAgenda === 'Bottlenecks' && (
            <section className="panel inner-panel">
              <h3>Bottleneck Review</h3>
              <MiniBars data={bottlenecks?.byCategory} />
              <MiniBars data={bottlenecks?.bySeverity} />
            </section>
          )}

          {activeAgenda === 'Corrective actions' && (
            <CorrectiveActionTable actions={(bottlenecks?.highCritical ?? []).map((item) => ({
              id: item.bottleneck_id,
              productServiceName: item.pe_name,
              resultOutput: item.result_output,
              description: item.description,
              severity: item.severity,
              proposedCorrectiveAction: item.proposed_corrective_action,
              responsiblePerson: item.responsible_person,
              targetDeadline: item.target_deadline,
              escalationRequired: item.escalation_required,
              escalationLevel: item.escalation_level,
              supportRequired: item.support_required,
              actionStatus: item.action_status
            }))} />
          )}

          {activeAgenda === 'Escalations' && (
            <section className="selection-list">
              {escalations.map((item) => <article className="selection-card" key={item.id}><strong>{item.productServiceName}</strong><span>{item.reason}</span><span>Proposed level: {item.suggestedDestination}</span><button className="small-button" onClick={() => addDecision({ ...blankDecision, issue: item.reason, productServiceId: item.productServiceId, resultOutput: item.output, decision: `Confirm escalation to ${item.suggestedDestination}`, escalationRequired: true, escalationLevel: item.suggestedDestination, status: 'Escalated', source: 'Escalation review', sourceEntityType: 'bottleneck', sourceEntityId: item.id })}>Confirm Escalation</button></article>)}
            </section>
          )}

          {activeAgenda === 'Learning' && (
            <section className="panel inner-panel">
              <h3>Learning Review</h3>
              <div className="selection-list">{learnings.map((item, index) => <article className="selection-card" key={`${item.category}-${index}`}><strong>{item.category}</strong><textarea value={item.theme} onChange={(event) => setLearnings((current) => current.map((theme, themeIndex) => themeIndex === index ? { ...theme, theme: event.target.value } : theme))} /><label><input type="checkbox" checked={Boolean(item.regionalSharing)} onChange={(event) => setLearnings((current) => current.map((theme, themeIndex) => themeIndex === index ? { ...theme, regionalSharing: event.target.checked } : theme))} /> Tag for Regional sharing</label></article>)}</div>
              <button className="small-button" onClick={validateLearnings}>Validate Learning Themes</button>
            </section>
          )}

          {activeAgenda === 'WR assessment' && (
            <section className="panel inner-panel wizard-grid">
              <label>Country performance signal<select value={wrAssessment.performanceSignal} onChange={(event) => setWrAssessment({ ...wrAssessment, performanceSignal: event.target.value })}>{['Improving', 'Stable', 'Declining', 'Insufficient evidence'].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="wide">Overall assessment<textarea value={wrAssessment.overallAssessment} onChange={(event) => setWrAssessment({ ...wrAssessment, overallAssessment: event.target.value })} /></label>
              <label>Most important delivery concern<textarea value={wrAssessment.mainDeliveryConcern} onChange={(event) => setWrAssessment({ ...wrAssessment, mainDeliveryConcern: event.target.value })} /></label>
              <label>Most important corrective decision<textarea value={wrAssessment.mainCorrectiveDecision} onChange={(event) => setWrAssessment({ ...wrAssessment, mainCorrectiveDecision: event.target.value })} /></label>
              <label className="wide">Support required from Regional Office<textarea value={wrAssessment.regionalSupportRequired} onChange={(event) => setWrAssessment({ ...wrAssessment, regionalSupportRequired: event.target.value })} /></label>
              <label className="wide"><input type="checkbox" checked={wrAssessment.wrChairConfirmation} onChange={(event) => setWrAssessment({ ...wrAssessment, wrChairConfirmation: event.target.checked })} /> Confirm review was chaired by WR</label>
              <button className="small-button" onClick={saveAssessment}>Save WR Assessment</button>
            </section>
          )}

          {activeAgenda === 'Final decision log' && (
            <section className="panel inner-panel">
              <h3>Final Decision Log</h3>
              <div className="wizard-grid">
                <input placeholder="Issue" value={decisionDraft.issue} onChange={(event) => setDecisionDraft({ ...decisionDraft, issue: event.target.value })} />
                <input placeholder="Related Output" value={decisionDraft.resultOutput} onChange={(event) => setDecisionDraft({ ...decisionDraft, resultOutput: event.target.value })} />
                <textarea className="wide" placeholder="Decision" value={decisionDraft.decision} onChange={(event) => setDecisionDraft({ ...decisionDraft, decision: event.target.value })} />
                <input placeholder="Responsible person" value={decisionDraft.responsiblePerson} onChange={(event) => setDecisionDraft({ ...decisionDraft, responsiblePerson: event.target.value })} />
                <input type="date" value={decisionDraft.deadline} onChange={(event) => setDecisionDraft({ ...decisionDraft, deadline: event.target.value })} />
              </div>
              <div className="selection-actions"><button className="small-button" onClick={() => addDecision()}>Add Decision</button><button className="complete-button" onClick={finalizeDecisions}>Mark Decision Log Final</button></div>
              <div className="selection-list">{decisions.map((decision) => <article className="selection-card" key={decision.id}><strong>{decision.decision || 'Draft decision'}</strong><span>{decision.responsiblePerson || 'No owner'} - {decision.deadline || 'No deadline'}</span><span>{decision.source} / {decision.status}</span></article>)}</div>
            </section>
          )}

          {activeAgenda === 'Sign-off' && (
            <section className="panel inner-panel">
              <h3>Digital Sign-off and Locking</h3>
              <p className="guide">PMO prepares the package, WR signs off, then the system locks the Country SAM 1 submission and records the audit trail.</p>
              <div className="selection-actions"><button className="complete-button" onClick={signoff}>WR Sign Off</button><button className="complete-button" onClick={lock}>Lock Submission and Generate Package</button></div>
              {meeting?.id && <p className="message">Exports: `/api/wr-review/{meeting.id}/export/decision-log.csv`, `/submission.html`, `/submission.pdf`</p>}
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

function RegionalIntelligenceWorkspace({ token }) {
  const [dashboard, setDashboard] = useState(null);
  const [countries, setCountries] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [bottlenecks, setBottlenecks] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [learnings, setLearnings] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [summary, setSummary] = useState('');
  const [briefing, setBriefing] = useState(null);
  const [level, setLevel] = useState('MSC Regional Workspace');
  const [note, setNote] = useState({ audience: 'MSC', title: 'Regional Intelligence Note', content: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api('/regional/dashboard', { token }),
      api('/regional/countries', { token }),
      api('/regional/outputs', { token }),
      api('/regional/bottlenecks', { token }),
      api('/regional/escalations', { token }),
      api('/regional/learnings', { token }),
      api('/regional/decision-tracker', { token }),
      api('/regional/executive-summary', { token }),
      api('/regional/mec-briefing', { token })
    ]).then(([dash, countryData, outputData, bottleneckData, escalationData, learningData, decisionData, summaryData, briefingData]) => {
      setDashboard(dash);
      setCountries(countryData.countries);
      setOutputs(outputData.outputs);
      setBottlenecks(bottleneckData);
      setEscalations(escalationData.escalations);
      setLearnings(learningData.learningThemes);
      setDecisions(decisionData.decisions);
      setSummary(summaryData.content);
      setBriefing(briefingData);
    }).catch((error) => setMessage(error.message));
  }, [token]);

  async function saveNote() {
    await api('/regional/intelligence-note', { method: 'POST', token, body: JSON.stringify(note) });
    setMessage('Regional Intelligence Note saved.');
  }

  if (!dashboard) return <section className="panel empty"><h2>Loading Regional Intelligence...</h2></section>;

  const levels = ['Cluster Director Workspace', 'MSC Regional Workspace', 'DPM Executive Cockpit', 'MEC Briefing Workspace'];
  return (
    <section className="panel full regional-room">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Regional Performance Intelligence Engine</p>
          <h2>Executive Situation Room</h2>
          <p>Where are we, where are the risks, and where should Regional support be deployed?</p>
        </div>
        <StatusPill status={dashboard.executiveSignal} />
      </div>
      {message && <p className="notice">{message}</p>}
      <div className="step-tabs wide-tabs">
        {levels.map((item) => <button className={level === item ? 'active text-tab' : 'text-tab'} key={item} onClick={() => setLevel(item)}>{item}</button>)}
      </div>

      <div className="stat-grid compact">
        <Stat label="Countries Submitted" value={dashboard.submissions.countriesSubmitted} />
        <Stat label="Countries Pending" value={dashboard.submissions.countriesPending} />
        <Stat label="Delivery Acceleration" value={`${dashboard.kpis.deliveryAccelerationIndex}%`} />
        <Stat label="Risk Score" value={dashboard.kpis.countryRiskScore} />
      </div>

      {level === 'Cluster Director Workspace' && (
        <section className="intelligence-grid">
          <div className="panel inner-panel"><h3>Country Portfolio</h3><MiniBars data={Object.fromEntries(countries.map((item) => [item.code, item.assessments]))} /></div>
          <div className="panel inner-panel"><h3>Escalation Queue</h3><div className="selection-list">{escalations.slice(0, 6).map((item) => <article className="selection-card" key={item.id}><strong>{item.countryCode} - {item.productServiceName}</strong><span>{item.severity} {item.category} / {item.escalationLevel}</span></article>)}</div></div>
          <div className="panel inner-panel"><h3>Technical Support Tracker</h3><MiniBars data={dashboard.bottleneckHeatmap} /></div>
        </section>
      )}

      {level === 'MSC Regional Workspace' && (
        <>
          <section className="intelligence-grid">
            <div className="panel inner-panel"><h3>Submission Control Tower</h3><MiniBars data={{ Submitted: dashboard.submissions.countriesSubmitted, Pending: dashboard.submissions.countriesPending, Locked: dashboard.submissions.lockedSubmissions }} /></div>
            <div className="panel inner-panel"><h3>Delivery Heatmap</h3><MiniBars data={dashboard.deliveryHeatmap} /></div>
            <div className="panel inner-panel"><h3>Quality Checks</h3><MiniBars data={{ 'Weak evidence': dashboard.kpis.outputRiskIndex, 'Missing deadlines': decisions.filter((item) => !item.dueDate).length, 'Overdue decisions': decisions.filter((item) => item.overdue).length }} /></div>
          </section>
          <section className="panel inner-panel"><h3>Regional Intelligence Note</h3><input value={note.title} onChange={(event) => setNote({ ...note, title: event.target.value })} /><textarea className="summary-editor" value={note.content} onChange={(event) => setNote({ ...note, content: event.target.value })} /><button className="small-button" onClick={saveNote}>Save Note</button></section>
        </>
      )}

      {level === 'DPM Executive Cockpit' && (
        <>
          <section className="intelligence-grid">
            <div className="panel inner-panel"><h3>Regional KPI Indexes</h3><MiniBars data={dashboard.kpis} /></div>
            <div className="panel inner-panel"><h3>Outputs Most At Risk</h3><div className="selection-list">{outputs.slice(0, 8).map((item) => <article className="selection-card" key={item.output}><strong>{item.output}</strong><span>{item.riskCount} risk signals across {item.countries.length} country/countries</span></article>)}</div></div>
            <div className="panel inner-panel"><h3>Countries Requiring Attention</h3><div className="selection-list">{countries.filter((item) => item.bottlenecks > 0 || item.decisions > 0).slice(0, 8).map((item) => <article className="selection-card" key={item.code}><strong>{item.code} - {item.name}</strong><span>{item.bottlenecks} bottlenecks / {item.decisions} decisions</span></article>)}</div></div>
          </section>
          <CorrectiveActionTable actions={decisions.map((item) => ({ id: item.id, productServiceName: item.countryCode, resultOutput: item.output, description: item.issue, severity: item.escalationRequired ? 'High' : 'Medium', proposedCorrectiveAction: item.issue, responsiblePerson: item.responsibleRole, targetDeadline: item.dueDate, escalationRequired: item.escalationRequired, escalationLevel: item.escalationRequired ? 'Regional' : '', supportRequired: item.responsibleRole, actionStatus: item.status }))} />
        </>
      )}

      {level === 'MEC Briefing Workspace' && (
        <section className="panel inner-panel">
          <h3>MEC Briefing Workspace</h3>
          <textarea className="summary-editor" readOnly value={briefing?.executiveSummary || summary} />
          <div className="intelligence-grid">
            <div className="panel inner-panel"><h3>Priority Decisions</h3><div className="selection-list">{briefing?.priorityDecisions?.map((item) => <article className="selection-card" key={item.id}><strong>{item.issue}</strong><span>{item.countryCode} / {item.status}</span></article>)}</div></div>
            <div className="panel inner-panel"><h3>Learning Highlights</h3><div className="selection-list">{briefing?.learningHighlights?.map((item) => <article className="selection-card" key={item.category}><strong>{item.category}</strong><span>{item.count} theme(s)</span></article>)}</div></div>
            <div className="panel inner-panel"><h3>Exports</h3><p className="message">PowerPoint, PDF, and Word export payloads are available from `/api/regional/mec-briefing` for rendering by document services.</p></div>
          </div>
        </section>
      )}

      <section className="panel inner-panel">
        <h3>Methodology</h3>
        <div className="review-grid">
          {Object.entries(dashboard.methodologies).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}
        </div>
      </section>
    </section>
  );
}

function IntegrationManagementConsole({ token, session }) {
  const [connectors, setConnectors] = useState([]);
  const [active, setActive] = useState('spm');
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');
  const isAdmin = session.user.role === 'admin';

  const load = useCallback(async () => {
    const data = await api('/integrations/connectors', { token });
    setConnectors(data.connectors);
    if (active) {
      const err = await api(`/integrations/${active}/errors`, { token });
      setErrors(err.errors);
    }
  }, [token, active]);

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [load]);

  async function testConnector(id) {
    try {
      const result = await api(`/integrations/${id}/test`, { method: 'POST', token });
      setMessage(`${id.toUpperCase()} test connection: ${result.ok ? 'ok' : 'failed'}`);
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function syncConnector(id) {
    try {
      const result = await api(`/integrations/${id}/sync`, { method: 'POST', token, body: JSON.stringify({ reportingPeriod: 'MVP' }) });
      setMessage(`${id.toUpperCase()} sync ${result.status}: ${result.synced} records synced.`);
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function uploadSharePoint() {
    try {
      const result = await api('/integrations/sharepoint/upload', {
        method: 'POST',
        token,
        body: JSON.stringify({ documentType: 'regional_note', filename: 'sam1-regional-note.html', contentType: 'text/html' })
      });
      setMessage(`Mock SharePoint upload complete: ${result.url}`);
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="panel full integration-console">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Integration Management Console</p>
          <h2>SPM, GSM, HR, WHO SSO, SharePoint, and Power BI Connectors</h2>
          <p>Mock connector mode. Excel upload remains the active SPM fallback for MVP.</p>
        </div>
        <StatusPill status={isAdmin ? 'Admin controls enabled' : 'View only'} />
      </div>
      {message && <p className={message.includes('Only MSC Admin') ? 'error' : 'notice'}>{message}</p>}
      <div className="connector-grid">
        {connectors.map((connector) => (
          <button className={active === connector.connectorId ? 'connector-card active' : 'connector-card'} key={connector.connectorId} onClick={() => setActive(connector.connectorId)}>
            <strong>{connector.connectorName}</strong>
            <span>{connector.status} / {connector.environment}</span>
            <span>Last sync: {connector.lastSyncStatus || 'never'}</span>
            <small>{connector.enabled ? 'Enabled' : 'Disabled'} - {connector.authType}</small>
          </button>
        ))}
      </div>
      <div className="panel inner-panel">
        <h3>{active.toUpperCase()} Controls</h3>
        <div className="selection-actions">
          <button className="small-button" disabled={!isAdmin} onClick={() => testConnector(active)}>Test Connection</button>
          {['spm', 'gsm', 'hr'].includes(active) && <button className="complete-button" disabled={!isAdmin} onClick={() => syncConnector(active)}>Run Sync</button>}
          {active === 'sharepoint' && <button className="complete-button" disabled={!isAdmin} onClick={uploadSharePoint}>Mock Upload</button>}
        </div>
        <p className="guide">Data source priority, fallback rules, and masked configuration are returned by `/api/integrations/connectors`.</p>
      </div>
      <section className="intelligence-grid">
        <div className="panel inner-panel">
          <h3>Sync Errors</h3>
          <div className="selection-list">
            {errors.map((error) => <article className="selection-card" key={error.id}><strong>{error.error_category}</strong><span>{error.user_message}</span></article>)}
            {!errors.length && <p className="message">No errors logged for this connector.</p>}
          </div>
        </div>
        <div className="panel inner-panel">
          <h3>Power BI Data Feeds</h3>
          <div className="selection-list">
            {['country-intelligence', 'regional-intelligence', 'decision-tracker', 'bottlenecks', 'outputs'].map((dataset) => <article className="selection-card" key={dataset}><strong>{dataset}</strong><span>/api/powerbi/datasets/{dataset}</span></article>)}
          </div>
        </div>
        <div className="panel inner-panel">
          <h3>SSO Providers</h3>
          <div className="selection-list">
            <article className="selection-card"><strong>Mock seeded login</strong><span>Active MVP provider</span></article>
            <article className="selection-card"><strong>WHO SSO placeholder</strong><span>OIDC/SAML-compatible future provider</span></article>
          </div>
        </div>
      </section>
    </section>
  );
}

function CopilotOutput({ result, onEdit }) {
  if (!result) return <p className="message">Generate a draft or ask a question to see AI-assisted intelligence here.</p>;
  return (
    <section className="panel inner-panel ai-output">
      <div className="dashboard-header">
        <div>
          <h3>{result.generatedOutput?.output_type || 'AI output'}</h3>
          <p>Prompt {result.auditLog?.prompt_template_key} v{result.auditLog?.prompt_version} - {result.output?.provider}</p>
        </div>
        <StatusPill status="AI-generated draft" />
      </div>
      <textarea className="summary-editor" value={result.generatedOutput?.user_edits ?? result.output?.content ?? ''} onChange={(event) => onEdit(result.generatedOutput.id, event.target.value)} />
      <h3>Citations</h3>
      <div className="selection-list">
        {(result.output?.citations ?? []).map((item, index) => <article className="selection-card" key={`${item.entityType}-${index}`}><strong>{item.entityType}</strong><span>{item.label}</span><span>{item.fields?.join(', ')}</span></article>)}
      </div>
    </section>
  );
}

function PerformanceIntelligenceCopilot({ token }) {
  const [question, setQuestion] = useState('Which outputs are most at risk?');
  const [audience, setAudience] = useState('WR');
  const [result, setResult] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [message, setMessage] = useState('');

  const loadMeta = useCallback(async () => {
    const [audit, promptData] = await Promise.all([
      api('/ai/audit-logs', { token }),
      api('/ai/prompts', { token })
    ]);
    setAuditLogs(audit.auditLogs);
    setPrompts(promptData.prompts);
  }, [token]);

  useEffect(() => {
    loadMeta().catch((error) => setMessage(error.message));
  }, [loadMeta]);

  async function run(path, body = {}) {
    try {
      const data = await api(path, { method: 'POST', token, body: JSON.stringify(body) });
      setResult(data);
      setMessage('AI-generated draft created. Please review and validate before use.');
      await loadMeta();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function editOutput(id, content) {
    setResult((current) => ({
      ...current,
      generatedOutput: { ...current.generatedOutput, user_edits: content }
    }));
    await api(`/ai/outputs/${id}`, { method: 'PATCH', token, body: JSON.stringify({ userEdits: content, status: 'edited' }) });
  }

  return (
    <section className="panel full copilot-console">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Performance Intelligence Copilot</p>
          <h2>AI-assisted management intelligence</h2>
          <p>Explain, suggest, and cite evidence. Never auto-approve.</p>
        </div>
        <StatusPill status="Human validation required" />
      </div>
      {message && <p className="notice">{message}</p>}
      <div className="intelligence-grid">
        <section className="panel inner-panel">
          <h3>Ask Performance Intelligence</h3>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
          <div className="selection-actions">
            <button className="small-button" onClick={() => run('/ai/chat', { question })}>Ask</button>
            <button className="small-button" onClick={() => run('/ai/regional-patterns')}>Highlight Regional Risks</button>
          </div>
        </section>
        <section className="panel inner-panel">
          <h3>Generate Briefing</h3>
          <select value={audience} onChange={(event) => setAudience(event.target.value)}>
            {['WR', 'Cluster Director', 'MSC', 'DPM', 'MEC'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="selection-actions">
            <button className="small-button" onClick={() => run(`/ai/briefings/${encodeURIComponent(audience)}`)}>Generate Draft</button>
            <button className="small-button" onClick={() => run('/ai/learnings/synthesize')}>Synthesize Learning</button>
          </div>
        </section>
        <section className="panel inner-panel">
          <h3>Decision Advisor</h3>
          <button className="small-button" onClick={() => run('/ai/decision-recommendation', { issue: question, evidence: [{ entityType: 'user_question', label: question, fields: ['question'] }] })}>Suggest Decision</button>
          <p className="guide">Recommendations remain editable and are never automatically adopted.</p>
        </section>
      </div>
      <CopilotOutput result={result} onEdit={editOutput} />
      <section className="intelligence-grid">
        <div className="panel inner-panel">
          <h3>Prompt Library</h3>
          <div className="selection-list">{prompts.map((prompt) => <article className="selection-card" key={`${prompt.template_key}-${prompt.version}`}><strong>{prompt.title}</strong><span>{prompt.template_key} v{prompt.version}</span></article>)}</div>
        </div>
        <div className="panel inner-panel">
          <h3>AI Audit Log</h3>
          <div className="selection-list">{auditLogs.slice(0, 8).map((log) => <article className="selection-card" key={log.id}><strong>{log.service_name}</strong><span>{log.prompt_template_key} v{log.prompt_version}</span><span>{new Date(log.created_at).toLocaleString()}</span></article>)}</div>
        </div>
      </section>
    </section>
  );
}

function PilotEnablementCentre({ token, session }) {
  const [command, setCommand] = useState(null);
  const [goLive, setGoLive] = useState({ readinessScore: 0, checklist: [] });
  const [flags, setFlags] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [help, setHelp] = useState([]);
  const [training, setTraining] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [message, setMessage] = useState('');
  const isAdmin = session.user.role === 'admin';

  const load = useCallback(async () => {
    const [cmd, live, flagData, workspaceData, notificationData, helpData, trainingData, onboardingData] = await Promise.all([
      api('/pilot/command-centre', { token }),
      api('/go-live', { token }),
      api('/feature-flags', { token }),
      api('/pilot/workspaces', { token }),
      api('/notifications', { token }),
      api('/help/search?q=SAM', { token }),
      api('/training/resources', { token }),
      api('/onboarding', { token })
    ]);
    setCommand(cmd);
    setGoLive(live);
    setFlags(flagData.flags);
    setWorkspaces(workspaceData.workspaces);
    setNotificationsList(notificationData.notifications);
    setHelp(helpData.articles);
    setTraining(trainingData.resources);
    setOnboarding(onboardingData);
  }, [token]);

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [load]);

  async function seedPilots() {
    try {
      await api('/pilot/workspaces/seed', { method: 'POST', token });
      setMessage('Pilot workspaces configured for Zambia, Sierra Leone, and Chad.');
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitFeedback() {
    await api('/feedback', { method: 'POST', token, body: JSON.stringify({ feedbackType: 'Suggestion', priority: 'Medium', currentScreen: 'Pilot Enablement', browser: navigator.userAgent, message: feedbackMessage }) });
    setFeedbackMessage('');
    setMessage('Feedback submitted.');
  }

  async function runSimulation() {
    try {
      const result = await api('/pilot/simulation/run', { method: 'POST', token });
      setMessage(`Pilot simulation ${result.status}: ${result.steps.length} checkpoints completed.`);
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function runSecurity() {
    await api('/security/checklist/run', { method: 'POST', token });
    setMessage('Security checklist executed.');
  }

  if (!command) return <section className="panel empty"><h2>Loading Pilot Enablement...</h2></section>;

  return (
    <section className="panel full pilot-centre">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Pilot Enablement Centre</p>
          <h2>Product Readiness and Pilot Governance</h2>
          <p>Operational readiness for PMOs, WRs, Team Leads, Cluster Directors, and MSC.</p>
        </div>
        <StatusPill status={command.pilotStatus} />
      </div>
      {message && <p className={message.includes('Only MSC Admin') ? 'error' : 'notice'}>{message}</p>}
      <div className="stat-grid compact">
        <Stat label="Countries Onboarded" value={command.countriesOnboarded} />
        <Stat label="Go-Live Readiness" value={`${goLive.readinessScore}%`} />
        <Stat label="Open Issues" value={command.openIssues} />
        <Stat label="AI Usage" value={command.aiUsage} />
      </div>

      <section className="intelligence-grid">
        <div className="panel inner-panel">
          <h3>Pilot Administration</h3>
          <button className="small-button" disabled={!isAdmin} onClick={seedPilots}>Configure Initial Pilots</button>
          <div className="selection-list">{workspaces.map((item) => <article className="selection-card" key={item.id}><strong>{item.country_name}</strong><span>{item.country_code} / {item.status} / {item.language_preference}</span></article>)}</div>
        </div>
        <div className="panel inner-panel">
          <h3>Guided First-Time Experience</h3>
          <div className="selection-list">{(onboarding?.steps ?? []).map((step) => <article className="selection-card" key={step}><strong>{step}</strong><span>{session.user.role.replace('_', ' ')}</span></article>)}</div>
        </div>
        <div className="panel inner-panel">
          <h3>Feature Flags</h3>
          <div className="selection-list">{flags.map((flag) => <article className="selection-card" key={flag.flag_key}><strong>{flag.label}</strong><span>{flag.enabled ? 'Enabled' : 'Disabled'}</span></article>)}</div>
        </div>
      </section>

      <section className="intelligence-grid">
        <div className="panel inner-panel">
          <h3>Help Centre</h3>
          <div className="selection-list">{help.map((item) => <article className="selection-card" key={item.id}><strong>{item.title}</strong><span>{item.category}</span></article>)}</div>
        </div>
        <div className="panel inner-panel">
          <h3>Training Library</h3>
          <div className="selection-list">{training.map((item) => <article className="selection-card" key={item.id}><strong>{item.title}</strong><span>{item.resource_type} / {item.role}</span></article>)}</div>
        </div>
        <div className="panel inner-panel">
          <h3>Notification Centre</h3>
          <div className="selection-list">{notificationsList.map((item) => <article className="selection-card" key={item.id}><strong>{item.title}</strong><span>{item.status}</span></article>)}</div>
          {!notificationsList.length && <p className="message">No notifications yet.</p>}
        </div>
      </section>

      <section className="panel inner-panel">
        <h3>Go-Live Readiness Checklist</h3>
        <div className="completion-bar"><span style={{ width: `${goLive.readinessScore}%` }} /></div>
        <div className="review-grid">{goLive.checklist.map((item) => <div key={item.item_key}><span>{item.label}</span><strong>{item.completed ? 'Complete' : 'Pending'}</strong></div>)}</div>
      </section>

      <section className="intelligence-grid">
        <div className="panel inner-panel">
          <h3>Feedback Centre</h3>
          <textarea value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} placeholder="Bug, suggestion, question, training request, or general feedback" />
          <button className="small-button" onClick={submitFeedback}>Submit Feedback</button>
        </div>
        <div className="panel inner-panel">
          <h3>Performance and Security</h3>
          <button className="small-button" disabled={!isAdmin} onClick={() => api('/performance-tests/run', { method: 'POST', token }).then(() => setMessage('Performance tests recorded.')).catch((error) => setMessage(error.message))}>Run Performance Tests</button>
          <button className="small-button" disabled={!isAdmin} onClick={runSecurity}>Run Security Checklist</button>
        </div>
        <div className="panel inner-panel">
          <h3>Pilot Simulation</h3>
          <button className="complete-button" disabled={!isAdmin} onClick={runSimulation}>Run End-to-End Simulation</button>
          <button className="small-button" disabled={!isAdmin} onClick={() => api('/releases', { method: 'POST', token, body: JSON.stringify({ releaseNumber: '1.0', buildNumber: 'pilot-release', releaseApproval: 'Ready for deployment' }) }).then(() => setMessage('Release 1.0 recorded.')).catch((error) => setMessage(error.message))}>Declare Release 1.0 Ready</button>
        </div>
      </section>
    </section>
  );
}

function BottleneckDashboard({ summary, onOpen }) {
  return (
    <section className="panel full">
      <div className="dashboard-header">
        <div>
          <h2>Bottleneck Dashboard</h2>
          <p>What is blocking delivery? What decision or support is needed to unblock progress?</p>
        </div>
      </div>
      <HeatmapSummary summary={summary} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product / Service</th>
              <th>GPW14 Output</th>
              <th>Delivery</th>
              <th>Progress</th>
              <th>Output Risk</th>
              <th>Bottlenecks</th>
              <th>Highest Severity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(summary.assessedProducts ?? []).map((item) => (
              <tr key={item.assessmentId} className={item.highestSeverity === 'Critical' ? 'critical-row' : ''}>
                <td><strong>{item.productServiceName}</strong>{item.warnings?.map((warning) => <span className="inline-warning" key={warning}>{warning}</span>)}</td>
                <td>{item.resultOutput || 'Unspecified'}</td>
                <td>{item.deliveryStatus || 'Not captured'}</td>
                <td>{item.progressPercentage ?? 0}%</td>
                <td>{item.outputRiskFlag || 'Unknown'}</td>
                <td>{item.bottleneckCount} - {item.bottleneckStatus}</td>
                <td><StatusPill status={item.highestSeverity} /></td>
                <td><button className="small-button" onClick={() => onOpen(item)}>Add / Edit Bottlenecks</button></td>
              </tr>
            ))}
            {!summary.assessedProducts?.length && <tr><td colSpan="8" className="muted-cell">Complete assessments before bottleneck diagnosis.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BottleneckForm({ assessment, bottlenecks, token, canEdit, onClose, onSaved }) {
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(emptyBottleneck);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function startNew() {
    setActive(null);
    setForm(emptyBottleneck);
    setMessage('');
  }

  function edit(item) {
    setActive(item);
    setForm(formFromBottleneck(item));
    setMessage('');
  }

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(complete = false) {
    if (!canEdit) return;
    setSaving(true);
    setMessage('');
    try {
      let id = active?.id;
      if (id) {
        await api(`/bottlenecks/${id}`, { method: 'PATCH', token, body: JSON.stringify(form) });
      } else {
        const created = await api(`/assessments/${assessment.assessmentId}/bottlenecks`, { method: 'POST', token, body: JSON.stringify(form) });
        id = created.bottleneck.id;
      }
      if (complete) await api(`/bottlenecks/${id}/complete`, { method: 'POST', token });
      setMessage(complete ? 'Bottleneck completed.' : 'Draft bottleneck saved.');
      await onSaved();
      startNew();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setSaving(true);
    setMessage('');
    try {
      await api(`/bottlenecks/${id}`, { method: 'DELETE', token });
      await onSaved();
      startNew();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel wizard-panel">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Bottleneck Diagnosis</p>
          <h2>{assessment.productServiceName}</h2>
          <p>{assessment.deliveryStatus || 'Delivery not captured'} - {assessment.progressPercentage ?? 0}% progress - Output risk: {assessment.outputRiskFlag || 'Unknown'}</p>
        </div>
        <button className="ghost-button" onClick={onClose}>Close</button>
      </div>
      {message && <p className={message.includes('Complete these') || message.includes('must') ? 'error' : 'notice'}>{message}</p>}
      <div className="split-panel">
        <div className="selection-list">
          <button className="small-button" onClick={startNew}>Add Bottleneck</button>
          {bottlenecks.map((item) => (
            <button className={`bottleneck-item severity-${item.severity?.toLowerCase()}`} key={item.id} onClick={() => edit(item)}>
              <strong>{item.category} - {item.severity}</strong>
              <span>{item.description}</span>
              <small>{item.status} / {item.actionStatus}</small>
            </button>
          ))}
          {!bottlenecks.length && <p className="message">No bottlenecks yet. Add one diagnosis at a time.</p>}
        </div>
        <div className="wizard-grid">
          <p className="guide wide">What is the root cause, not just the symptom? Should this be handled at country level, or escalated?</p>
          <label>Bottleneck category<select value={form.category} onChange={(event) => setField('category', event.target.value)}><option value="">Select category</option>{['Financial', 'Human Resources', 'Procurement', 'Contextual', 'Partner / Government', 'Data quality', 'Operational planning', 'Security', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Severity<select value={form.severity} onChange={(event) => setField('severity', event.target.value)}><option value="">Select severity</option>{['Low', 'Medium', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="wide">Bottleneck description<textarea value={form.description} onChange={(event) => setField('description', event.target.value)} /></label>
          <label>Root cause<textarea value={form.rootCause} onChange={(event) => setField('rootCause', event.target.value)} /></label>
          <label>Consequence for delivery<textarea value={form.consequenceForDelivery} onChange={(event) => setField('consequenceForDelivery', event.target.value)} /></label>
          <label className="wide">Proposed corrective action<textarea value={form.proposedCorrectiveAction} onChange={(event) => setField('proposedCorrectiveAction', event.target.value)} /></label>
          <label>Responsible person or role<input value={form.responsiblePerson} onChange={(event) => setField('responsiblePerson', event.target.value)} /></label>
          <label>Target deadline<input type="date" value={form.targetDeadline} onChange={(event) => setField('targetDeadline', event.target.value)} /></label>
          <label>Support required<select value={form.supportRequired} onChange={(event) => setField('supportRequired', event.target.value)}>{['None', 'Country Office leadership', 'Cluster', 'Regional Office technical team', 'MSC', 'DPM', 'External partner'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Escalation required<select value={form.escalationRequired ? 'Yes' : 'No'} onChange={(event) => setField('escalationRequired', event.target.value === 'Yes')}><option>No</option><option>Yes</option></select></label>
          {form.escalationRequired && <label>Escalation level<select value={form.escalationLevel} onChange={(event) => setField('escalationLevel', event.target.value)}><option value="">Select level</option>{['WR', 'Cluster Director', 'Regional Office', 'DPM', 'MEC'].map((item) => <option key={item}>{item}</option>)}</select></label>}
          <label>Action status<select value={form.actionStatus} onChange={(event) => setField('actionStatus', event.target.value)}>{['Draft', 'Proposed', 'Accepted', 'In progress', 'Completed', 'Escalated'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="wide">Evidence or reference<input value={form.evidenceReference} onChange={(event) => setField('evidenceReference', event.target.value)} /></label>
        </div>
      </div>
      <div className="selection-actions">
        {active && <button className="ghost-button" disabled={saving || !canEdit} onClick={() => remove(active.id)}>Delete Draft</button>}
        <button className="small-button" disabled={saving || !canEdit} onClick={() => save(false)}>Save Draft</button>
        <button className="complete-button" disabled={saving || !canEdit} onClick={() => save(true)}>Mark Bottleneck Complete</button>
      </div>
    </section>
  );
}

function TeamWorkspace({ token, session, teamId, onBack, onChanged }) {
  const [team, setTeam] = useState(null);
  const [products, setProducts] = useState([]);
  const [selections, setSelections] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assessmentSummary, setAssessmentSummary] = useState({ total: 0, completed: 0, drafts: 0, notStarted: 0, completionPercentage: 0 });
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [bottleneckSummary, setBottleneckSummary] = useState({ heatmap: {}, assessedProducts: [], bottlenecks: [], correctiveActions: [] });
  const [activeBottleneckAssessment, setActiveBottleneckAssessment] = useState(null);
  const [filters, setFilters] = useState({ search: '', output: '', funding: '', plan: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const canEdit = ['admin', 'pmo', 'team_lead'].includes(session.user.role);

  const load = useCallback(async () => {
    const [teamData, productsData, selectionsData, assessmentsData, bottleneckData] = await Promise.all([
      api(`/teams/${teamId}`, { token }),
      api(`/teams/${teamId}/products-services`, { token }),
      api(`/teams/${teamId}/selections`, { token }),
      api(`/teams/${teamId}/assessments`, { token }),
      api(`/teams/${teamId}/bottleneck-summary`, { token })
    ]);
    setTeam(teamData.team);
    setProducts(productsData.productsServices);
    setSelections(selectionsData.selections);
    setAssessments(assessmentsData.assessments);
    setAssessmentSummary(assessmentsData.summary);
    setBottleneckSummary(bottleneckData);
  }, [teamId, token]);

  useEffect(() => {
    if (teamId) load().catch((error) => setMessage(error.message));
  }, [teamId, load]);

  const options = useMemo(() => ({
    outputs: [...new Set(products.map((item) => item.resultOutput).filter(Boolean))],
    fundingSources: [...new Set(products.flatMap((item) => item.fundingSources ?? []).filter(Boolean))],
    plans: [...new Set(products.flatMap((item) => item.planNames ?? []).filter(Boolean))]
  }), [products]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const haystack = `${product.productServiceName} ${product.resultOutput} ${product.planNames?.join(' ')}`.toLowerCase();
    return (!filters.search || haystack.includes(filters.search.toLowerCase())) &&
      (!filters.output || product.resultOutput === filters.output) &&
      (!filters.funding || product.fundingSources?.includes(filters.funding)) &&
      (!filters.plan || product.planNames?.includes(filters.plan));
  }), [products, filters]);

  async function selectProduct(productServiceId) {
    setMessage('');
    try {
      await api(`/teams/${teamId}/selections`, { method: 'POST', token, body: JSON.stringify({ productServiceId }) });
      await load();
      onChanged();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateSelection(selectionId, patch) {
    setSaving(true);
    setMessage('');
    try {
      await api(`/teams/${teamId}/selections/${selectionId}`, { method: 'PATCH', token, body: JSON.stringify(patch) });
      await load();
      onChanged();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeSelection(selectionId) {
    setMessage('');
    try {
      await api(`/teams/${teamId}/selections/${selectionId}`, { method: 'DELETE', token });
      await load();
      onChanged();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveOrComplete(complete) {
    setSaving(true);
    setMessage('');
    try {
      if (complete) {
        await api(`/teams/${teamId}/selections/complete`, { method: 'POST', token });
        setMessage('Selection marked complete.');
      } else {
        setMessage('Draft selections saved.');
      }
      await load();
      onChanged();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (!team) return <section className="panel empty"><h2>Loading Team Workspace...</h2></section>;

  return (
    <section className="team-space">
      <div className="team-header">
        <button className="ghost-button" onClick={onBack}>Back to Dashboard</button>
        <div>
          <p className="eyebrow">{team.budgetCentreCode} - {team.budgetCentreName}</p>
          <h1>{team.name}</h1>
          <p>{team.biennium || 'SAM 1 cycle'} - {session.user.role.replace('_', ' ')}</p>
        </div>
      </div>
      {message && <p className={message.includes('required') || message.includes('maximum') || message.includes('unique') || message.includes('already') ? 'error' : 'message notice'}>{message}</p>}
      <div className="stat-grid summary-row">
        <Stat label="Approved P/S Available" value={team.totalAvailable} />
        <Stat label="Selected P/S" value={`${selections.length}/5`} />
        <Stat label="Remaining" value={Math.max(5 - selections.length, 0)} />
        <Stat label="Completion Status" value={team.completionStatus} />
      </div>
      <ProductFilters filters={filters} setFilters={setFilters} options={options} />
      <div className="workspace-grid">
        <ProductsTable products={filteredProducts} selections={selections} onSelect={selectProduct} onRemove={removeSelection} canEdit={canEdit} />
        <SelectionPanel selections={selections} onUpdate={updateSelection} onRemove={removeSelection} onComplete={saveOrComplete} saving={saving} canEdit={canEdit} />
      </div>
      <TeamAssessmentStatusPanel
        summary={assessmentSummary}
        assessments={assessments}
        onContinue={() => setActiveAssessment(assessments.find((item) => item.status !== 'complete'))}
      />
      <AssessmentDashboard assessments={assessments} summary={assessmentSummary} onOpen={setActiveAssessment} />
      {activeAssessment && (
        <AssessmentWizard
          assessment={activeAssessment}
          token={token}
          canEdit={canEdit}
          onClose={() => setActiveAssessment(null)}
          onSaved={async () => {
            await load();
            onChanged();
          }}
        />
      )}
      <BottleneckDashboard summary={bottleneckSummary} onOpen={setActiveBottleneckAssessment} />
      <CorrectiveActionTable actions={bottleneckSummary.correctiveActions ?? []} />
      {activeBottleneckAssessment && (
        <BottleneckForm
          assessment={activeBottleneckAssessment}
          bottlenecks={(bottleneckSummary.bottlenecks ?? []).filter((item) => item.assessmentId === activeBottleneckAssessment.assessmentId)}
          token={token}
          canEdit={canEdit}
          onClose={() => setActiveBottleneckAssessment(null)}
          onSaved={async () => {
            await load();
            onChanged();
          }}
        />
      )}
    </section>
  );
}

function App() {
  const [users, setUsers] = useState([]);
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeTeamId, setActiveTeamId] = useState('');
  const [showCountryWorkspace, setShowCountryWorkspace] = useState(false);
  const [showWrReview, setShowWrReview] = useState(false);
  const [showRegionalWorkspace, setShowRegionalWorkspace] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showPilot, setShowPilot] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const canUpload = useMemo(() => ['admin', 'pmo'].includes(session?.user?.role), [session]);

  useEffect(() => {
    api('/users').then((data) => setUsers(data.users)).catch((err) => setError(err.message));
  }, []);

  async function login(userId) {
    setError('');
    setActiveTeamId('');
    setShowCountryWorkspace(false);
    setShowWrReview(false);
    setShowRegionalWorkspace(false);
    setShowIntegrations(false);
    setShowCopilot(false);
    setShowPilot(false);
    const data = await api('/auth/mock-login', { method: 'POST', body: JSON.stringify({ userId }) });
    setSession(data);
    const latest = await api('/imports/latest', { token: data.token });
    setSummary(latest.import);
  }

  async function refresh() {
    if (!session) return;
    const latest = await api('/imports/latest', { token: session.token });
    setSummary(latest.import);
    setRefreshKey((value) => value + 1);
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">SAM 1 Platform - Pilot Release 1.0</p>
          <h1>Digital Performance Intelligence</h1>
        </div>
        {session && <div className="badge">{session.user.name}</div>}
      </header>

      {error && <p className="error">{error}</p>}
      <UserPicker users={users} activeUser={session?.user} onLogin={login} />

      {session && !activeTeamId && (
        <>
          <div className="workspace">
            <UploadPanel canUpload={canUpload} token={session.token} onImported={setSummary} />
            <ImportSummary summary={summary} onRefresh={refresh} />
          </div>
          {['admin', 'pmo', 'wr'].includes(session.user.role) && (
            <div className="country-launch">
              <button className="complete-button" onClick={() => setShowCountryWorkspace((value) => !value)}>
                {showCountryWorkspace ? 'Hide Country Intelligence Workspace' : 'Open Country Intelligence Workspace'}
              </button>
              <button className="complete-button" onClick={() => setShowWrReview((value) => !value)}>
                {showWrReview ? 'Hide WR Review Meeting Mode' : 'Open WR Review Meeting Mode'}
              </button>
              <button className="complete-button" onClick={() => setShowRegionalWorkspace((value) => !value)}>
                {showRegionalWorkspace ? 'Hide Regional Intelligence' : 'Open Regional Intelligence'}
              </button>
              <button className="complete-button" onClick={() => setShowIntegrations((value) => !value)}>
                {showIntegrations ? 'Hide Integrations' : 'Open Integrations'}
              </button>
              <button className="complete-button" onClick={() => setShowCopilot((value) => !value)}>
                {showCopilot ? 'Hide Copilot' : 'Open Copilot'}
              </button>
              <button className="complete-button" onClick={() => setShowPilot((value) => !value)}>
                {showPilot ? 'Hide Pilot Centre' : 'Open Pilot Centre'}
              </button>
            </div>
          )}
          {showCountryWorkspace && <CountryIntelligenceWorkspace token={session.token} />}
          {showWrReview && <WRReviewMeetingMode token={session.token} session={session} />}
          {showRegionalWorkspace && <RegionalIntelligenceWorkspace token={session.token} />}
          {showIntegrations && <IntegrationManagementConsole token={session.token} session={session} />}
          {showCopilot && <PerformanceIntelligenceCopilot token={session.token} />}
          {showPilot && <PilotEnablementCentre token={session.token} session={session} />}
          <BudgetCentreDashboard token={session.token} session={session} onOpenTeam={setActiveTeamId} refreshKey={refreshKey} />
        </>
      )}

      {session && activeTeamId && (
        <TeamWorkspace
          token={session.token}
          session={session}
          teamId={activeTeamId}
          onBack={() => setActiveTeamId('')}
          onChanged={() => setRefreshKey((value) => value + 1)}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
