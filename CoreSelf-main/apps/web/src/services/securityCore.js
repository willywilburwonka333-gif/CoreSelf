import { load, save } from './localStore';
import { saveKeyToCloud } from './cloudStore';
import { currentCoreUser } from './authService';

export const SECURITY_VERSION = 'Genesis 0.2.0';

export const permissionCatalog = [
  {
    id: 'memory.write',
    name: 'Memory Write',
    status: 'Enabled',
    risk: 'Low',
    description: 'Core Self can save memories you create or approve.',
  },
  {
    id: 'cloud.sync',
    name: 'Cloud Sync',
    status: 'Approval Required',
    risk: 'Medium',
    description: 'Pushes or pulls Core data between this device and Firebase.',
  },
  {
    id: 'ai.chat',
    name: 'AI Chat',
    status: 'Enabled',
    risk: 'Medium',
    description: 'Talk screen can send selected context to the secure Vercel AI route.',
  },
  {
    id: 'external.email',
    name: 'External Email',
    status: 'Blocked',
    risk: 'High',
    description: 'Sending email is blocked until tool permissions and approval gates are built.',
  },
  {
    id: 'external.money',
    name: 'Money / Purchases',
    status: 'Blocked',
    risk: 'Critical',
    description: 'Spending money or changing financial accounts always requires explicit human approval.',
  },
  {
    id: 'external.delete',
    name: 'Delete / Destructive Actions',
    status: 'Blocked',
    risk: 'Critical',
    description: 'Deleting files, memories, or external records must pass a confirmation gate.',
  },
];

export const actionPolicies = {
  safe: {
    label: 'Safe',
    allowed: true,
    approval: 'No approval needed',
    examples: ['Read local memory', 'Draft a plan', 'Summarise a project'],
  },
  personalData: {
    label: 'Personal Data',
    allowed: true,
    approval: 'Use signed-in user scope only',
    examples: ['Save memory', 'Sync goals', 'Update Life Graph'],
  },
  cloudWrite: {
    label: 'Cloud Write',
    allowed: true,
    approval: 'Confirm before large syncs',
    examples: ['Push local Core data to Firebase', 'Pull cloud data to this device'],
  },
  externalAction: {
    label: 'External Action',
    allowed: false,
    approval: 'Blocked until integration is explicitly approved',
    examples: ['Send email', 'Post online', 'Create calendar event'],
  },
  dangerous: {
    label: 'Dangerous Action',
    allowed: false,
    approval: 'Always blocked unless a future human approval workflow authorises it',
    examples: ['Delete external files', 'Spend money', 'Change security settings'],
  },
};

export function getSecurityState() {
  const user = currentCoreUser();
  return {
    version: SECURITY_VERSION,
    signedIn: Boolean(user),
    uid: user?.uid || null,
    email: user?.email || null,
    firestorePath: user ? `/users/${user.uid}/core/{store}` : '/users/{uid}/core/{store}',
    rules: 'User scoped: request.auth.uid must match users/{userId}.',
    mode: 'Production AI Backend v1',
  };
}

export function loadAuditLog() {
  return load('auditLog', []);
}

export async function recordAudit({ action, detail = '', level = 'Info', policy = 'safe', engine = 'Production AI Backend' }) {
  const user = currentCoreUser();
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    engine,
    action,
    detail,
    level,
    policy,
    user: user?.email || 'local-user',
    uid: user?.uid || null,
    version: SECURITY_VERSION,
  };
  const next = [entry, ...loadAuditLog()].slice(0, 250);
  save('auditLog', next);
  try { await saveKeyToCloud('auditLog', next); } catch { /* offline safe */ }
  return entry;
}

export async function requireApproval({ action, detail, policy = 'cloudWrite' }) {
  const rule = actionPolicies[policy] || actionPolicies.safe;
  if (!rule.allowed) {
    await recordAudit({ action, detail, policy, level: 'Blocked' });
    return { ok: false, reason: `${rule.label} is blocked by Production AI Backend.` };
  }

  const needsConfirm = policy === 'cloudWrite' || policy === 'dangerous' || policy === 'externalAction';
  if (needsConfirm) {
    const approved = window.confirm(`Core Self Security Gate\n\n${action}\n\n${detail || 'No extra detail.'}\n\nAllow this action?`);
    await recordAudit({
      action,
      detail,
      policy,
      level: approved ? 'Approved' : 'Denied',
    });
    return approved ? { ok: true } : { ok: false, reason: 'Denied by user.' };
  }

  await recordAudit({ action, detail, policy, level: 'Info' });
  return { ok: true };
}

export const productionFirestoreRules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;
