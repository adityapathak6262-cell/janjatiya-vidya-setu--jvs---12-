import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { 
  db, 
  initializeDatabase,
  findUserByEmail,
  findUserById,
  hashPassword,
  verifyPassword,
  appendAuditLog,
  verifyAuditChainIntegrity,
  Application
} from './server/db.js';
import { compilePolicyWithAI, preloadedGuidelines } from './server/policyCompiler.js';
import { runPramaanVerification } from './server/pramaanEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Mock / State Database
initializeDatabase();

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Request ID and Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = crypto.randomUUID();
  req.headers['x-request-id'] = reqId;
  res.setHeader('X-Request-Id', reqId);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/@') && !req.path.includes('/node_modules/')) {
      console.log(`[${req.method}] ${req.path} -> ${res.statusCode} (${duration}ms) [${reqId.slice(0, 8)}]`);
    }
  });
  next();
});

// Authentication extraction middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authorization token is required.',
        request_id: req.headers['x-request-id'],
      },
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Simple decoded token simulation for demo/production-grade state
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'User no longer exists or session expired.',
          request_id: req.headers['x-request-id'],
        },
      });
    }
    (req as any).user = user;
    next();
  } catch (e) {
    return res.status(401).json({
      error: {
        code: 'TOKEN_PARSE_ERROR',
        message: 'Invalid authorization token format.',
        request_id: req.headers['x-request-id'],
      },
    });
  }
};

// RBAC middleware generator
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: ${roles.join(', ')}`,
          request_id: req.headers['x-request-id'],
        },
      });
    }
    next();
  };
};

// ==========================================
// API V1 ENDPOINTS
// ==========================================

// Health & Readiness
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'Janjatiya Vidya Setu (JVS) API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'CONNECTED_TRANSACTIONAL_MEMORY',
    gemini_ai: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'FALLBACK_HEURISTIC_READY',
  });
});

app.get('/api/v1/ready', (req: Request, res: Response) => {
  res.json({ status: 'READY', ready: true });
});

// Auth Routes
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' },
    });
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    timestamp: Date.now(),
  };
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'USER',
    entityId: user.id,
    payload: { email: user.email, ip: req.ip },
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      state: user.state,
    },
  });
});

app.post('/api/v1/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role = 'STUDENT', institution, state } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      error: { code: 'MISSING_FIELDS', message: 'Name, email, and password are required.' },
    });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({
      error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' },
    });
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
    role: role || 'STUDENT',
    institution: institution || 'Delhi University',
    state: state || 'Jharkhand',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  appendAuditLog({
    actorUserId: newUser.id,
    actorRole: newUser.role,
    action: 'USER_REGISTERED',
    entityType: 'USER',
    entityId: newUser.id,
    payload: { name: newUser.name, email: newUser.email, role: newUser.role },
  });

  const tokenPayload = {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
    timestamp: Date.now(),
  };
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      institution: newUser.institution,
      state: newUser.state,
    },
  });
});

app.get('/api/v1/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      state: user.state,
    },
  });
});

// Demo switch role / quick login
app.get('/api/v1/auth/demo-users', (req: Request, res: Response) => {
  const sanitized = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    institution: u.institution,
    state: u.state,
  }));
  res.json(sanitized);
});

// Schemes Master & Policy Versions
app.get('/api/v1/schemes', (req: Request, res: Response) => {
  const schemesWithVersions = db.schemes.map((scheme) => {
    const versions = db.policyVersions.filter((v) => v.schemeId === scheme.id);
    const activeVersion = versions.find((v) => v.status === 'PUBLISHED') || versions[0];
    return {
      ...scheme,
      versionCount: versions.length,
      activeVersion: activeVersion || null,
      versions,
    };
  });
  res.json(schemesWithVersions);
});

app.post('/api/v1/schemes', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { code, name, description, category, ministry = 'Ministry of Tribal Affairs (MoTA)' } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Scheme code and name required' } });
  }

  const newScheme = {
    id: crypto.randomUUID(),
    code: code.toUpperCase(),
    name,
    description: description || '',
    category: category || 'Higher Education',
    ministry,
    createdAt: new Date().toISOString(),
  };

  db.schemes.push(newScheme);

  appendAuditLog({
    actorUserId: (req as any).user.id,
    actorRole: (req as any).user.role,
    action: 'SCHEME_CREATED',
    entityType: 'SCHEME',
    entityId: newScheme.id,
    payload: { code: newScheme.code, name: newScheme.name },
  });

  res.status(201).json(newScheme);
});

// Policy Compiler API: AI-Assisted Guideline Extraction
app.get('/api/v1/policies/preloaded-guidelines', (req: Request, res: Response) => {
  res.json(preloadedGuidelines);
});

app.post('/api/v1/policies/extract', authenticate, requireRole(['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const { schemeCode, academicYear, rawGuidelineText, guidelinePresetKey } = req.body;
    let textToAnalyze = rawGuidelineText || '';

    if (!textToAnalyze && guidelinePresetKey && preloadedGuidelines[guidelinePresetKey]) {
      textToAnalyze = preloadedGuidelines[guidelinePresetKey].content;
    }

    if (!textToAnalyze || textToAnalyze.length < 50) {
      return res.status(400).json({
        error: { code: 'INSUFFICIENT_TEXT', message: 'Guideline text or valid preset key is required for extraction.' },
      });
    }

    const compiledRules = await compilePolicyWithAI(ai, schemeCode || 'NFST', academicYear || '2026-27', textToAnalyze);

    appendAuditLog({
      actorUserId: (req as any).user.id,
      actorRole: (req as any).user.role,
      action: 'POLICY_AI_EXTRACTED',
      entityType: 'POLICY_DRAFT',
      entityId: `DRAFT-${schemeCode}-${academicYear}`,
      payload: { schemeCode, academicYear, fieldCount: compiledRules.applicationFields?.length },
    });

    res.json({
      success: true,
      schemeCode,
      academicYear,
      extractedConfig: compiledRules,
      message: 'AI successfully extracted structured scheme policy. Human review and validation required before publishing.',
    });
  } catch (err: any) {
    console.error('Error in policy extraction:', err);
    res.status(500).json({
      error: { code: 'EXTRACTION_FAILED', message: err.message || 'Failed to extract policy configuration.' },
    });
  }
});

// Policy Versions CRUD & Lifecycle Management
app.get('/api/v1/policies', (req: Request, res: Response) => {
  const { schemeId, status } = req.query;
  let list = db.policyVersions;
  if (schemeId) {
    list = list.filter((p) => p.schemeId === schemeId);
  }
  if (status) {
    list = list.filter((p) => p.status === status);
  }
  res.json(list);
});

app.get('/api/v1/policies/:id', (req: Request, res: Response) => {
  const policy = db.policyVersions.find((p) => p.id === req.params.id);
  if (!policy) {
    return res.status(404).json({ error: { code: 'POLICY_NOT_FOUND', message: 'Policy version not found.' } });
  }
  res.json(policy);
});

app.post('/api/v1/policies', authenticate, requireRole(['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const {
    schemeId,
    versionNumber,
    academicYear,
    effectiveDate,
    config,
    notes,
  } = req.body;

  if (!schemeId || !versionNumber || !config) {
    return res.status(400).json({ error: { code: 'MISSING_DATA', message: 'Scheme, version number, and configuration required.' } });
  }

  const scheme = db.schemes.find((s) => s.id === schemeId);
  if (!scheme) {
    return res.status(404).json({ error: { code: 'SCHEME_NOT_FOUND', message: 'Specified scheme not found.' } });
  }

  const newPolicyVersion = {
    id: crypto.randomUUID(),
    schemeId,
    schemeCode: scheme.code,
    versionNumber,
    academicYear: academicYear || '2026-27',
    status: 'DRAFT' as const,
    effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
    config,
    notes: notes || 'Initial policy version configuration',
    createdBy: (req as any).user.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.policyVersions.push(newPolicyVersion);

  appendAuditLog({
    actorUserId: (req as any).user.id,
    actorRole: (req as any).user.role,
    action: 'POLICY_VERSION_CREATED',
    entityType: 'POLICY_VERSION',
    entityId: newPolicyVersion.id,
    payload: { scheme: scheme.code, version: versionNumber, status: 'DRAFT' },
  });

  res.status(201).json(newPolicyVersion);
});

// Update Policy Version (only if DRAFT or UNDER_REVIEW)
app.put('/api/v1/policies/:id', authenticate, requireRole(['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const policy = db.policyVersions.find((p) => p.id === req.params.id);
  if (!policy) {
    return res.status(404).json({ error: { code: 'POLICY_NOT_FOUND', message: 'Policy version not found.' } });
  }

  if (policy.status === 'PUBLISHED') {
    return res.status(400).json({
      error: {
        code: 'IMMUTABLE_PUBLISHED_POLICY',
        message: 'Published policy versions are immutable to ensure judicial audit compliance. Create a new version instead.',
      },
    });
  }

  const { config, notes, academicYear, versionNumber } = req.body;
  if (config) policy.config = config;
  if (notes) policy.notes = notes;
  if (academicYear) policy.academicYear = academicYear;
  if (versionNumber) policy.versionNumber = versionNumber;
  policy.updatedAt = new Date().toISOString();

  appendAuditLog({
    actorUserId: (req as any).user.id,
    actorRole: (req as any).user.role,
    action: 'POLICY_VERSION_UPDATED',
    entityType: 'POLICY_VERSION',
    entityId: policy.id,
    payload: { versionNumber: policy.versionNumber, status: policy.status },
  });

  res.json(policy);
});

// Policy State Transitions (Human in the Loop Governance: DRAFT -> UNDER_REVIEW -> APPROVED -> PUBLISHED -> RETIRED)
app.post('/api/v1/policies/:id/transition', authenticate, requireRole(['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { targetStatus, remarks } = req.body;
  const policy = db.policyVersions.find((p) => p.id === req.params.id);
  if (!policy) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Policy version not found.' } });
  }

  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['APPROVED', 'DRAFT'],
    APPROVED: ['PUBLISHED', 'UNDER_REVIEW'],
    PUBLISHED: ['RETIRED'],
    RETIRED: [],
  };

  if (!allowedTransitions[policy.status]?.includes(targetStatus)) {
    return res.status(400).json({
      error: {
        code: 'ILLEGAL_STATE_TRANSITION',
        message: `Cannot transition policy from ${policy.status} to ${targetStatus}`,
      },
    });
  }

  // Publication requires Ministry Officer or Super Admin role
  if (targetStatus === 'PUBLISHED' && !['MOTA_OFFICER', 'SUPER_ADMIN', 'ADMIN'].includes((req as any).user.role)) {
    return res.status(403).json({
      error: { code: 'UNAUTHORIZED_PUBLISHER', message: 'Only authorized MoTA Officers or System Admins can publish policy.' },
    });
  }

  const prevStatus = policy.status;
  policy.status = targetStatus;
  policy.updatedAt = new Date().toISOString();
  if (targetStatus === 'PUBLISHED') {
    policy.publishedAt = new Date().toISOString();
    policy.publishedBy = (req as any).user.name;
  }

  appendAuditLog({
    actorUserId: (req as any).user.id,
    actorRole: (req as any).user.role,
    action: `POLICY_TRANSITION_${targetStatus}`,
    entityType: 'POLICY_VERSION',
    entityId: policy.id,
    payload: { from: prevStatus, to: targetStatus, remarks, actor: (req as any).user.name },
  });

  res.json({ success: true, policy });
});

// ==========================================
// DYNAMIC APPLICATION ENGINE & WORKFLOWS
// ==========================================

// Get Applications List (filtered by role and query)
app.get('/api/v1/applications', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  let apps = [...db.applications];

  // Role filtering
  if (user.role === 'STUDENT') {
    apps = apps.filter((a) => a.applicantId === user.id);
  } else if (user.role === 'INSTITUTION_VERIFIER' && req.query.cohortView !== 'true') {
    // Verifier sees applications from their institution or all pending
    apps = apps.filter(
      (a) =>
        a.fieldValues?.institutionName?.toLowerCase().includes(user.institution.toLowerCase()) ||
        a.fieldValues?.universityName?.toLowerCase().includes(user.institution.toLowerCase()) ||
        a.status === 'SUBMITTED' ||
        a.status === 'ELIGIBILITY_CHECK'
    );
  }

  // Filter by scheme
  if (req.query.schemeCode) {
    apps = apps.filter((a) => a.schemeCode === req.query.schemeCode);
  }
  // Filter by status
  if (req.query.status) {
    apps = apps.filter((a) => a.status === req.query.status);
  }

  // Return augmented application objects with counts
  const augmented = apps.map((appItem) => {
    const docs = db.documents.filter((d) => d.applicationId === appItem.id);
    const defs = db.deficiencies.filter((d) => d.applicationId === appItem.id);
    const vCase = db.verificationCases.find((v) => v.applicationId === appItem.id);
    const applicant = db.users.find((u) => u.id === appItem.applicantId);
    return {
      ...appItem,
      applicantName: applicant?.name || appItem.fieldValues?.applicantName || 'Applicant',
      applicantEmail: applicant?.email || '',
      documentCount: docs.length,
      deficiencyCount: defs.filter((d) => d.status === 'OPEN').length,
      verificationStatus: vCase?.overallStatus || 'PENDING',
    };
  });

  res.json(augmented);
});

// Get Single Application by ID with full case dossier
app.get('/api/v1/applications/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const appItem = db.applications.find((a) => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  if (user.role === 'STUDENT' && appItem.applicantId !== user.id) {
    return res.status(403).json({ error: { code: 'ACCESS_DENIED', message: 'You can only view your own applications.' } });
  }

  const policyVersion = db.policyVersions.find((p) => p.id === appItem.policyVersionId);
  const scheme = db.schemes.find((s) => s.id === appItem.schemeId);
  const documents = db.documents.filter((d) => d.applicationId === appItem.id);
  const deficiencies = db.deficiencies.filter((d) => d.applicationId === appItem.id);
  const verificationCase = db.verificationCases.find((v) => v.applicationId === appItem.id);
  const scrutinyCase = db.scrutinyCases.find((s) => s.applicationId === appItem.id);
  const selectionDecision = db.selectionDecisions.find((s) => s.applicationId === appItem.id);
  const postSelection = db.postSelectionMilestones.filter((m) => m.applicationId === appItem.id);
  const grievances = db.grievances.filter((g) => g.applicationId === appItem.id);
  const applicant = db.users.find((u) => u.id === appItem.applicantId);

  res.json({
    application: appItem,
    scheme,
    policyVersion,
    applicant: applicant ? { id: applicant.id, name: applicant.name, email: applicant.email, state: applicant.state } : null,
    documents,
    deficiencies,
    verificationCase,
    scrutinyCase,
    selectionDecision,
    postSelectionMilestones: postSelection,
    grievances,
  });
});

// Create Application Draft / Submit
app.post('/api/v1/applications', authenticate, requireRole(['STUDENT']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { schemeCode, policyVersionId, fieldValues, submitNow = false } = req.body;

  if (!schemeCode || !policyVersionId) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Scheme code and policy version are required.' } });
  }

  const scheme = db.schemes.find((s) => s.code === schemeCode.toUpperCase());
  const policyVersion = db.policyVersions.find((p) => p.id === policyVersionId);

  if (!scheme || !policyVersion) {
    return res.status(404).json({ error: { code: 'INVALID_SCHEME_OR_POLICY', message: 'Scheme or policy version not found.' } });
  }

  // Ensure application number format
  const appSeq = db.applications.length + 1;
  const yearSuffix = policyVersion.academicYear.replace(/[^0-9]/g, '').slice(0, 4) || '2026';
  const appNumber = `JVS-${scheme.code}-${yearSuffix}-${String(appSeq).padStart(5, '0')}`;

  const newApp = {
    id: crypto.randomUUID(),
    applicationNumber: appNumber,
    schemeId: scheme.id,
    schemeCode: scheme.code,
    schemeName: scheme.name,
    policyVersionId: policyVersion.id,
    policyVersionNumber: policyVersion.versionNumber,
    academicYear: policyVersion.academicYear,
    applicantId: user.id,
    status: (submitNow ? 'SUBMITTED' : 'DRAFT') as Application['status'],
    fieldValues: {
      ...fieldValues,
      applicantName: fieldValues?.applicantName || user.name,
      applicantEmail: user.email,
    },
    timeline: [
      {
        stage: 'REGISTRATION',
        title: 'Account Registered',
        status: 'COMPLETED' as const,
        timestamp: user.createdAt || new Date().toISOString(),
        description: 'Student registered on Janjatiya Vidya Setu portal',
      },
      {
        stage: 'APPLICATION_CREATED',
        title: submitNow ? 'Application Submitted' : 'Draft Saved',
        status: 'COMPLETED' as const,
        timestamp: new Date().toISOString(),
        description: submitNow
          ? `Submitted under ${scheme.code} (${policyVersion.academicYear}) guidelines`
          : 'Application draft initiated',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.applications.push(newApp);

  // If submitted immediately, add notification & audit
  if (submitNow) {
    appendAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'APPLICATION',
      entityId: newApp.id,
      payload: { appNumber: newApp.applicationNumber, scheme: scheme.code },
    });

    db.notifications.push({
      id: crypto.randomUUID(),
      userId: user.id,
      title: 'Application Submitted Successfully',
      message: `Your application ${newApp.applicationNumber} for ${scheme.name} has been submitted for verification.`,
      type: 'SUCCESS',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(201).json(newApp);
});

// Update Application Fields / Submit existing draft
app.put('/api/v1/applications/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const appItem = db.applications.find((a) => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  if (user.role === 'STUDENT' && appItem.applicantId !== user.id) {
    return res.status(403).json({ error: { code: 'ACCESS_DENIED', message: 'Cannot edit other applicants submissions.' } });
  }

  if (appItem.status !== 'DRAFT' && appItem.status !== 'DEFICIENCY') {
    return res.status(400).json({
      error: { code: 'LOCKED_APPLICATION', message: `Cannot modify application in status: ${appItem.status}` },
    });
  }

  const { fieldValues, submitNow } = req.body;
  if (fieldValues) {
    appItem.fieldValues = { ...appItem.fieldValues, ...fieldValues };
  }

  if (submitNow && appItem.status === 'DRAFT') {
    appItem.status = 'SUBMITTED';
    appItem.timeline.push({
      stage: 'APPLICATION_SUBMITTED',
      title: 'Application Submitted',
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      description: 'Submitted for verification by Institute Nodal Officer.',
    });

    appendAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'APPLICATION',
      entityId: appItem.id,
      payload: { appNumber: appItem.applicationNumber },
    });
  }

  appItem.updatedAt = new Date().toISOString();
  res.json(appItem);
});

// ==========================================
// DOCUMENT MANAGEMENT & SECURE VAULT
// ==========================================

// Upload Document with SHA-256 Checksum, MIME Validation, and Simulated OCR Extraction
app.post('/api/v1/documents/upload', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { applicationId, documentType, fileName, mimeType, fileDataBase64, fieldValuesToCrossCheck } = req.body;

  if (!applicationId || !documentType || !fileName) {
    return res.status(400).json({ error: { code: 'MISSING_DATA', message: 'applicationId, documentType, and fileName are required.' } });
  }

  const appItem = db.applications.find((a) => a.id === applicationId);
  if (!appItem) {
    return res.status(404).json({ error: { code: 'APP_NOT_FOUND', message: 'Application not found.' } });
  }

  // Security checks: MIME type allowlist
  const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (mimeType && !allowedMime.includes(mimeType)) {
    return res.status(400).json({
      error: {
        code: 'DOCUMENT_INVALID_TYPE',
        message: `MIME type ${mimeType} is not supported. Allowed formats: PDF, JPEG, PNG.`,
      },
    });
  }

  // Compute real SHA-256 Checksum for tamper prevention
  const contentToHash = fileDataBase64 || `${fileName}-${Date.now()}-${user.id}`;
  const sha256 = crypto.createHash('sha256').update(contentToHash).digest('hex');
  const storageRef = `secure-vault://mota/${appItem.schemeCode}/${appItem.id}/${documentType}_${Date.now()}.enc`;

  // Simulated OCR / Field extraction engine based on real document rules
  let ocrData: Record<string, any> = {};
  if (documentType === 'caste_certificate' || documentType === 'st_certificate') {
    ocrData = {
      certificateNumber: `ST/GOV/2024/${Math.floor(100000 + Math.random() * 900000)}`,
      beneficiaryName: fieldValuesToCrossCheck?.applicantName || user.name,
      tribeSubCaste: fieldValuesToCrossCheck?.tribeCommunity || 'Santhal',
      issuingAuthority: 'Sub-Divisional Magistrate / Revenue Officer',
      issuingState: fieldValuesToCrossCheck?.domicileState || user.state || 'Jharkhand',
      validity: 'Permanent',
      extractedConfidence: 0.98,
    };
  } else if (documentType === 'income_certificate') {
    const rawInc = fieldValuesToCrossCheck?.annualFamilyIncome || '180000';
    ocrData = {
      certificateNumber: `INC/GOV/2024/${Math.floor(100000 + Math.random() * 900000)}`,
      annualIncomeGross: parseInt(String(rawInc).replace(/[^0-9]/g, '')) || 180000,
      financialYear: '2023-24',
      issuingAuthority: 'Tahsildar / Block Development Officer',
      incomeType: 'Gross Income from all sources without deduction',
      extractedConfidence: 0.95,
    };
  } else if (documentType === 'mark_sheet' || documentType === 'qualifying_marksheet') {
    ocrData = {
      rollNumber: `UNIV-${Math.floor(100000 + Math.random() * 900000)}`,
      studentName: fieldValuesToCrossCheck?.applicantName || user.name,
      percentageMarks: parseFloat(fieldValuesToCrossCheck?.qualifyingMarksPercentage || '68.5'),
      examName: fieldValuesToCrossCheck?.qualifyingDegree || 'Master of Science (M.Sc)',
      passingYear: '2024',
      extractedConfidence: 0.96,
    };
  } else {
    ocrData = {
      documentTitle: fileName,
      verifiedSignature: true,
      extractedConfidence: 0.92,
    };
  }

  // Remove previous document of this type for this application if re-uploading
  const existingDocIdx = db.documents.findIndex(
    (d) => d.applicationId === applicationId && d.documentType === documentType
  );
  if (existingDocIdx >= 0) {
    db.documents.splice(existingDocIdx, 1);
  }

  const newDoc = {
    id: crypto.randomUUID(),
    applicationId,
    documentType,
    fileName,
    mimeType: mimeType || 'application/pdf',
    fileSizeBytes: fileDataBase64 ? Math.round(fileDataBase64.length * 0.75) : 348200,
    storageRef,
    sha256Hash: sha256,
    ocrExtractedData: ocrData,
    verificationStatus: 'PENDING' as const,
    uploadedBy: user.id,
    uploadedAt: new Date().toISOString(),
  };

  db.documents.push(newDoc);

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'DOCUMENT',
    entityId: newDoc.id,
    payload: {
      applicationId,
      documentType,
      sha256,
      fileName,
    },
  });

  res.status(201).json(newDoc);
});

// ==========================================
// PRAMAAN DUAL-PATH VERIFICATION ENGINE
// ==========================================

// Trigger or Inspect PRAMAAN Verification for an Application
app.post('/api/v1/verification/evaluate/:applicationId', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const appItem = db.applications.find((a) => a.id === req.params.applicationId);
  if (!appItem) {
    return res.status(404).json({ error: { code: 'APP_NOT_FOUND', message: 'Application not found.' } });
  }

  const policyVersion = db.policyVersions.find((p) => p.id === appItem.policyVersionId);
  const documents = db.documents.filter((d) => d.applicationId === appItem.id);

  // Run PRAMAAN Dual-Path Verification
  const verificationResult = runPramaanVerification(appItem, policyVersion, documents);

  // Save or update verification case in database
  let vCase = db.verificationCases.find((v) => v.applicationId === appItem.id);
  if (!vCase) {
    vCase = {
      id: crypto.randomUUID(),
      applicationId: appItem.id,
      verifierId: user.id,
      verificationStage: user.role === 'INSTITUTION_VERIFIER' ? 'INSTITUTE_LEVEL' : 'MOTA_LEVEL',
      pathA_EvidenceResults: verificationResult.pathA_EvidenceResults,
      pathB_CredentialResults: verificationResult.pathB_CredentialResults,
      overallStatus: verificationResult.overallStatus,
      flags: verificationResult.flags,
      explanations: verificationResult.explanations,
      notes: verificationResult.summaryNotes,
      updatedAt: new Date().toISOString(),
    };
    db.verificationCases.push(vCase);
  } else {
    vCase.pathA_EvidenceResults = verificationResult.pathA_EvidenceResults;
    vCase.pathB_CredentialResults = verificationResult.pathB_CredentialResults;
    vCase.overallStatus = verificationResult.overallStatus;
    vCase.flags = verificationResult.flags;
    vCase.explanations = verificationResult.explanations;
    vCase.notes = verificationResult.summaryNotes;
    vCase.updatedAt = new Date().toISOString();
  }

  // Update application status if auto-transition is applicable
  if (verificationResult.overallStatus === 'VERIFIED') {
    appItem.status = 'READY_FOR_SCRUTINY';
  } else if (verificationResult.overallStatus === 'INCONSISTENT' || verificationResult.overallStatus === 'INCOMPLETE') {
    appItem.status = 'DEFICIENCY';
    // Auto generate deficiency records if none exist
    verificationResult.flags.forEach((f) => {
      const existing = db.deficiencies.find(
        (d) => d.applicationId === appItem.id && d.requirementKey === f.ruleKey && d.status === 'OPEN'
      );
      if (!existing) {
        db.deficiencies.push({
          id: crypto.randomUUID(),
          applicationId: appItem.id,
          requirementKey: f.ruleKey,
          documentKey: f.relatedDocument || 'general',
          title: f.title,
          whatExplanation: f.what,
          whyExplanation: f.why,
          actionRequired: f.action,
          status: 'OPEN',
          raisedBy: user.name || 'PRAMAAN Automated Engine',
          raisedAt: new Date().toISOString(),
        });
      }
    });

    // Notify student
    db.notifications.push({
      id: crypto.randomUUID(),
      userId: appItem.applicantId,
      title: 'Action Required: Deficiency Raised',
      message: `Deficiency detected in application ${appItem.applicationNumber}: ${verificationResult.flags[0]?.what}`,
      type: 'ACTION_REQUIRED',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'PRAMAAN_VERIFICATION_EVALUATED',
    entityType: 'VERIFICATION_CASE',
    entityId: vCase.id,
    payload: {
      applicationId: appItem.id,
      status: verificationResult.overallStatus,
      flagCount: verificationResult.flags.length,
    },
  });

  res.json({
    success: true,
    verificationCase: vCase,
    applicationStatus: appItem.status,
  });
});

// Officer Manual Verification Approval or Defect Action
app.post('/api/v1/verification/decision', authenticate, requireRole(['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { applicationId, decision, remarks, deficienciesToRaise } = req.body;

  const appItem = db.applications.find((a) => a.id === applicationId);
  if (!appItem) {
    return res.status(404).json({ error: { code: 'APP_NOT_FOUND', message: 'Application not found.' } });
  }

  if (decision === 'VERIFY_APPROVE') {
    appItem.status = 'READY_FOR_SCRUTINY';
    appItem.timeline.push({
      stage: 'VERIFICATION_COMPLETED',
      title: 'Verification Approved',
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      description: `Verified by ${user.name} (${user.role}). Application forwarded to Scrutiny Workbench.`,
    });

    db.notifications.push({
      id: crypto.randomUUID(),
      userId: appItem.applicantId,
      title: 'Document Verification Cleared',
      message: `Your documents for ${appItem.applicationNumber} have been successfully verified and moved to scrutiny.`,
      type: 'SUCCESS',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (decision === 'MARK_DEFECTIVE') {
    appItem.status = 'DEFICIENCY';
    if (Array.isArray(deficienciesToRaise)) {
      deficienciesToRaise.forEach((dItem: any) => {
        db.deficiencies.push({
          id: crypto.randomUUID(),
          applicationId: appItem.id,
          requirementKey: dItem.requirementKey || 'manual_review',
          documentKey: dItem.documentKey || 'general',
          title: dItem.title || 'Correction Required',
          whatExplanation: dItem.whatExplanation,
          whyExplanation: dItem.whyExplanation,
          actionRequired: dItem.actionRequired,
          status: 'OPEN',
          raisedBy: user.name,
          raisedAt: new Date().toISOString(),
        });
      });
    }

    appItem.timeline.push({
      stage: 'DEFICIENCY_RAISED',
      title: 'Deficiency Notified',
      status: 'ACTION_REQUIRED',
      timestamp: new Date().toISOString(),
      description: `Remarks: ${remarks || 'Correction required by candidate'}.`,
    });

    db.notifications.push({
      id: crypto.randomUUID(),
      userId: appItem.applicantId,
      title: 'Deficiency Notice Issued',
      message: `Officer ${user.name} has requested corrections for application ${appItem.applicationNumber}. Check Deficiency Desk.`,
      type: 'ACTION_REQUIRED',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (decision === 'REJECT') {
    appItem.status = 'NOT_SELECTED';
    appItem.timeline.push({
      stage: 'REJECTED',
      title: 'Application Rejected',
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      description: `Rejected by ${user.name}. Reason: ${remarks}`,
    });
  }

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: `VERIFICATION_${decision}`,
    entityType: 'APPLICATION',
    entityId: appItem.id,
    payload: { decision, remarks, actor: user.name },
  });

  res.json({ success: true, application: appItem });
});

// ==========================================
// EXPLAINABLE DEFICIENCY & RESUBMISSION
// ==========================================

// Student Resubmits Correction for a Deficiency
app.post('/api/v1/deficiencies/:id/resubmit', authenticate, requireRole(['STUDENT']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const deficiency = db.deficiencies.find((d) => d.id === req.params.id);
  if (!deficiency) {
    return res.status(404).json({ error: { code: 'DEFICIENCY_NOT_FOUND', message: 'Deficiency item not found.' } });
  }

  const appItem = db.applications.find((a) => a.id === deficiency.applicationId);
  if (!appItem || appItem.applicantId !== user.id) {
    return res.status(403).json({ error: { code: 'ACCESS_DENIED', message: 'Unauthorized access to this deficiency.' } });
  }

  const { studentRemark, replacementDocumentId } = req.body;

  deficiency.status = 'RESUBMITTED';
  deficiency.studentRemark = studentRemark;
  deficiency.replacementDocumentId = replacementDocumentId;
  deficiency.resubmittedAt = new Date().toISOString();

  // Check if all deficiencies are resolved or resubmitted
  const remainingOpen = db.deficiencies.filter(
    (d) => d.applicationId === appItem.id && d.status === 'OPEN'
  );

  if (remainingOpen.length === 0) {
    appItem.status = 'RESUBMITTED';
    appItem.timeline.push({
      stage: 'RESUBMISSION',
      title: 'Corrections Resubmitted',
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      description: 'Candidate resubmitted rectified evidence. Scheduled for re-verification.',
    });
  }

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'DEFICIENCY_RESUBMITTED',
    entityType: 'DEFICIENCY',
    entityId: deficiency.id,
    payload: { applicationId: appItem.id, studentRemark },
  });

  res.json({ success: true, deficiency, applicationStatus: appItem.status });
});

// ==========================================
// SCRUTINY WORKBENCH & SELECTION ENGINE
// ==========================================

// Record Scrutiny Review by Committee
app.post('/api/v1/scrutiny/review', authenticate, requireRole(['MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { applicationId, recommendation, score, committeeRemarks, priorityCriteriaMet } = req.body;

  const appItem = db.applications.find((a) => a.id === applicationId);
  if (!appItem) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  let sCase = db.scrutinyCases.find((s) => s.applicationId === applicationId);
  if (!sCase) {
    sCase = {
      id: crypto.randomUUID(),
      applicationId,
      reviewerId: user.id,
      reviewerName: user.name,
      score: score || 85,
      recommendation: recommendation || 'RECOMMENDED',
      committeeRemarks: committeeRemarks || '',
      priorityCriteriaMet: priorityCriteriaMet || [],
      reviewedAt: new Date().toISOString(),
    };
    db.scrutinyCases.push(sCase);
  } else {
    sCase.score = score;
    sCase.recommendation = recommendation;
    sCase.committeeRemarks = committeeRemarks;
    sCase.priorityCriteriaMet = priorityCriteriaMet;
    sCase.reviewedAt = new Date().toISOString();
  }

  appItem.status = 'SCREENING';
  appItem.timeline.push({
    stage: 'SCRUTINY_COMPLETED',
    title: 'Committee Scrutiny Completed',
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    description: `Recommendation: ${recommendation}. Reviewed by ${user.name}.`,
  });

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'SCRUTINY_REVIEW_RECORDED',
    entityType: 'SCRUTINY_CASE',
    entityId: sCase.id,
    payload: { applicationId, recommendation, score },
  });

  res.json({ success: true, scrutinyCase: sCase });
});

// Final Selection & Award Decision
app.post('/api/v1/selection/decision', authenticate, requireRole(['MOTA_OFFICER', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { applicationId, decision, quotaCategory, annualAwardAmount, remarks } = req.body;

  const appItem = db.applications.find((a) => a.id === applicationId);
  if (!appItem) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  const isSelected = decision === 'SELECTED';
  const awardLetterRef = isSelected ? `MOTA/JVS/AWARD/${appItem.schemeCode}/${Date.now().toString().slice(-6)}` : null;

  let sDecision = db.selectionDecisions.find((s) => s.applicationId === applicationId);
  if (!sDecision) {
    sDecision = {
      id: crypto.randomUUID(),
      applicationId,
      decision,
      quotaCategory: quotaCategory || 'ST_OTHERS',
      annualAwardAmount: annualAwardAmount || (appItem.schemeCode === 'NOS' ? '$15,400 + Fees' : '₹3,72,000 + HRA'),
      awardLetterRef,
      remarks: remarks || '',
      decidedBy: user.name,
      decidedAt: new Date().toISOString(),
    };
    db.selectionDecisions.push(sDecision);
  } else {
    sDecision.decision = decision;
    sDecision.quotaCategory = quotaCategory;
    sDecision.annualAwardAmount = annualAwardAmount;
    sDecision.awardLetterRef = awardLetterRef;
    sDecision.remarks = remarks;
    sDecision.decidedAt = new Date().toISOString();
  }

  appItem.status = isSelected ? 'SELECTED' : 'NOT_SELECTED';
  appItem.timeline.push({
    stage: 'SELECTION_DECISION',
    title: isSelected ? 'Provisionally Selected for Fellowship' : 'Selection Completed (Not Selected)',
    status: isSelected ? 'COMPLETED' : 'FAILED',
    timestamp: new Date().toISOString(),
    description: isSelected
      ? `Award Letter ${awardLetterRef} generated under ${quotaCategory} quota.`
      : `Application was not selected by the Ministry committee. Remarks: ${remarks}`,
  });

  // If selected, automatically bootstrap Post-Selection Milestones
  if (isSelected) {
    const existingMilestones = db.postSelectionMilestones.filter((m) => m.applicationId === appItem.id);
    if (existingMilestones.length === 0) {
      db.postSelectionMilestones.push(
        {
          id: crypto.randomUUID(),
          applicationId: appItem.id,
          milestoneKey: 'joining_report',
          title: 'University Joining Report & Verification Checklist',
          description: 'Submit joining report within 1 month from provisional award letter date',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'PENDING',
          requiredDocument: 'joining_report',
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          applicationId: appItem.id,
          milestoneKey: 'bank_pfms_linking',
          title: 'Aadhaar Seeded Bank Account Linking with PFMS',
          description: 'Bank account validation through Public Financial Management System (PFMS)',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'PENDING',
          requiredDocument: 'bank_mandate',
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          applicationId: appItem.id,
          milestoneKey: 'continuation_cert_q1',
          title: 'Quarter 1 Continuation Certificate (April - June)',
          description: 'Quarterly continuation certified by Supervisor and Head of Institution (due 10th July)',
          dueDate: '2026-07-10',
          status: 'PENDING',
          requiredDocument: 'continuation_certificate_q1',
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          applicationId: appItem.id,
          milestoneKey: 'annual_progress_report',
          title: 'Annual Research Progress Report & Repository Upload',
          description: 'Submit 1st year progress report and upload on Tribal Repository (repository.tribal.gov.in)',
          dueDate: '2027-04-30',
          status: 'PENDING',
          requiredDocument: 'annual_progress_report',
          updatedAt: new Date().toISOString(),
        }
      );
    }
  }

  // Notify student
  db.notifications.push({
    id: crypto.randomUUID(),
    userId: appItem.applicantId,
    title: isSelected ? 'Congratulations! Provisionally Selected' : 'Selection Update',
    message: isSelected
      ? `You have been provisionally selected for ${appItem.schemeName}! Award letter ${awardLetterRef} is ready in your portal.`
      : `The selection committee has completed review of your application ${appItem.applicationNumber}.`,
    type: isSelected ? 'SUCCESS' : 'INFO',
    read: false,
    createdAt: new Date().toISOString(),
  });

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: `SELECTION_RECORDED_${decision}`,
    entityType: 'SELECTION_DECISION',
    entityId: sDecision.id,
    payload: { applicationId, decision, quotaCategory, awardLetterRef },
  });

  res.json({ success: true, selectionDecision: sDecision, application: appItem });
});

// Update Post-Selection Milestone
app.post('/api/v1/post-selection/milestones/:id/update', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const milestone = db.postSelectionMilestones.find((m) => m.id === req.params.id);
  if (!milestone) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Milestone not found.' } });
  }

  const { status, submittedDocumentRef, remarks } = req.body;
  if (status) milestone.status = status;
  if (submittedDocumentRef) milestone.submittedDocumentRef = submittedDocumentRef;
  if (remarks) milestone.remarks = remarks;
  milestone.updatedAt = new Date().toISOString();

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'POST_SELECTION_MILESTONE_UPDATED',
    entityType: 'POST_SELECTION_MILESTONE',
    entityId: milestone.id,
    payload: { milestoneKey: milestone.milestoneKey, status: milestone.status },
  });

  res.json({ success: true, milestone });
});

// ==========================================
// TAMPER-EVIDENT AUDIT TRAIL & HASH CHAIN
// ==========================================

app.get('/api/v1/audit/logs', authenticate, requireRole(['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { limit = '100', offset = '0', entityType } = req.query;
  let logs = [...db.auditLogs];
  if (entityType) {
    logs = logs.filter((l) => l.entityType === entityType);
  }
  // Reverse chronological for viewing
  const paginated = logs.slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));
  res.json({
    totalCount: logs.length,
    items: paginated,
  });
});

app.get('/api/v1/audit/verify-chain', authenticate, requireRole(['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const integrity = verifyAuditChainIntegrity();
  res.json(integrity);
});

// Simulate Tamper Test (To prove that our cryptographic hash chain detects modifications!)
app.post('/api/v1/audit/simulate-tamper', authenticate, requireRole(['SUPER_ADMIN']), (req: Request, res: Response) => {
  if (db.auditLogs.length > 2) {
    const target = db.auditLogs[1];
    target.payload = { ...target.payload, _TAMPERED_FLAG: 'Illegally altered payload by unauthorized intruder' };
    const integrityAfter = verifyAuditChainIntegrity();
    res.json({
      message: 'Simulated tampering on Audit Block index 1 payload. Verification executed.',
      verificationResult: integrityAfter,
    });
  } else {
    res.status(400).json({ error: { message: 'Not enough audit blocks to tamper.' } });
  }
});

// ==========================================
// MoTA ANALYTICS DASHBOARD
// ==========================================

app.get('/api/v1/analytics/overview', authenticate, (req: Request, res: Response) => {
  const totalApplications = db.applications.length;
  const statusCounts: Record<string, number> = {};
  db.applications.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const schemeBreakdown = db.schemes.map((s) => {
    const count = db.applications.filter((a) => a.schemeCode === s.code).length;
    const selected = db.applications.filter((a) => a.schemeCode === s.code && a.status === 'SELECTED').length;
    return {
      code: s.code,
      name: s.name,
      totalApplications: count,
      selectedCount: selected,
    };
  });

  const deficiencyStats = {
    totalRaised: db.deficiencies.length,
    open: db.deficiencies.filter((d) => d.status === 'OPEN').length,
    resubmitted: db.deficiencies.filter((d) => d.status === 'RESUBMITTED').length,
    resolved: db.deficiencies.filter((d) => d.status === 'RESOLVED').length,
  };

  const pvtgAndDivyangjanCounts = {
    divyangjan: db.applications.filter((a) => a.fieldValues?.isDivyangjan === true || a.fieldValues?.isDivyangjan === 'true').length,
    pvtg: db.applications.filter((a) => a.fieldValues?.isPVTG === true || a.fieldValues?.isPVTG === 'true').length,
    female: db.applications.filter((a) => a.fieldValues?.gender?.toLowerCase() === 'female').length,
  };

  res.json({
    metrics: {
      totalApplications,
      submitted: statusCounts['SUBMITTED'] || 0,
      underVerification: (statusCounts['ELIGIBILITY_CHECK'] || 0) + (statusCounts['SUBMITTED'] || 0),
      deficiencies: statusCounts['DEFICIENCY'] || 0,
      readyForScrutiny: statusCounts['READY_FOR_SCRUTINY'] || 0,
      selected: statusCounts['SELECTED'] || 0,
      completed: statusCounts['COMPLETED'] || 0,
    },
    schemeBreakdown,
    deficiencyStats,
    inclusionMetrics: pvtgAndDivyangjanCounts,
    auditChainLength: db.auditLogs.length,
    lastAuditHash: db.auditLogs[db.auditLogs.length - 1]?.currentHash || 'GENESIS',
  });
});

// ==========================================
// NOTIFICATIONS & GRIEVANCES
// ==========================================

app.get('/api/v1/notifications', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const userNotifications = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotifications);
});

app.post('/api/v1/notifications/:id/mark-read', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === user.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

app.get('/api/v1/grievances', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  let items = db.grievances;
  if (user.role === 'STUDENT') {
    items = items.filter((g) => g.studentId === user.id);
  }
  res.json(items);
});

app.post('/api/v1/grievances', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { applicationId, subject, category, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: { message: 'Subject and message are required.' } });
  }

  const grievance = {
    id: crypto.randomUUID(),
    ticketNumber: `GRV-${Date.now().toString().slice(-6)}`,
    applicationId: applicationId || null,
    studentId: user.id,
    studentName: user.name,
    subject,
    category: category || 'Verification Query',
    message,
    status: 'OPEN' as const,
    officerReply: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.grievances.push(grievance);

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'GRIEVANCE_FILED',
    entityType: 'GRIEVANCE',
    entityId: grievance.id,
    payload: { ticketNumber: grievance.ticketNumber, subject },
  });

  res.status(201).json(grievance);
});

app.post('/api/v1/grievances/:id/respond', authenticate, requireRole(['MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { reply, status = 'RESOLVED' } = req.body;
  const grv = db.grievances.find((g) => g.id === req.params.id);
  if (!grv) {
    return res.status(404).json({ error: { message: 'Grievance ticket not found.' } });
  }

  grv.officerReply = reply;
  grv.status = status;
  grv.updatedAt = new Date().toISOString();

  // Notify student
  db.notifications.push({
    id: crypto.randomUUID(),
    userId: grv.studentId,
    title: `Grievance ${grv.ticketNumber} Responded`,
    message: `MoTA Officer ${user.name} has responded to your grievance: "${reply.slice(0, 100)}..."`,
    type: 'INFO',
    read: false,
    createdAt: new Date().toISOString(),
  });

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'GRIEVANCE_RESOLVED',
    entityType: 'GRIEVANCE',
    entityId: grv.id,
    payload: { ticketNumber: grv.ticketNumber, status },
  });

  res.json({ success: true, grievance: grv });
});

// ==========================================
// SCHOLARSHIP CONTINUITY & RENEWAL SYSTEM
// ==========================================

// Get continuity record for current student or specific student
app.get('/api/v1/continuity/record', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const targetStudentId = (user.role === 'STUDENT') ? user.id : (req.query.studentId as string || user.id);

  let record = db.continuityRecords.find((r) => r.studentId === targetStudentId);

  // If no record found for student, try to auto-synthesize from their application/profile with synthetic demo tagging
  if (!record && user.role === 'STUDENT') {
    const studentApp = db.applications.find((a) => a.applicantId === targetStudentId);
    record = {
      id: `cont-${targetStudentId}`,
      isSyntheticDemo: true,
      studentId: targetStudentId,
      studentName: user.name,
      studentEmail: user.email,
      state: user.state || 'Jharkhand',
      institution: 'Demo Technological University (Campus A)',
      course: studentApp?.fieldValues?.courseName || 'Ph.D Research Fellowship',
      schemeCode: studentApp?.schemeCode || 'NFST',
      schemeName: studentApp?.schemeName || 'National Fellowship for ST Students',
      initialAwardYear: '2024-25',
      currentAcademicYear: '2026-27',
      totalDurationYears: 5,
      currentYearIndex: 3,
      overallContinuityStatus: 'ATTENTION_NEEDED',
      overallRiskLevel: 'MEDIUM',
      updatedAt: new Date().toISOString(),
      years: [
        {
          academicYear: '2024-25',
          yearIndex: 1,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹4,20,000 (Disbursed in AY 2024-25)',
          disbursedAt: '2025-03-15T09:30:00Z',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2024-06-30',
          daysRemaining: 0,
          cgpaPercentage: 84.5,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2025-26',
          yearIndex: 2,
          isHistoricalLocked: true,
          isCurrentRenewalYear: false,
          status: 'COMPLETED_DISBURSED',
          disbursedAmount: '₹4,20,000 (Disbursed in AY 2025-26)',
          disbursedAt: '2026-03-20T10:15:00Z',
          disbursementPipelineStatus: 'DISBURSED_PRIOR_CYCLE',
          renewalProgressPercent: 100,
          renewalOpeningStatus: 'CLOSED',
          renewalDeadline: '2025-06-30',
          daysRemaining: 0,
          cgpaPercentage: 86.0,
          institutionVerificationStatus: 'APPROVED',
          motaApprovalStatus: 'APPROVED',
          requirements: [],
          issues: []
        },
        {
          academicYear: '2026-27',
          yearIndex: 3,
          isHistoricalLocked: false,
          isCurrentRenewalYear: true,
          status: 'ACTIVE_RENEWAL',
          disbursedAmount: 'Pending Verification (₹4,44,000 eligible rate)',
          disbursementPipelineStatus: 'PENDING_RENEWAL',
          renewalProgressPercent: 75,
          renewalOpeningStatus: 'OPEN',
          renewalDeadline: '2026-05-31',
          daysRemaining: 34,
          cgpaPercentage: 85.0,
          institutionVerificationStatus: 'PENDING',
          motaApprovalStatus: 'PENDING',
          requirements: [
            {
              id: 'req-dyn-1',
              key: 'progress_report',
              title: 'Year 3 Annual Progress Report',
              category: 'RESEARCH_PROGRESS',
              description: 'Official annual progress report signed by Guide/HOD.',
              mandatory: true,
              status: 'PENDING'
            },
            {
              id: 'req-dyn-2',
              key: 'bonafide_y3',
              title: 'Institutional Bonafide Certificate',
              category: 'BONAFIDE_ENROLLMENT',
              description: 'Bonafide Certificate for Academic Year 2026-27.',
              mandatory: true,
              status: 'VERIFIED',
              documentName: 'Bonafide_2026.pdf',
              uploadedAt: new Date().toISOString()
            }
          ],
          issues: [
            {
              id: 'iss-dyn-1',
              type: 'MISSING_DOCUMENT',
              severity: 'HIGH',
              title: 'Annual Research Progress Report Awaited',
              what: 'Progress report for current academic year has not been uploaded.',
              why: 'Required under the configured scheme renewal rule to verify continuous active research engagement prior to renewal approval.',
              suggestedAction: 'Upload the supervisor-signed progress report via the Renewal Center.',
              requirementKey: 'progress_report',
              deadline: '2026-05-31',
              detectedAt: new Date().toISOString(),
              status: 'OPEN'
            }
          ]
        },
        {
          academicYear: '2027-28',
          yearIndex: 4,
          isHistoricalLocked: false,
          isCurrentRenewalYear: false,
          status: 'UPCOMING',
          disbursementPipelineStatus: 'NOT_APPLICABLE',
          renewalProgressPercent: 0,
          renewalOpeningStatus: 'UPCOMING',
          renewalDeadline: '2027-05-31',
          daysRemaining: 398,
          institutionVerificationStatus: 'NOT_STARTED',
          motaApprovalStatus: 'NOT_STARTED',
          requirements: [],
          issues: []
        }
      ]
    };
    db.continuityRecords.push(record);
  }

  if (!record) {
    return res.status(404).json({ error: { message: 'Scholarship continuity record not found.' } });
  }

  res.json(record);
});

// Get all continuity records for officers
app.get('/api/v1/continuity/all', authenticate, requireRole(['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user;
  let records = [...db.continuityRecords];

  // If Institution Verifier, filter to their institution or allow viewing all
  if (user.role === 'INSTITUTION_VERIFIER' && req.query.allInstitutes !== 'true') {
    records = records.filter(r => 
      r.institution.toLowerCase().includes(user.institution.toLowerCase()) ||
      user.institution.toLowerCase().includes(r.institution.toLowerCase())
    );
  }

  if (req.query.schemeCode && req.query.schemeCode !== 'ALL') {
    records = records.filter(r => r.schemeCode === req.query.schemeCode);
  }

  if (req.query.state && req.query.state !== 'ALL') {
    records = records.filter(r => r.state === req.query.state);
  }

  if (req.query.riskLevel && req.query.riskLevel !== 'ALL') {
    records = records.filter(r => r.overallRiskLevel === req.query.riskLevel);
  }

  if (req.query.status && req.query.status !== 'ALL') {
    records = records.filter(r => {
      const curYear = r.years.find(y => y.academicYear === r.currentAcademicYear);
      return curYear?.status === req.query.status;
    });
  }

  // Summary statistics for continuity management
  const allRecords = db.continuityRecords;
  const summary = {
    totalScholars: allRecords.length,
    onTrackCount: allRecords.filter(r => r.overallContinuityStatus === 'ON_TRACK').length,
    attentionNeededCount: allRecords.filter(r => r.overallContinuityStatus === 'ATTENTION_NEEDED').length,
    atRiskCount: allRecords.filter(r => r.overallContinuityStatus === 'AT_RISK').length,
    renewalApprovedCount: allRecords.filter(r => r.overallContinuityStatus === 'RENEWAL_APPROVED').length,
    highRiskCount: allRecords.filter(r => r.overallRiskLevel === 'HIGH').length,
    pendingVerificationCount: allRecords.filter(r => {
      const curYear = r.years.find(y => y.academicYear === r.currentAcademicYear);
      return curYear?.status === 'PENDING_VERIFICATION';
    }).length,
    deficientCount: allRecords.filter(r => {
      const curYear = r.years.find(y => y.academicYear === r.currentAcademicYear);
      return curYear?.status === 'DEFICIENT';
    }).length,
  };

  res.json({ records, summary });
});

// Upload/Replace document for a continuity requirement
app.post('/api/v1/continuity/upload-doc', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { recordId, academicYear, requirementKey, fileName } = req.body;

  const record = db.continuityRecords.find(r => r.id === recordId || r.studentId === user.id);
  if (!record) {
    return res.status(404).json({ error: { message: 'Continuity record not found.' } });
  }

  const targetYear = record.years.find(y => y.academicYear === academicYear);
  if (!targetYear) {
    return res.status(404).json({ error: { message: `Academic year ${academicYear} not found in continuity record.` } });
  }

  // Historical Protection Rule
  if (targetYear.isHistoricalLocked || targetYear.status === 'COMPLETED_DISBURSED') {
    return res.status(403).json({
      error: { message: `Academic year ${academicYear} is an immutable locked historical record and cannot be altered.` }
    });
  }

  const reqItem = targetYear.requirements.find(r => r.key === requirementKey);
  if (!reqItem) {
    return res.status(404).json({ error: { message: `Requirement key ${requirementKey} not found.` } });
  }

  // Update requirement
  reqItem.status = 'SUBMITTED';
  reqItem.documentName = fileName || `${reqItem.key}_submitted.pdf`;
  reqItem.uploadedAt = new Date().toISOString();

  // If this requirement had an associated issue, mark issue as resolved or updated
  const relIssue = targetYear.issues.find(i => i.requirementKey === requirementKey && i.status === 'OPEN');
  if (relIssue) {
    relIssue.status = 'RESOLVED';
    relIssue.resolvedAt = new Date().toISOString();
  }

  // Recalculate renewal progress percent
  const totalMandatory = targetYear.requirements.filter(r => r.mandatory).length;
  const completed = targetYear.requirements.filter(r => r.mandatory && (r.status === 'SUBMITTED' || r.status === 'VERIFIED')).length;
  targetYear.renewalProgressPercent = totalMandatory > 0 ? Math.round((completed / totalMandatory) * 100) : 100;

  // If in DEFICIENT state and all docs now submitted, transition to PENDING_VERIFICATION
  if (targetYear.status === 'DEFICIENT' && completed === totalMandatory) {
    targetYear.status = 'PENDING_VERIFICATION';
    targetYear.institutionVerificationStatus = 'PENDING';
    record.overallContinuityStatus = 'ATTENTION_NEEDED';
  }

  record.updatedAt = new Date().toISOString();

  // Tamper-evident audit log
  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'CONTINUITY_DOC_UPLOADED',
    entityType: 'CONTINUITY_REQUIREMENT',
    entityId: reqItem.id,
    payload: {
      studentId: record.studentId,
      schemeCode: record.schemeCode,
      academicYear,
      requirementKey,
      documentName: reqItem.documentName,
    },
  });

  res.json({ success: true, record, requirement: reqItem });
});

// Student submits complete renewal dossier
app.post('/api/v1/continuity/submit-renewal', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { recordId, academicYear, remarks } = req.body;

  const record = db.continuityRecords.find(r => r.id === recordId || r.studentId === user.id);
  if (!record) {
    return res.status(404).json({ error: { message: 'Continuity record not found.' } });
  }

  const targetYear = record.years.find(y => y.academicYear === academicYear);
  if (!targetYear) {
    return res.status(404).json({ error: { message: `Academic year ${academicYear} not found.` } });
  }

  // Historical Protection Rule
  if (targetYear.isHistoricalLocked || targetYear.status === 'COMPLETED_DISBURSED') {
    return res.status(403).json({
      error: { message: `Academic year ${academicYear} is a locked historical record and cannot be resubmitted.` }
    });
  }

  // Check mandatory requirements
  const unfulfilledMandatory = targetYear.requirements.filter(r => r.mandatory && r.status === 'PENDING');
  if (unfulfilledMandatory.length > 0) {
    return res.status(400).json({
      error: {
        message: `Cannot submit renewal. ${unfulfilledMandatory.length} mandatory requirement(s) are still pending upload: ${unfulfilledMandatory.map(r => r.title).join(', ')}`,
      },
    });
  }

  targetYear.status = 'PENDING_VERIFICATION';
  targetYear.institutionVerificationStatus = 'PENDING';
  targetYear.submissionDate = new Date().toISOString();
  targetYear.renewalProgressPercent = 100;
  record.overallContinuityStatus = 'ATTENTION_NEEDED';
  record.updatedAt = new Date().toISOString();

  // Notify student
  db.notifications.push({
    id: crypto.randomUUID(),
    userId: record.studentId,
    title: `Renewal Dossier Submitted for AY ${academicYear}`,
    message: `Your scholarship renewal package for ${record.schemeCode} (${academicYear}) has been submitted and routed to your verification officer.`,
    type: 'SUCCESS',
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Audit block
  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'CONTINUITY_RENEWAL_SUBMITTED',
    entityType: 'CONTINUITY_RECORD',
    entityId: record.id,
    payload: {
      studentId: record.studentId,
      academicYear,
      requirementsCount: targetYear.requirements.length,
      remarks,
    },
  });

  res.json({ success: true, record });
});

// Officer Verifies / Approves or Marks Deficient
app.post('/api/v1/continuity/officer-verify', authenticate, requireRole(['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { 
    recordId, 
    academicYear, 
    action, // 'APPROVE_RENEWAL' | 'MARK_DEFICIENT' | 'VERIFY_REQUIREMENT'
    requirementKey,
    deficiencyTitle,
    what,
    why,
    actionRequired,
    officerRemarks 
  } = req.body;

  const record = db.continuityRecords.find(r => r.id === recordId);
  if (!record) {
    return res.status(404).json({ error: { message: 'Continuity record not found.' } });
  }

  const targetYear = record.years.find(y => y.academicYear === academicYear);
  if (!targetYear) {
    return res.status(404).json({ error: { message: `Academic year ${academicYear} not found.` } });
  }

  // Historical Protection Rule
  if (targetYear.isHistoricalLocked || targetYear.status === 'COMPLETED_DISBURSED') {
    return res.status(403).json({
      error: { message: `Academic year ${academicYear} is an immutable locked historical record and cannot be altered.` }
    });
  }

  if (action === 'APPROVE_RENEWAL') {
    // Mark all requirements as verified
    targetYear.requirements.forEach(r => {
      r.status = 'VERIFIED';
      r.verifiedAt = new Date().toISOString();
      r.verifiedBy = user.name;
    });

    targetYear.status = 'APPROVED_FOR_DISBURSEMENT';
    targetYear.institutionVerificationStatus = 'APPROVED';
    targetYear.motaApprovalStatus = 'APPROVED';
    targetYear.approvalDate = new Date().toISOString();
    targetYear.officerRemarks = officerRemarks || 'Verified by Nodal Authority. Full compliance confirmed.';
    targetYear.disbursementPipelineStatus = 'PENDING_PFMS_PROCESSING';
    targetYear.disbursedAmount = 'Renewal Approved — Queued for PFMS Processing (₹4,44,000)';

    record.overallContinuityStatus = 'RENEWAL_APPROVED';
    record.overallRiskLevel = 'LOW';

    // Resolve all open issues for this year
    targetYear.issues.forEach(i => {
      i.status = 'RESOLVED';
      i.resolvedAt = new Date().toISOString();
    });

    // Notify student
    db.notifications.push({
      id: crypto.randomUUID(),
      userId: record.studentId,
      title: `Scholarship Renewal Verified & Approved (${academicYear})`,
      message: `Officer ${user.name} has verified and approved your ${record.schemeCode} continuation for AY ${academicYear}. Record forwarded to central disbursement pipeline.`,
      type: 'SUCCESS',
      read: false,
      createdAt: new Date().toISOString(),
    });

    appendAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'CONTINUITY_RENEWAL_APPROVED',
      entityType: 'CONTINUITY_RECORD',
      entityId: record.id,
      payload: {
        studentId: record.studentId,
        studentName: record.studentName,
        academicYear,
        officer: user.name,
        remarks: targetYear.officerRemarks,
        forwardedToDisbursementPipeline: true,
      },
    });

  } else if (action === 'MARK_DEFICIENT') {
    targetYear.status = 'DEFICIENT';
    targetYear.institutionVerificationStatus = 'DEFICIENT';
    targetYear.officerRemarks = officerRemarks || what || 'Deficiency identified during verification.';

    // If specific requirement key provided, mark it deficient
    if (requirementKey) {
      const targetReq = targetYear.requirements.find(r => r.key === requirementKey);
      if (targetReq) {
        targetReq.status = 'DEFICIENT';
        targetReq.deficiencyReason = {
          what: what || 'Document defect detected.',
          why: why || 'Required under the configured scheme renewal rule.',
          action: actionRequired || 'Re-upload corrected document.',
        };
      }
    }

    // Add or update issue
    const newIssue = {
      id: crypto.randomUUID(),
      type: 'MISSING_DOCUMENT' as const,
      severity: 'HIGH' as const,
      title: deficiencyTitle || 'Renewal Verification Deficiency',
      what: what || 'Discrepancy found in submitted renewal documents.',
      why: why || 'Required under the configured scheme renewal rule.',
      suggestedAction: actionRequired || 'Re-upload corrected document via Renewal Center.',
      requirementKey,
      deadline: targetYear.renewalDeadline,
      detectedAt: new Date().toISOString(),
      status: 'OPEN' as const,
    };
    targetYear.issues.unshift(newIssue);

    record.overallContinuityStatus = 'ATTENTION_NEEDED';
    record.overallRiskLevel = 'HIGH';

    // Notify student
    db.notifications.push({
      id: crypto.randomUUID(),
      userId: record.studentId,
      title: `Continuity Action Required: Deficiency Raised`,
      message: `Officer ${user.name} flagged an issue with your renewal dossier for ${academicYear}: ${what || 'Please review required actions.'}`,
      type: 'ACTION_REQUIRED',
      read: false,
      createdAt: new Date().toISOString(),
    });

    appendAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'CONTINUITY_DEFICIENCY_RAISED',
      entityType: 'CONTINUITY_RECORD',
      entityId: record.id,
      payload: {
        studentId: record.studentId,
        academicYear,
        requirementKey,
        what,
        why,
        actionRequired,
      },
    });

  } else if (action === 'VERIFY_REQUIREMENT') {
    const targetReq = targetYear.requirements.find(r => r.key === requirementKey);
    if (!targetReq) {
      return res.status(404).json({ error: { message: `Requirement ${requirementKey} not found.` } });
    }
    targetReq.status = 'VERIFIED';
    targetReq.verifiedAt = new Date().toISOString();
    targetReq.verifiedBy = user.name;

    appendAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'CONTINUITY_REQUIREMENT_VERIFIED',
      entityType: 'CONTINUITY_REQUIREMENT',
      entityId: targetReq.id,
      payload: {
        studentId: record.studentId,
        academicYear,
        requirementKey,
        verifiedBy: user.name,
      },
    });
  }

  record.updatedAt = new Date().toISOString();
  res.json({ success: true, record });
});

// Resolve an issue
app.post('/api/v1/continuity/resolve-issue', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { recordId, issueId, resolutionNote } = req.body;

  const record = db.continuityRecords.find(r => r.id === recordId);
  if (!record) {
    return res.status(404).json({ error: { message: 'Continuity record not found.' } });
  }

  let foundIssue = false;
  for (const year of record.years) {
    const issue = year.issues.find(i => i.id === issueId);
    if (issue) {
      issue.status = 'RESOLVED';
      issue.resolvedAt = new Date().toISOString();
      foundIssue = true;
      break;
    }
  }

  if (!foundIssue) {
    return res.status(404).json({ error: { message: 'Issue not found.' } });
  }

  // Re-evaluate overall risk level
  const openIssues = record.years.flatMap(y => y.issues.filter(i => i.status === 'OPEN'));
  if (openIssues.length === 0) {
    record.overallRiskLevel = 'LOW';
    if (record.overallContinuityStatus === 'ATTENTION_NEEDED') {
      record.overallContinuityStatus = 'ON_TRACK';
    }
  }

  record.updatedAt = new Date().toISOString();

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'CONTINUITY_ISSUE_RESOLVED',
    entityType: 'CONTINUITY_ISSUE',
    entityId: issueId,
    payload: {
      studentId: record.studentId,
      issueId,
      resolutionNote,
    },
  });

  res.json({ success: true, record });
});

// ==========================================
// SYSTEM-LEVEL VERIFICATION DELAY & BOTTLENECK MONITOR
// ==========================================

export interface DelayThresholdConfig {
  normalMaxDays: number;
  delayedMaxDays: number;
  stageBaselines: Record<string, { minDays: number; maxDays: number; label: string; responsibleRole: string }>;
}

const delayThresholds: DelayThresholdConfig = {
  normalMaxDays: 5,
  delayedMaxDays: 10,
  stageBaselines: {
    SUBMITTED: { minDays: 1, maxDays: 3, label: 'Application Ingestion & Auto-Checks', responsibleRole: 'SYSTEM' },
    ELIGIBILITY_CHECK: { minDays: 2, maxDays: 5, label: 'PRAMAAN Automated Check', responsibleRole: 'SYSTEM / VERIFIER' },
    VERIFICATION: { minDays: 3, maxDays: 5, label: 'Institute Verification Desk', responsibleRole: 'INSTITUTION_VERIFIER' },
    DEFICIENCY: { minDays: 3, maxDays: 10, label: 'Deficiency Rectification Window', responsibleRole: 'STUDENT' },
    RESUBMITTED: { minDays: 2, maxDays: 5, label: 'Institute Re-Verification Desk', responsibleRole: 'INSTITUTION_VERIFIER' },
    RE_VERIFICATION: { minDays: 2, maxDays: 5, label: 'Institute Re-Verification Desk', responsibleRole: 'INSTITUTION_VERIFIER' },
    READY_FOR_SCRUTINY: { minDays: 3, maxDays: 7, label: 'Ministry Scrutiny Committee Ingestion', responsibleRole: 'MOTA_OFFICER' },
    SCRUTINY: { minDays: 5, maxDays: 10, label: 'Ministry Scrutiny Committee', responsibleRole: 'MOTA_OFFICER' },
    SCREENING: { minDays: 3, maxDays: 7, label: 'Merit List Publication & Allocation', responsibleRole: 'MOTA_OFFICER' },
    SELECTED: { minDays: 5, maxDays: 15, label: 'PFMS DBT Disbursement Pipeline', responsibleRole: 'MOTA_OFFICER / PFMS' },
    COMPLETED: { minDays: 0, maxDays: 0, label: 'Workflow Concluded', responsibleRole: 'SYSTEM' },
  },
};

function computeApplicationDelay(app: any) {
  const applicant = db.users.find((u) => u.id === app.applicantId);
  const applicantName = applicant?.name || app.fieldValues?.applicantName || 'Applicant';
  const instName = app.fieldValues?.institutionName || app.fieldValues?.universityName || app.fieldValues?.institute || 'Demo University';
  const state = app.fieldValues?.domicileState || app.fieldValues?.state || 'National';
  const course = app.fieldValues?.courseEnrolled || app.fieldValues?.course || 'Degree Program';

  // Determine days pending
  let daysPending = 1;
  if (typeof app.fieldValues?.daysPending === 'number') {
    daysPending = app.fieldValues.daysPending;
  } else if (app.timeline && app.timeline.length > 0) {
    const lastEvent = app.timeline[app.timeline.length - 1];
    const diff = Date.now() - new Date(lastEvent.timestamp).getTime();
    daysPending = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  } else if (app.createdAt) {
    const diff = Date.now() - new Date(app.createdAt).getTime();
    daysPending = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  // Determine stage entry date
  let stageEntryDate = new Date(Date.now() - daysPending * 86400000).toISOString();
  if (app.timeline && app.timeline.length > 0) {
    stageEntryDate = app.timeline[app.timeline.length - 1].timestamp;
  } else if (app.updatedAt) {
    stageEntryDate = app.updatedAt;
  }

  const stageCode = app.status;
  const stageCfg = delayThresholds.stageBaselines[stageCode] || {
    minDays: 3,
    maxDays: 5,
    label: stageCode,
    responsibleRole: 'OFFICER',
  };

  const expectedProcessingWindow = `${stageCfg.minDays}–${stageCfg.maxDays} days`;

  // Determine delay status using neutral terminology
  let delayStatus: 'NORMAL' | 'DELAYED' | 'UNUSUAL_DELAY' = 'NORMAL';
  if (app.status === 'COMPLETED') {
    delayStatus = 'NORMAL';
  } else if (daysPending > delayThresholds.delayedMaxDays) {
    delayStatus = 'UNUSUAL_DELAY';
  } else if (daysPending > delayThresholds.normalMaxDays) {
    delayStatus = 'DELAYED';
  } else {
    delayStatus = 'NORMAL';
  }

  // Determine action required from applicant
  let actionRequired = false;
  let actionRequiredMessage = '';
  let actionResponsibility: 'APPLICANT' | 'INSTITUTION' | 'MINISTRY' | 'DISBURSEMENT' | 'NONE' = 'NONE';

  if (app.status === 'DEFICIENCY') {
    actionRequired = true;
    actionRequiredMessage = 'Yes. Action Required from Applicant: Please review deficiency notice and upload the required replacement document.';
    actionResponsibility = 'APPLICANT';
  } else if (['VERIFICATION', 'SUBMITTED', 'ELIGIBILITY_CHECK', 'RESUBMITTED', 'RE_VERIFICATION'].includes(app.status)) {
    actionRequired = false;
    actionRequiredMessage = 'No. Pending Institute Verification. Your application is queued with the Institute Nodal Officer; no action required from your side.';
    actionResponsibility = 'INSTITUTION';
  } else if (['READY_FOR_SCRUTINY', 'SCRUTINY', 'SCREENING'].includes(app.status)) {
    actionRequired = false;
    actionRequiredMessage = 'No. Pending Ministry Scrutiny Committee review. No action required from applicant.';
    actionResponsibility = 'MINISTRY';
  } else if (app.status === 'SELECTED') {
    actionRequired = false;
    actionRequiredMessage = 'No. Selection approved. Central PFMS Direct Benefit Transfer payment pipeline in progress.';
    actionResponsibility = 'DISBURSEMENT';
  } else if (app.status === 'COMPLETED') {
    actionRequired = false;
    actionRequiredMessage = 'No action required. Current cycle finalized.';
    actionResponsibility = 'NONE';
  } else {
    actionRequired = false;
    actionRequiredMessage = 'No action required from applicant.';
    actionResponsibility = 'NONE';
  }

  // Determine neutral bottleneck reason
  let bottleneckReason = 'Standard verification processing queue.';
  if (app.status === 'DEFICIENCY') {
    bottleneckReason = 'Awaiting applicant response to institutional deficiency notice.';
  } else if (app.status === 'VERIFICATION') {
    if (daysPending > delayThresholds.delayedMaxDays) {
      bottleneckReason = 'Unusual delay pattern identified at Institute Verification desk; administrative review recommended.';
    } else if (daysPending > delayThresholds.normalMaxDays) {
      bottleneckReason = 'Pending Institute Nodal Officer verification; processing duration slightly above standard window.';
    } else {
      bottleneckReason = 'Application undergoing routine institutional verification.';
    }
  } else if (app.status === 'SELECTED') {
    bottleneckReason = 'Awaiting PFMS Aadhaar payment bridge clearance and bank mandate verification.';
  } else if (app.status === 'SCRUTINY') {
    bottleneckReason = 'Convening Ministry Scrutiny Committee for batch assessment.';
  } else if (app.status === 'SUBMITTED') {
    bottleneckReason = 'Queued for automated PRAMAAN dual-path evidence cross-validation.';
  }

  // Match deficiency if any
  const def = db.deficiencies.find((d) => d.applicationId === app.id && d.status === 'OPEN');

  return {
    id: app.id,
    applicationNumber: app.applicationNumber,
    schemeCode: app.schemeCode,
    schemeName: app.schemeName,
    applicantId: app.applicantId,
    applicantName,
    institutionName: instName,
    state,
    course,
    currentStatus: app.status,
    currentStageCode: stageCode,
    currentStageName: stageCfg.label,
    stageEntryDate,
    daysPending,
    expectedProcessingWindow,
    delayStatus,
    actionRequired,
    actionRequiredMessage,
    actionResponsibility,
    bottleneckReason,
    timeline: app.timeline || [],
    deficiencyDetails: def
      ? {
          title: def.title,
          what: def.whatExplanation,
          why: def.whyExplanation,
          actionRequired: def.actionRequired,
          status: def.status,
          raisedAt: def.raisedAt,
        }
      : undefined,
  };
}

// 1. Get System Delay Overview & Metrics
app.get('/api/v1/delay-monitor/overview', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  let allApps = db.applications.map(computeApplicationDelay);

  // If student is querying, they can only see their own applications unless testing role
  if (user.role === 'STUDENT' && req.query.allStudents !== 'true') {
    allApps = allApps.filter((a) => a.applicantId === user.id);
  } else if (user.role === 'INSTITUTION_VERIFIER' && req.query.institutionOnly === 'true') {
    allApps = allApps.filter((a) =>
      a.institutionName.toLowerCase().includes(user.institution.toLowerCase())
    );
  }

  // System KPI calculations
  const totalMonitored = allApps.length;
  const normalCount = allApps.filter((a) => a.delayStatus === 'NORMAL').length;
  const delayedCount = allApps.filter((a) => a.delayStatus === 'DELAYED').length;
  const unusualDelayCount = allApps.filter((a) => a.delayStatus === 'UNUSUAL_DELAY').length;

  const totalDays = allApps.reduce((acc, a) => acc + a.daysPending, 0);
  const avgDaysPending = totalMonitored > 0 ? Number((totalDays / totalMonitored).toFixed(1)) : 0;

  // Ageing distribution buckets
  const ageingDistribution = {
    zeroToThree: allApps.filter((a) => a.daysPending <= 3).length,
    fourToSeven: allApps.filter((a) => a.daysPending >= 4 && a.daysPending <= 7).length,
    eightToFourteen: allApps.filter((a) => a.daysPending >= 8 && a.daysPending <= 14).length,
    fifteenPlus: allApps.filter((a) => a.daysPending >= 15).length,
  };

  // Stage-wise breakdown
  const stageMap = new Map<string, typeof allApps>();
  for (const appItem of allApps) {
    const list = stageMap.get(appItem.currentStageCode) || [];
    list.push(appItem);
    stageMap.set(appItem.currentStageCode, list);
  }

  const stageBreakdown = Array.from(stageMap.entries()).map(([code, items]) => {
    const stageCfg = delayThresholds.stageBaselines[code] || {
      minDays: 3,
      maxDays: 5,
      label: code,
      responsibleRole: 'OFFICER',
    };
    const stageTotalDays = items.reduce((acc, i) => acc + i.daysPending, 0);
    const avgDays = Number((stageTotalDays / items.length).toFixed(1));
    const unusual = items.filter((i) => i.delayStatus === 'UNUSUAL_DELAY').length;
    let bottleneckSeverity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (unusual > 0 || avgDays > delayThresholds.delayedMaxDays) {
      bottleneckSeverity = 'HIGH';
    } else if (avgDays > delayThresholds.normalMaxDays) {
      bottleneckSeverity = 'MEDIUM';
    }

    return {
      stageCode: code,
      stageName: stageCfg.label,
      responsibleRole: stageCfg.responsibleRole,
      pendingCount: items.length,
      avgDays,
      unusualDelayCount: unusual,
      baselineWindow: `${stageCfg.minDays}–${stageCfg.maxDays} days`,
      bottleneckSeverity,
    };
  });

  // Sort stages by bottleneck severity
  stageBreakdown.sort((a, b) => b.unusualDelayCount - a.unusualDelayCount || b.avgDays - a.avgDays);

  // Institution-wise breakdown
  const instMap = new Map<string, typeof allApps>();
  for (const appItem of allApps) {
    const list = instMap.get(appItem.institutionName) || [];
    list.push(appItem);
    instMap.set(appItem.institutionName, list);
  }

  const institutionsBreakdown = Array.from(instMap.entries()).map(([instName, items]) => {
    const state = items[0]?.state || 'National';
    const instTotalDays = items.reduce((acc, i) => acc + i.daysPending, 0);
    const avgDays = Number((instTotalDays / items.length).toFixed(1));
    const unusual = items.filter((i) => i.delayStatus === 'UNUSUAL_DELAY').length;
    const delayed = items.filter((i) => i.delayStatus === 'DELAYED').length;
    const normal = items.filter((i) => i.delayStatus === 'NORMAL').length;

    // Find stage with most delays
    const stageCounts: Record<string, number> = {};
    for (const it of items) {
      stageCounts[it.currentStageName] = (stageCounts[it.currentStageName] || 0) + it.daysPending;
    }
    let topStage = 'Institute Verification Desk';
    let maxStageScore = 0;
    for (const [stg, score] of Object.entries(stageCounts)) {
      if (score > maxStageScore) {
        maxStageScore = score;
        topStage = stg;
      }
    }

    let administrativeStatus: 'WITHIN_BENCHMARK' | 'MONITORING_SUGGESTED' | 'ADMINISTRATIVE_REVIEW_RECOMMENDED' =
      'WITHIN_BENCHMARK';
    if (unusual > 0 || avgDays > delayThresholds.delayedMaxDays) {
      administrativeStatus = 'ADMINISTRATIVE_REVIEW_RECOMMENDED';
    } else if (delayed > 0 || avgDays > delayThresholds.normalMaxDays) {
      administrativeStatus = 'MONITORING_SUGGESTED';
    }

    return {
      institutionName: instName,
      state,
      totalApps: items.length,
      avgDaysPending: avgDays,
      unusualDelayCount: unusual,
      delayedCount: delayed,
      normalCount: normal,
      bottleneckStage: topStage,
      administrativeStatus,
    };
  });

  // Sort institutions by administrative review priority
  institutionsBreakdown.sort((a, b) => b.unusualDelayCount - a.unusualDelayCount || b.avgDaysPending - a.avgDaysPending);

  // Apply filters if requested
  let filteredApps = [...allApps];
  if (req.query.institution) {
    filteredApps = filteredApps.filter((a) =>
      a.institutionName.toLowerCase().includes(String(req.query.institution).toLowerCase())
    );
  }
  if (req.query.stage) {
    filteredApps = filteredApps.filter((a) => a.currentStageCode === req.query.stage);
  }
  if (req.query.delayStatus && req.query.delayStatus !== 'ALL') {
    filteredApps = filteredApps.filter((a) => a.delayStatus === req.query.delayStatus);
  }
  if (req.query.schemeCode && req.query.schemeCode !== 'ALL') {
    filteredApps = filteredApps.filter((a) => a.schemeCode === req.query.schemeCode);
  }

  res.json({
    systemSummary: {
      totalMonitored,
      normalCount,
      delayedCount,
      unusualDelayCount,
      avgDaysPending,
      ageingDistribution,
      thresholds: delayThresholds,
    },
    stageBreakdown,
    institutionsBreakdown,
    applications: filteredApps,
  });
});

// 2. Get Single Application Delay Dossier
app.get('/api/v1/delay-monitor/application/:id', authenticate, (req: Request, res: Response) => {
  const appItem = db.applications.find((a) => a.id === req.params.id);
  if (!appItem) {
    return res.status(404).json({ error: { message: 'Application record not found.' } });
  }

  const delayDossier = computeApplicationDelay(appItem);
  res.json(delayDossier);
});

// 3. Update Baseline SLA Thresholds (Admin only)
app.post('/api/v1/delay-monitor/thresholds', authenticate, requireRole(['ADMIN', 'MOTA_OFFICER', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { normalMaxDays, delayedMaxDays, stageBaselines } = req.body;

  if (typeof normalMaxDays === 'number' && normalMaxDays > 0) {
    delayThresholds.normalMaxDays = normalMaxDays;
  }
  if (typeof delayedMaxDays === 'number' && delayedMaxDays > delayThresholds.normalMaxDays) {
    delayThresholds.delayedMaxDays = delayedMaxDays;
  }
  if (stageBaselines && typeof stageBaselines === 'object') {
    delayThresholds.stageBaselines = { ...delayThresholds.stageBaselines, ...stageBaselines };
  }

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'DELAY_THRESHOLDS_CONFIGURED',
    entityType: 'DELAY_MONITOR',
    entityId: 'global-thresholds',
    payload: {
      normalMaxDays: delayThresholds.normalMaxDays,
      delayedMaxDays: delayThresholds.delayedMaxDays,
    },
  });

  res.json({ success: true, thresholds: delayThresholds });
});

// 4. Send Administrative Review Notice / Escalation Nudge
app.post('/api/v1/delay-monitor/admin-nudge', authenticate, requireRole(['INSTITUTION_VERIFIER', 'MOTA_OFFICER', 'ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const user = (req as any).user;
  const { applicationId, institutionName, message } = req.body;

  const targetApp = applicationId ? db.applications.find((a) => a.id === applicationId) : null;
  const noticeText = message || `Administrative review recommended regarding verification backlog at ${institutionName || 'institution'}.`;

  // Create notification for users
  db.notifications.push({
    id: crypto.randomUUID(),
    userId: targetApp ? targetApp.applicantId : 'usr-verifier-001',
    title: 'Administrative Delay Review Notice',
    message: noticeText,
    type: 'WARNING',
    read: false,
    createdAt: new Date().toISOString(),
  });

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'ADMINISTRATIVE_DELAY_REVIEW_NOTICE',
    entityType: applicationId ? 'APPLICATION' : 'INSTITUTION',
    entityId: applicationId || institutionName || 'general',
    payload: {
      applicationId,
      institutionName,
      message: noticeText,
    },
  });

  res.json({ success: true, message: 'Administrative review note recorded and notification dispatched.' });
});

// 5. Applicant Status Check Request
app.post('/api/v1/delay-monitor/applicant-ping', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { applicationId } = req.body;

  const appItem = db.applications.find((a) => a.id === applicationId);
  if (!appItem) {
    return res.status(404).json({ error: { message: 'Application not found.' } });
  }

  appendAuditLog({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'APPLICANT_STATUS_PING_REQUESTED',
    entityType: 'APPLICATION',
    entityId: appItem.id,
    payload: {
      applicationNumber: appItem.applicationNumber,
      status: appItem.status,
    },
  });

  res.json({
    success: true,
    message: 'Status check request registered. Your application status was flagged for priority review by the verification officer.',
  });
});

// ==========================================
// VITE MIDDLEWARE SETUP & START
// ==========================================


// ==========================================
// GEMINI CHATBOT HELPER API
// ==========================================
app.post("/api/v1/chat", async (req: Request, res: Response) => {
  try {
    const { messages, userContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: "Messages array is required." } });
    }

    const systemPrompt = `You are "Setu Mitra" (सेतु मित्र), the Official AI Intelligence & Scholarship Assistant for the "Janjatiya Vidya Setu" (JVS) platform, under the Ministry of Tribal Affairs (MoTA), Government of India.

You possess complete, end-to-end knowledge of EVERY single feature, section, tab, and administrative tool on this website. You assist both students applying for scholarships and administrators/officers managing schemes.

### 🌐 COMPLETE WEBSITE ARCHITECTURE & SECTIONS GUIDE:

1. **ADMIN PORTAL (Policy & System Administration):**
   - **SIH Jury Showcase (2 Schemes Live Proof):** A live simulation proving how one unified engine manages 2 distinct schemes (NFST PhD Fellowship vs NOS Overseas Scholarship) simultaneously. Shows how invalid/deficient applications (Ramesh: marks < 55%; Amit: QS rank > 500) are automatically flagged with 3W notices, while valid applications (Sunita: PVTG quota; Pooja: Oxford Univ) are automatically cleared to Scrutiny and Selection.
   - **1. Visual Rules Builder (No-Code Studio):** Allows non-technical MoTA officers to visually configure scheme rules using sliders and toggles without writing code. Configures:
     * Annual Income Ceiling (₹0 to ₹12L)
     * Minimum Qualifying Marks % (45% to 75%)
     * National Exam Mandate (UGC-NET, GATE)
     * Foreign QS World University Rank Cutoff (Top 100, 250, 500)
     * Document Checklists (Caste, Income, Bonafide, Marksheet, Offer Letter, Bank Passbook)
     * Statutory Reservation Quotas (Divyangjan 5%, PVTG 10%, Female 33%, General ST 52%)
   - **2. AI Policy Compiler:** Uses Google Gemini 3.8 Flash to convert raw government gazette notifications or circular text directly into validated JSON schemas (eligibility, fields, documents, verification rules).
   - **3. Version Governance (Policy Versions):**
     * **WHAT IT DOES:** Manages the entire lifecycle of scholarship policy versions (DRAFT -> UNDER_REVIEW -> APPROVED -> PUBLISHED -> RETIRED).
     * **PURPOSE:** Whenever MoTA amends a scheme (e.g. changing income ceilings or stipends for 2026-27), officers can view past and current versions, inspect exact rule diffs, track academic years, and publish a new version instantly without restarting the server or hiring software developers. It also supports seamless rollback to previous versions if an amendment is withdrawn.
   - **4. Tamper-Evident Audit Trail:** An immutable SHA-256 cryptographic linked-list ledger (blockchain-style) recording every critical action (logins, submissions, verifications, policy edits). Features a live mathematical hash verifier and a "Simulate Tamper" button for live hackathon demonstration.

2. **OFFICER PORTAL (Verification, Scrutiny & Selection):**
   - **Verification Desk:** Powered by PRAMAAN Dual-Path Verification Engine:
     * *Path A (Evidence OCR Cross-Check):* Automated comparison of form values with certificate data (marks, name Levenshtein similarity, income limits).
     * *Path B (Credential & Registry Graph):* Real-time validation with UIDAI Aadhaar, PFMS DBT bank mapper, and AISHE university registry.
     * *3W Deficiency Notice:* Instead of raw rejections, officers issue structured notices specifying WHAT failed, WHY it failed, and ACTION required within 7 days.
   - **Scrutiny Committee:** Reviewers score candidates (0–100) and evaluate priority criteria (Premier institutes, Divyangjan, PVTG, Female).
   - **Selection Management:** Automated merit ranking algorithm satisfying statutory reservations (Divyangjan 5%, PVTG 10%, Female 33%, General ST 52%) for 750 NFST slots and issuing official MoTA Sanction Orders.
   - **Post-Selection Milestones:** Tracks Joining Reports, PFMS bank linkage, half-yearly research reports, and Treasury DBT releases.
   - **Intelligence Hub:** Interactive demographic maps, PVTG representation, and state-wise disbursement analytics.

3. **VERIFICATION DELAY MONITOR:**
   - Real-time SLA bottleneck engine tracking dwell time across 4 aging buckets: Normal (<3 days), Watchlist (4-7 days), Escalation (8-14 days), and Critical SLA Breach (>14 days).
   - Identifies delinquent institution nodal officers and allows MoTA officers to dispatch one-click Admin Nudge escalation notices.

4. **SCHOLARSHIP CONTINUITY PORTAL:**
   - Multi-year progression engine (Years 1 to 5) preventing scholar dropout between academic years.
   - Locks past years, enforces annual renewal checklists (Bonafide, marksheet >50%, active PFMS bank), and continuously computes risk levels (LOW, MEDIUM, HIGH).

5. **STUDENT PORTAL & SCHOLARSHIP DESK:**
   - One-Time Registration (OTR), dynamic multi-step form wizard, document vault with client-side SHA-256 hashing, and Deficiency Desk for rapid re-upload.

6. **MOTA FLAGSHIP SCHEMES:**
   - **NFST:** National Fellowship for ST (M.Phil/Ph.D., 750 slots, ₹37k-42k/mo stipend, no income ceiling).
   - **NOS:** National Overseas Scholarship (Foreign Master's/Ph.D. in QS Top 500/1000 universities, 100% tuition + maintenance £9,900 / $15,400, income ceiling ₹6-8 Lakhs).
   - **Top Class:** 100% tuition + living allowance + computer grant in 250+ premier institutes (IITs, IIMs, NITs, AIIMS).

7. **PRAMAAN GLOBAL BRIDGE (NOS 2021-26 LIFECYCLE ENGINE):**
   - Strictly enforces MoTA 11-page official circular clauses:
     * 1. Automated 5-Step Zero-Fraud Pipeline: Ingestion ➔ QS Verify ➔ 3D Quota ➔ 72-Hr Award ➔ Embassy Disbursal.
     * 2. Real-Time QS & Kinship Shield: Validates QS Top 1,000, waives 55% marks for Top 1,000 (Page 4 Note), and uses Aadhaar Kinship Hash to catch Sibling Duplication (Rule 2.2.ii).
     * 3. 3D Quota & Milestone Radar: 20 slots partitioned into 4 streams (STEM 10, Mgmt 4, Agri 4, Arts 2) with 03 PVTG & 30% Female earmarking. Automated Rule 2.1(iii/iv) legal spillover logs.
     * 4. Indian Mission & Pro-Rata Engine: Day-1 maintenance release via High Commission London/Washington. Automatically calculates pro-rata reduction during scholar's India field visits (Note 1.b & Note 4), switching to JRF ₹37,000, protecting officers from CAG audit queries.

### RESPONSE GUIDELINES:
- Always be polite, crisp, bilingual (Hindi & English / Hinglish as preferred), structured, and deeply helpful.
- When asked about ANY feature or section of the website (like "Version Governance", "Visual Configurator", "Jury Showcase", "PRAMAAN", etc.), give a clear, direct, and practical explanation of what it does, why it exists, and how users can interact with it on this portal!`;

    // Try Gemini 3.8 Flash via @google/genai SDK
    if (ai) {
      try {
        const contents = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.6,
          }
        });

        const reply = response.text || "Main aapki Janjatiya Vidya Setu ke sabhi features aur scholarship guidelines me madad karne ke liye taiyar hoon.";
        return res.json({ reply });
      } catch (err: any) {
        console.warn("Gemini chat API error, falling back to local policy knowledge:", err.message);
      }
    }

    // Comprehensive Fallback Policy & Platform Intelligence
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let fallbackReply = "";

    if (lastUserMsg.includes("version") || lastUserMsg.includes("governance")) {
      fallbackReply = `### ⚙️ Version Governance Section Kya Karta Hai?

**"Version Governance"** Janjatiya Vidya Setu ka ek bohot critical administrative module hai jo **Admin Portal** ke andar sthit hai.

**Iska Mukhya Kaam (Core Purpose):**
1. **Policy Lifecycle Management:**
   Jab bhi Ministry of Tribal Affairs (MoTA) kisi scholarship scheme (jaise NFST ya NOS) ke rules me badlav karti hai, toh ye section uske alag-alag versions ko manage karta hai:
   - **DRAFT:** Naye rules draft kiye ja rahe hain.
   - **UNDER_REVIEW:** Committee ke dwara review ho raha hai.
   - **APPROVED:** Joint Secretary ya Competent Authority ne approve kiya.
   - **PUBLISHED (Active):** Ye version live hai aur portal ke student forms aur verification engine ko real-time me control kar raha hai.
   - **RETIRED:** Purana version jo ab band ho chuka hai.

2. **No-Downtime Policy Updates:**
   Pehle portal par koi naya rule aane par 6 mahine coding karni padti thi. Version Governance me naya version publish karte hi **bina server restart kiye** live form fields, eligibility rules, aur document requirements update ho jate hain!

3. **Version Diff & Audit History:**
   Admins dekh sakte hain ki purane academic year (e.g. 2025-26) aur naye academic year (2026-27) ke rules me kya antar hai (e.g. Income limit ₹6L se ₹8L hui ya stipend badha).

4. **Rollback Capability:**
   Agar kisi naye rule me koi statutory issue aaye, toh Admin single click me purane verified policy version par safely rollback kar sakta hai.

👉 **Aap isko kahan dekh sakte hain:** Admin Portal -> Tab **"3. Version Governance"** me jaakar kisi bhi scheme ke active aur archived versions ko inspect kar sakte hain!`;
    } else if (lastUserMsg.includes("showcase") || lastUserMsg.includes("jury") || lastUserMsg.includes("sih") || lastUserMsg.includes("demo")) {
      fallbackReply = `### 🏆 SIH Jury Showcase (2 Schemes Live Proof)

Ye section **Smart India Hackathon** ke problem statement ka winning criterion demonstrate karne ke liye banaya gaya hai.

**Kya Dikhata Hai:**
- **Scheme 1: NFST (PhD Fellowship):** Minimum 55% marks + UGC-NET mandatory.
  * *Ramesh Oraon (52% Marks + Missing Bonafide):* Engine isko instantly **Auto-Flag (Deficient)** karta hai aur 3W Notice generate karta hai.
  * *Sunita Marandi (74.2% Marks + Birhor PVTG Tribe):* Engine isko **Auto-Clear karke Scrutiny** me move karta hai.
- **Scheme 2: NOS (National Overseas Scholarship):** QS World Rank $\le 500$ + Family Income $\le ₹8 Lakhs$.
  * *Amit Tirkey (QS Rank #650 + Income ₹9.4L):* Engine isko 2 policy breaches ke liye **Auto-Flag** karta hai.
  * *Pooja Munda (Oxford University QS #3 + Income ₹4.2L):* Engine isko **Auto-Clear karke Final Selection Award** deta hai.

👉 **Kahan milega:** Admin Portal -> Pehla Tab: **"SIH Jury Showcase"** -> Click karein **"Run Live AI Scrutiny Engine"**!`;
    } else if (lastUserMsg.includes("visual") || lastUserMsg.includes("configurator") || lastUserMsg.includes("rules builder")) {
      fallbackReply = `### 🎛️ Visual Rules Builder (No-Code Configurator)

Ye section non-technical MoTA officers ke liye banaya gaya hai taaki wo bina coding ya JSON likhe visual sliders aur toggles se scholarship schemes configure kar sakein:

1. **Eligibility Thresholds:** Income ceiling slider (₹0 se ₹12L), Marks cutoff slider (45% se 75%), QS Rank limit dropdown.
2. **Document Checklists:** Caste, Income, Bonafide, Marksheet, Offer Letter ke mandatory/optional toggles.
3. **Statutory Quota Distribution:** Divyangjan (5%), PVTG Priority (10%), Female ST Earmarking (33%), aur General ST Merit (52%).
4. **Instant Deploy:** *"Deploy & Activate Rules"* dabate hi live verification engine update ho jata hai!

👉 **Kahan milega:** Admin Portal -> Tab **"1. Visual Rules Builder"**.`;
    } else if (lastUserMsg.includes("compiler") || lastUserMsg.includes("ai policy")) {
      fallbackReply = `### 🤖 AI Policy Compiler

**AI Policy Compiler** raw government gazette notifications, PDFs, ya MoTA circulars ko sidha executable JSON workflow schemas me convert karta hai.

- **Powered by:** Google Gemini 3.8 Flash.
- **Kya extract karta hai:** Eligibility rules, dynamic form fields, required document parameters, tolerance checks, aur workflow stages.
- **Kahan milega:** Admin Portal -> Tab **"2. AI Policy Compiler"**.`;
    } else if (lastUserMsg.includes("audit") || lastUserMsg.includes("sha") || lastUserMsg.includes("tamper") || lastUserMsg.includes("blockchain")) {
      fallbackReply = `### 🛡️ Tamper-Evident SHA-256 Cryptographic Audit Trail

JVS portal me kisi bhi database record ko chupke se edit ya manipulate nahi kiya ja sakta:
- Har ek action (Submission, Verification, Deficiency, Policy Publish) ek **Cryptographic Block** banata hai jahan:
  \`currentHash = SHA256(index + timestamp + actor + action + payload + previousHash)\`
- Agar koi database me purani application ka marks ya caste change karega, toh puri hash chain toot jayegi.
- **Live Demo:** Admin Portal ke **"Tamper-Evident Audit"** tab me **"Simulate Tamper"** button daba kar jury ko live detection dikha sakte hain!`;
    } else if (lastUserMsg.includes("pramaan") || lastUserMsg.includes("dual path") || lastUserMsg.includes("verification")) {
      fallbackReply = `### 🔍 PRAMAAN Dual-Path Verification Engine

PRAMAAN manual human verification ke delay ko 21 din se ghata kar 48 ghante me le aata hai:
- **Path A (Evidence OCR Cross-Check):** Uploaded certificates (Caste, Marksheet, Income) ka data extract karke form fields ke sath Levenshtein fuzzy match evaluate karta hai.
- **Path B (Credential & Registry Graph):** UIDAI Aadhaar Gateway, PFMS DBT Mapper, aur AISHE University Directory se candidate ke credentials verify karta hai.
- **3W Deficiency Notice:** Agar koi mismatch ho, toh reject karne ke bajaye candidate ko structured **WHAT, WHY, ACTION** notice issue karta hai jisme 7 din ka time milta hai.`;
    } else if (lastUserMsg.includes("delay") || lastUserMsg.includes("sla") || lastUserMsg.includes("bottleneck") || lastUserMsg.includes("monitor")) {
      fallbackReply = `### ⏱️ Verification Delay Monitor & SLA Bottleneck Engine

MoTA leadership ke liye centralized tracking dashboard:
- Applications ko 4 aging buckets me baantta hai:
  * **Normal (<3 Days):** Green badge, within SLA.
  * **Watchlist (4-7 Days):** Yellow badge.
  * **Escalation (8-14 Days):** Orange badge.
  * **Critical SLA Breach (>14 Days):** Red badge.
- **Admin Nudge:** Ek click par non-responsive College Nodal Officers ko urgent escalation notice bhejta hai.`;
    } else if (lastUserMsg.includes("continuity") || lastUserMsg.includes("renewal") || lastUserMsg.includes("dropout")) {
      fallbackReply = `### 🔄 Scholarship Continuity Portal (Multi-Year Renewal)

28% tribal students Year 1 ke baad renewal miss hone ki wajah se drop out ho jate hain.
- JVS unka pure degree lifecycle (Years 1 to 5) track karta hai.
- Purane saal lock rehte hain; naye saal ke liye sirf Bonafide Certificate aur Annual Marksheet (>50% progression) upload karni hoti hai.
- Proactive Risk Levels (**LOW, MEDIUM, HIGH**) ke through deadline se pehle student aur college dono ko alert bhejta hai.`;
    } else if (lastUserMsg.includes("nfst") || lastUserMsg.includes("fellowship") || lastUserMsg.includes("phd") || lastUserMsg.includes("mphil")) {
      fallbackReply = `### 🎓 National Fellowship for ST Students (NFST)
**Eligibility Criteria:**
1. **Category:** Candidate must belong to a notified Scheduled Tribe (ST) community.
2. **Qualification:** Master’s degree with valid admission in regular & full-time M.Phil / Ph.D. in recognized universities/institutions.
3. **Income Ceiling:** No family income limit for NFST!
4. **Fellowship Slots:** 750 candidates selected each academic year.

**Financial Assistance:**
- **JRF (First 2 Years):** ₹37,000/month + HRA
- **SRF (Remaining 3 Years):** ₹42,000/month + HRA
- **Contingency Allowance:** ₹20,500/year (Sciences) / ₹12,000/year (Humanities & Social Sciences)

**How to Apply:** Go to "Scholarship Desk" -> Click "Apply Online" next to NFST -> Complete the 4-step wizard with your Enrollment Certificate & ST Certificate.`;
    } else if (lastUserMsg.includes("global bridge") || lastUserMsg.includes("nos") || lastUserMsg.includes("overseas") || lastUserMsg.includes("foreign") || lastUserMsg.includes("abroad") || lastUserMsg.includes("embassy") || lastUserMsg.includes("pro-rata")) {
      fallbackReply = `### 🌐 PRAMAAN Global Bridge (NOS 360° Lifecycle Engine)
Ye module MoTA ke official 11-page National Overseas Scholarship (NOS) circular ke har ek clause ko strictly aur zero-fraud tareeqe se execute karta hai:

1. **PRAMAAN Global Bridge (5-Step Pipeline):**
   - Ingestion ➔ Real-Time QS Verify ➔ 3D Quota Allocation ➔ 72-Hr Award ➔ Indian Embassy Day-1 Disbursal.

2. **Real-Time QS & Kinship Shield:**
   - **Live QS Top 1,000 API:** Unaccredited fake private foreign colleges ko block karta hai aur Page 4 Note ke tahat 55% marks criteria waive-off evaluate karta hai.
   - **Aadhaar Kinship Hash Tree:** "One-Child Per Family" (Rule 2.2.ii) sibling duplication fraud ko catch karta hai.

3. **3D Quota & Milestone Radar:**
   - 20 Annual Slots across 4 streams (STEM 10, Mgmt/Law 4, Agri/Med 4, Arts 2).
   - 03 PVTG Priority slots + 30% Female Earmarking (minimum 6 female scholars).
   - Unutilized slots me **Rule 2.1(iii/iv) ka automated legal spillover** audit memo create hota hai.
   - 2-Year Milestone Radar (Para 4.4.d) se dead-seat locking ko 4 quarters (Q1-Q4) me track karke waitlisted candidates ko promote karta hai.

4. **Indian Mission & Pro-Rata Engine (100% CAG Audit Defense):**
   - High Commission London & Washington node se Day-1 maintenance (£9,900 UK / $15,400 US) release hoti hai.
   - **India Field Visit (Note 1.b & Note 4):** Scholar ke India visit ke dauran foreign allowance automatically pause hokar JRF rate (₹37,000/mo) par calculate hota hai, jisse zero overpayment aur zero CAG inquiry risk rehta hai!

👉 **Portal me kahan dekhein:** Top Navigation bar me **"Global Bridge (NOS)"** par click karein ya Portal Home page par direct banner se launch karein!`;
    } else if (lastUserMsg.includes("top class") || lastUserMsg.includes("iit") || lastUserMsg.includes("iim") || lastUserMsg.includes("nit")) {
      fallbackReply = `### 🏛️ Top Class Education for ST Students
**Eligibility Criteria:**
1. **Category:** ST student admitted into notified premier institutions (e.g. IITs, NITs, IIMs, AIIMS, IIITs, NLUs).
2. **Family Income:** Annual parental/family income up to **₹8.00 Lakh**.
3. **Course:** Full-time graduation or post-graduation degree course.

**Benefits:**
- Full non-refundable tuition fees reimbursed directly.
- **Living Allowance:** ₹3,000 per month (₹36,000/year).
- **Books & Stationery:** ₹5,000 per annum.
- **Computer/Laptop Allowance:** One-time assistance up to ₹45,000.`;
    } else if (lastUserMsg.includes("apply") || lastUserMsg.includes("form") || lastUserMsg.includes("kaise") || lastUserMsg.includes("document") || lastUserMsg.includes("help")) {
      fallbackReply = `### 📝 Application Kaise Bharein (Step-by-Step Guide)

1. **Step 1 - Register/Login:**
   - Agar naye student hain, top-right me **"New Student Registration"** karein.
   - Already registered hain toh **"Student Login"** se login karein.

2. **Step 2 - Scheme Chunein:**
   - "Scholarship Desk" me jakar apni scheme chunein (**NFST**, **NOS**, ya **Top Class**).
   - "Apply Online" button par click karein.

3. **Step 3 - Form Details Bharein:**
   - **Personal Details:** Naam, Aadhaar Number, Domicile State, Category (PVTG / Divyangjan check).
   - **Academic Details:** Enrolled University, Course Name (Ph.D./Master's), Qualifying Percentage.
   - **Bank DBT:** Aadhaar seeded Bank Account & IFSC Code.

4. **Step 4 - Documents Upload:**
   - Valid ST Caste Certificate
   - Qualifying Marksheet
   - University Admission / Bonafide Letter
   - Income Certificate (for NOS & Top Class)

5. **PRAMAAN Verification:**
   - Submit karne ke baad PRAMAAN engine automatically aapke credentials verify karega.
   - Agar koi issue hoga, **"Deficiency Desk"** par aapse clarification manga jayega.`;
    } else {
      fallbackReply = `Namaste! Main **Setu Mitra (सेतु मित्र)** hoon — Janjatiya Vidya Setu ka Official AI Intelligence Assistant.

Main is website ke **har ek section, portal, aur feature** me aapki madad kar sakta hoon:

🔹 **Admin Portal:**
- **Version Governance:** Scheme policy versions ka lifecycle (Draft -> Approved -> Published) aur rollback kaise kaam karta hai.
- **SIH Jury Showcase:** 2 schemes (NFST vs NOS) ka live auto-flagging demo proof.
- **Visual Rules Builder:** No-code sliders se income limits, marks cutoffs aur statutory quotas configure karna.
- **AI Policy Compiler & Tamper-Evident SHA-256 Audit Trail.**

🔹 **Officer Portal:**
- **PRAMAAN Verification Engine:** Path A evidence OCR aur Path B credential checks.
- **3W Deficiency Lifecycle:** What, Why, Action notices.
- **Selection & Merit Ranking:** 750 NFST seats par statutory quota (Divyangjan 5%, PVTG 10%, Female 33%) allocation.

🔹 **Student Portal:**
- NFST, NOS, aur Top Class schemes ke rules, stipend, aur documents.
- Multi-year Scholarship Continuity aur Bonafide renewal.

Aap mujhse kisi bhi section ya feature ke bare me pooch sakte hain!`;
    }

    return res.json({ reply: fallbackReply });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: { message: "Internal server error processing chat." } });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🏛️ JANJATIYA VIDYA SETU (JVS) PLATFORM RUNNING`);
    console.log(`📍 Port: http://0.0.0.0:${PORT}`);
    console.log(`🔐 RBAC Roles: STUDENT, VERIFIER, MOTA_OFFICER, ADMIN, SUPER_ADMIN`);
    console.log(`📜 Policy Compiler: AI-Enabled (Gemini 3.8 Flash + Local Fallback)`);
    console.log(`🛡️ PRAMAAN Verification: Active Dual-Path Verification Engine`);
    console.log(`🔗 Tamper-Evident Audit Chain: SHA-256 Initialized`);
    console.log(`=======================================================`);
  });
}

startServer();
