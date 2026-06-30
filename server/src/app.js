import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import { pool } from './db.js';
import { requireAuth, requireImporter, requireSelectionEditor, signUser } from './lib/auth.js';
import { importSummary, persistImport } from './lib/importRepository.js';
import { parseSpmWorkbook } from './lib/importParser.js';
import {
  completeSelections,
  createSelection,
  deleteSelection,
  getTeam,
  listBudgetCentres,
  listProductsForTeam,
  listSelectionsForTeam,
  listTeamsForBudgetCentre,
  updateSelection
} from './lib/selectionRepository.js';
import {
  budgetCentreAssessmentStatus,
  completeAssessment,
  getSelectionAssessment,
  listTeamAssessments,
  saveSelectionAssessment,
  summarizeAssessments,
  updateAssessment
} from './lib/assessmentRepository.js';
import {
  budgetCentreBottleneckSummary,
  budgetCentreCorrectiveActions,
  completeBottleneck,
  createBottleneck,
  deleteBottleneck,
  listAssessmentBottlenecks,
  teamBottleneckSummary,
  updateBottleneck
} from './lib/bottleneckRepository.js';
import {
  countryBottlenecks,
  countryDelivery,
  countryEscalations,
  countryIntelligence,
  countryLearnings,
  countryOutputIntelligence,
  countryReviewPack,
  getExecutiveSummary,
  saveExecutiveSummary
} from './lib/countryRepository.js';
import {
  bottleneckReview,
  createDecision,
  decisionCsv,
  deleteDecision,
  deliveryReview,
  escalationReview,
  finalizeDecisionLog,
  getOrCreateMeeting,
  learningReview,
  listDecisions,
  lockSubmission,
  outputReview,
  saveWrAssessment,
  signOff,
  startMeeting,
  submissionPackage,
  updateDecision,
  updateMeetingStatus,
  validateLearningThemes
} from './lib/wrReviewRepository.js';
import {
  createRegionalIntelligenceNote,
  regionalBottlenecks,
  regionalCountries,
  regionalDashboard,
  regionalDecisionTracker,
  regionalEscalations,
  regionalExecutiveSummary,
  regionalLearnings,
  regionalMecBriefing,
  regionalOutputs
} from './lib/regionalRepository.js';
import {
  authProviders,
  budgetCentreFinance,
  budgetCentreWorkforce,
  connectorErrors,
  connectorStatus,
  documentLink,
  lastSync,
  listConnectors,
  powerBiDataset,
  requireConnectorAdmin,
  runConnectorSync,
  sharePointUpload,
  testConnector
} from './lib/connectors.js';
import {
  analyzeBottlenecks,
  answerQuestion,
  detectRegionalPatterns,
  generateAssessmentNarrative,
  generateExecutiveBriefing,
  listAiAuditLogs,
  promptTemplates,
  recommendDecision,
  synthesizeLearning,
  updateGeneratedOutput
} from './lib/aiRepository.js';
import {
  createNotification,
  createRelease,
  ensurePilotCountries,
  featureFlags,
  goLiveDashboard,
  helpSearch,
  listFeedback,
  listPilotWorkspaces,
  markTrainingComplete,
  notifications,
  onboardingForUser,
  performanceTests,
  pilotCommandCentre,
  pilotEvaluation,
  runPilotSimulation,
  runSecurityChecklist,
  saveOnboarding,
  submitFeedback,
  trackAnalytics,
  trainingResources,
  updateFeatureFlag,
  updateGoLiveItem,
  updateNotification,
  updatePilotWorkspace
} from './lib/pilotRepository.js';

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024 }
});

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/users', async (_req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT id, name, role, centre_code FROM users ORDER BY name');
      res.json({ users: rows });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/pilot/workspaces', requireAuth, async (_req, res, next) => {
    try {
      res.json({ workspaces: await listPilotWorkspaces() });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/pilot/workspaces/seed', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json({ workspaces: await ensurePilotCountries(req.user) });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/pilot/workspaces/:id/:action', requireAuth, async (req, res, next) => {
    try {
      res.json({ workspace: await updatePilotWorkspace(req.params.id, req.params.action, req.user) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/onboarding', requireAuth, async (req, res, next) => {
    try {
      res.json(await onboardingForUser(req.user));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/onboarding', requireAuth, async (req, res, next) => {
    try {
      res.json({ progress: await saveOnboarding(req.user, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/help/search', requireAuth, async (req, res, next) => {
    try {
      res.json({ articles: await helpSearch(req.query.q ?? '') });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/training/resources', requireAuth, async (req, res, next) => {
    try {
      res.json({ resources: await trainingResources(req.user.role) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/training/resources/:id/complete', requireAuth, async (req, res, next) => {
    try {
      res.json({ completion: await markTrainingComplete(req.user, req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/analytics/events', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json({ event: await trackAnalytics(req.user, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/feedback', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json({ feedback: await submitFeedback(req.user, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/admin/feedback', requireAuth, async (req, res, next) => {
    try {
      res.json({ feedback: await listFeedback(req.user) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/feature-flags', requireAuth, async (_req, res, next) => {
    try {
      res.json({ flags: await featureFlags() });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/feature-flags/:key', requireAuth, async (req, res, next) => {
    try {
      res.json({ flag: await updateFeatureFlag(req.params.key, req.body.enabled, req.user) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/notifications', requireAuth, async (req, res, next) => {
    try {
      res.json({ notifications: await notifications(req.user, req.query) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/notifications', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json({ notification: await createNotification(req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/notifications/:id', requireAuth, async (req, res, next) => {
    try {
      res.json({ notification: await updateNotification(req.params.id, req.body.status) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/pilot/command-centre', requireAuth, async (_req, res, next) => {
    try {
      res.json(await pilotCommandCentre());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/go-live', requireAuth, async (_req, res, next) => {
    try {
      res.json(await goLiveDashboard());
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/go-live/:key', requireAuth, async (req, res, next) => {
    try {
      res.json({ item: await updateGoLiveItem(req.params.key, req.body, req.user) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/security/checklist/run', requireAuth, async (req, res, next) => {
    try {
      res.json({ checks: await runSecurityChecklist(req.user) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/performance-tests/run', requireAuth, async (req, res, next) => {
    try {
      res.json({ results: await performanceTests(req.user) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/pilot/evaluation', requireAuth, async (_req, res, next) => {
    try {
      res.status(201).json({ evaluation: await pilotEvaluation() });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/releases', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json({ release: await createRelease(req.user, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/pilot/simulation/run', requireAuth, async (req, res, next) => {
    try {
      res.json(await runPilotSimulation(req.user));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/auth/providers', async (_req, res, next) => {
    try {
      res.json(await authProviders());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/ai/prompts', requireAuth, async (_req, res, next) => {
    try {
      res.json({ prompts: await promptTemplates() });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/ai/audit-logs', requireAuth, async (_req, res, next) => {
    try {
      res.json({ auditLogs: await listAiAuditLogs() });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/ai/assessments/:assessmentId/narrative', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json(await generateAssessmentNarrative(req.params.assessmentId, req.user));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/ai/assessments/:assessmentId/bottlenecks/analyze', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json(await analyzeBottlenecks(req.params.assessmentId, req.user));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/ai/decision-recommendation', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json(await recommendDecision(req.body, req.user));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/ai/learnings/synthesize', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json(await synthesizeLearning(req.user));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/ai/briefings/:audience', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json(await generateExecutiveBriefing(req.params.audience, req.user));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/ai/regional-patterns', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json(await detectRegionalPatterns(req.user));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/ai/chat', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json(await answerQuestion(req.body.question, req.user));
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/ai/outputs/:id', requireAuth, async (req, res, next) => {
    try {
      res.json({ output: await updateGeneratedOutput(req.params.id, req.body, req.user.sub) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/sso/callback-placeholder', async (_req, res) => {
    res.status(202).json({ message: 'WHO SSO callback placeholder accepted. Mock login remains active for MVP.' });
  });

  app.post('/api/auth/mock-login', async (req, res, next) => {
    try {
      const { userId } = req.body;
      const { rows } = await pool.query('SELECT id, name, role, centre_code FROM users WHERE id = $1', [userId]);
      if (!rows.length) return res.status(404).json({ error: 'User not found.' });
      const user = rows[0];
      return res.json({ token: signUser(user), user });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/integrations/connectors', requireAuth, async (_req, res, next) => {
    try {
      res.json({ connectors: await listConnectors() });
    } catch (error) {
      next(error);
    }
  });

  for (const connectorId of ['spm', 'gsm', 'hr', 'sso', 'sharepoint', 'powerbi']) {
    app.post(`/api/integrations/${connectorId}/test`, requireAuth, async (req, res, next) => {
      try {
        requireConnectorAdmin(req);
        res.json(await testConnector(connectorId));
      } catch (error) {
        next(error);
      }
    });

    app.get(`/api/integrations/${connectorId}/status`, requireAuth, async (_req, res, next) => {
      try {
        res.json({ connector: await connectorStatus(connectorId) });
      } catch (error) {
        next(error);
      }
    });

    app.get(`/api/integrations/${connectorId}/errors`, requireAuth, async (_req, res, next) => {
      try {
        res.json({ errors: await connectorErrors(connectorId) });
      } catch (error) {
        next(error);
      }
    });
  }

  app.post('/api/integrations/spm/sync', requireAuth, async (req, res, next) => {
    try {
      requireConnectorAdmin(req);
      res.json(await runConnectorSync('spm', req.body, req.user.sub));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/integrations/spm/last-sync', requireAuth, async (_req, res, next) => {
    try {
      res.json({ sync: await lastSync('spm') });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/integrations/gsm/sync', requireAuth, async (req, res, next) => {
    try {
      requireConnectorAdmin(req);
      res.json(await runConnectorSync('gsm', req.body, req.user.sub));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/integrations/gsm/budget-centre/:id', requireAuth, async (req, res, next) => {
    try {
      res.json({ financialSnapshots: await budgetCentreFinance(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/integrations/hr/sync', requireAuth, async (req, res, next) => {
    try {
      requireConnectorAdmin(req);
      res.json(await runConnectorSync('hr', req.body, req.user.sub));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/integrations/hr/budget-centre/:id', requireAuth, async (req, res, next) => {
    try {
      res.json({ workforceSnapshots: await budgetCentreWorkforce(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/integrations/sharepoint/upload', requireAuth, async (req, res, next) => {
    try {
      requireConnectorAdmin(req);
      res.status(201).json(await sharePointUpload(req.body, req.user.sub));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/documents/:id/link', requireAuth, async (req, res, next) => {
    try {
      res.json({ document: await documentLink(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  for (const dataset of ['country-intelligence', 'regional-intelligence', 'decision-tracker', 'bottlenecks', 'outputs']) {
    app.get(`/api/powerbi/datasets/${dataset}`, requireAuth, async (_req, res, next) => {
      try {
        res.json(await powerBiDataset(dataset));
      } catch (error) {
        next(error);
      }
    });
  }

  app.get('/api/imports/latest', requireAuth, async (_req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT * FROM spm_imports ORDER BY created_at DESC LIMIT 1');
      res.json({ import: importSummary(rows[0]) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/country/intelligence', requireAuth, async (_req, res, next) => {
    try {
      res.json(await countryIntelligence());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/dashboard', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalDashboard());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/countries', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalCountries());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/outputs', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalOutputs());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/bottlenecks', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalBottlenecks());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/escalations', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalEscalations());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/learnings', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalLearnings());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/decision-tracker', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalDecisionTracker());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/executive-summary', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalExecutiveSummary());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/regional/mec-briefing', requireAuth, async (_req, res, next) => {
    try {
      res.json(await regionalMecBriefing());
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/regional/intelligence-note', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.status(201).json({ note: await createRegionalIntelligenceNote(req.body, req.user.sub) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/country/delivery', requireAuth, async (_req, res, next) => {
    try {
      res.json(await countryDelivery());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/country/output-intelligence', requireAuth, async (_req, res, next) => {
    try {
      res.json(await countryOutputIntelligence());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/country/bottlenecks', requireAuth, async (_req, res, next) => {
    try {
      res.json(await countryBottlenecks());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/country/escalations', requireAuth, async (_req, res, next) => {
    try {
      res.json(await countryEscalations());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/country/learnings', requireAuth, async (_req, res, next) => {
    try {
      res.json(await countryLearnings());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/country/review-pack', requireAuth, async (req, res, next) => {
    try {
      res.json(await countryReviewPack(req.user.sub));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/country/executive-summary', requireAuth, async (_req, res, next) => {
    try {
      res.json({ content: await getExecutiveSummary() });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/country/executive-summary', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.status(201).json({ executiveSummary: await saveExecutiveSummary(req.body.content ?? '', req.user.sub) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:budgetCentreId', requireAuth, async (req, res, next) => {
    try {
      res.json({ meeting: await getOrCreateMeeting(req.params.budgetCentreId === 'country' ? null : req.params.budgetCentreId) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/wr-review/:budgetCentreId/start', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.status(201).json({ meeting: await startMeeting(req.params.budgetCentreId === 'country' ? null : req.params.budgetCentreId, req.user.sub) });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/wr-review/:meetingId/status', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ meeting: await updateMeetingStatus(req.params.meetingId, req.body.status) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/delivery', requireAuth, async (req, res, next) => {
    try {
      res.json(await deliveryReview(req.params.meetingId));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/outputs', requireAuth, async (req, res, next) => {
    try {
      res.json(await outputReview(req.params.meetingId));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/bottlenecks', requireAuth, async (req, res, next) => {
    try {
      res.json(await bottleneckReview(req.params.meetingId));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/escalations', requireAuth, async (req, res, next) => {
    try {
      res.json(await escalationReview(req.params.meetingId));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/learnings', requireAuth, async (req, res, next) => {
    try {
      res.json(await learningReview(req.params.meetingId));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/wr-review/:meetingId/learnings', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json(await validateLearningThemes(req.params.meetingId, req.body.themes ?? []));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/wr-review/:meetingId/wr-assessment', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.status(201).json({ wrAssessment: await saveWrAssessment(req.params.meetingId, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/wr-review/:meetingId/wr-assessment', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ wrAssessment: await saveWrAssessment(req.params.meetingId, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/decision-log', requireAuth, async (req, res, next) => {
    try {
      res.json({ decisions: await listDecisions(req.params.meetingId) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/wr-review/:meetingId/decision-log', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.status(201).json({ decision: await createDecision(req.params.meetingId, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/wr-review/:meetingId/decision-log/:decisionId', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ decision: await updateDecision(req.params.meetingId, req.params.decisionId, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/wr-review/:meetingId/decision-log/:decisionId', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      await deleteDecision(req.params.meetingId, req.params.decisionId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/wr-review/:meetingId/decision-log/finalize', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ decisions: await finalizeDecisionLog(req.params.meetingId) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/wr-review/:meetingId/signoff', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ meeting: await signOff(req.params.meetingId, req.user.sub) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/wr-review/:meetingId/lock', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ lock: await lockSubmission(req.params.meetingId, req.user.sub, req.body.lockReason) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/submission-package', requireAuth, async (req, res, next) => {
    try {
      res.json(await submissionPackage(req.params.meetingId, req.user.sub));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/export/decision-log.csv', requireAuth, async (req, res, next) => {
    try {
      res.type('text/csv').send(await decisionCsv(req.params.meetingId));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/export/submission.html', requireAuth, async (req, res, next) => {
    try {
      res.type('html').send((await submissionPackage(req.params.meetingId, req.user.sub)).html);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/wr-review/:meetingId/export/submission.pdf', requireAuth, async (req, res, next) => {
    try {
      res.type('html').send((await submissionPackage(req.params.meetingId, req.user.sub)).pdf);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/budget-centres', requireAuth, async (_req, res, next) => {
    try {
      res.json({ budgetCentres: await listBudgetCentres() });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/budget-centres/:id/teams', requireAuth, async (req, res, next) => {
    try {
      res.json({ teams: await listTeamsForBudgetCentre(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/budget-centres/:budgetCentreId/assessment-status', requireAuth, async (req, res, next) => {
    try {
      res.json({ teams: await budgetCentreAssessmentStatus(req.params.budgetCentreId) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/budget-centres/:budgetCentreId/bottleneck-summary', requireAuth, async (req, res, next) => {
    try {
      res.json(await budgetCentreBottleneckSummary(req.params.budgetCentreId));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/budget-centres/:budgetCentreId/corrective-actions', requireAuth, async (req, res, next) => {
    try {
      res.json({ correctiveActions: await budgetCentreCorrectiveActions(req.params.budgetCentreId) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teams/:id', requireAuth, async (req, res, next) => {
    try {
      const team = await getTeam(req.params.id);
      if (!team) return res.status(404).json({ error: 'Team not found.' });
      return res.json({ team });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/teams/:id/products-services', requireAuth, async (req, res, next) => {
    try {
      res.json({ productsServices: await listProductsForTeam(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teams/:id/selections', requireAuth, async (req, res, next) => {
    try {
      res.json({ selections: await listSelectionsForTeam(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teams/:teamId/assessments', requireAuth, async (req, res, next) => {
    try {
      const assessments = await listTeamAssessments(req.params.teamId);
      res.json({ assessments, summary: summarizeAssessments(assessments) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teams/:teamId/bottleneck-summary', requireAuth, async (req, res, next) => {
    try {
      res.json(await teamBottleneckSummary(req.params.teamId));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/assessments/:assessmentId/bottlenecks', requireAuth, async (req, res, next) => {
    try {
      res.json({ bottlenecks: await listAssessmentBottlenecks(req.params.assessmentId) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/assessments/:assessmentId/bottlenecks', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      const bottleneck = await createBottleneck(req.params.assessmentId, req.body, req.user.sub);
      res.status(201).json({ bottleneck });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/bottlenecks/:bottleneckId', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ bottleneck: await updateBottleneck(req.params.bottleneckId, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/bottlenecks/:bottleneckId', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      await deleteBottleneck(req.params.bottleneckId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/bottlenecks/:bottleneckId/complete', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ bottleneck: await completeBottleneck(req.params.bottleneckId, req.user.sub) });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/selections/:selectionId/assessment', requireAuth, async (req, res, next) => {
    try {
      res.json({ assessment: await getSelectionAssessment(req.params.selectionId) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/selections/:selectionId/assessment', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      const assessment = await saveSelectionAssessment(req.params.selectionId, req.body, req.user.sub);
      res.status(201).json({ assessment });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/assessments/:assessmentId', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ assessment: await updateAssessment(req.params.assessmentId, req.body) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/assessments/:assessmentId/complete', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      res.json({ assessment: await completeAssessment(req.params.assessmentId, req.user.sub) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/teams/:id/selections', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      const selection = await createSelection(req.params.id, req.body, req.user.sub);
      res.status(201).json({ selection });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/teams/:id/selections/:selectionId', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      const selection = await updateSelection(req.params.id, req.params.selectionId, req.body);
      res.json({ selection });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/teams/:id/selections/:selectionId', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      await deleteSelection(req.params.id, req.params.selectionId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/teams/:id/selections/complete', requireAuth, requireSelectionEditor, async (req, res, next) => {
    try {
      const selections = await completeSelections(req.params.id);
      res.json({ selections });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/imports', requireAuth, requireImporter, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Upload an .xlsx SPM extract.' });
      const parsed = parseSpmWorkbook(req.file.buffer, req.file.originalname);
      const saved = await persistImport(parsed, req.user.sub);
      return res.status(201).json({ import: importSummary(saved) });
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    const status = error.status || (error.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
    res.status(status).json({ error: error.message || 'Unexpected server error.' });
  });

  return app;
}
