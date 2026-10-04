/**
 * GeoMine Intelligence — API Client
 * Connects the React frontend to the FastAPI backend (port 8000).
 * Falls back gracefully to mock data when the backend is offline.
 */

const BASE = 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Health ──────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/healthz`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Stats ───────────────────────────────────────────────────────────────────

export interface BackendStats {
  documents: number;
  facts: number;
  verified: number;
  auditEvents: number;
  firewallStatus: string;
  criticalConflicts: number;
  warnings: number;
}

export async function fetchStats(): Promise<BackendStats> {
  return apiFetch<BackendStats>('/api/stats');
}

// ── Documents ───────────────────────────────────────────────────────────────

export interface BackendDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  pages: number;
  uploadedAt: string;
  subsidiary: string;
  mine: string;
  period: string;
  status: 'Indexed' | 'Processing' | 'Failed';
  sha256: string;
  factsExtracted: number;
  tablesCount: number;
  contentSnippet: string;
}

export async function fetchDocuments(): Promise<BackendDocument[]> {
  const r = await apiFetch<{ documents: BackendDocument[] }>('/api/documents');
  return r.documents;
}

export async function uploadDocument(file: File): Promise<{
  document: BackendDocument;
  facts: BackendFact[];
  factCount: number;
  inserted: boolean;
  message: string;
}> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/documents/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Facts ───────────────────────────────────────────────────────────────────

export interface BackendFact {
  factId: string;
  docId: string;
  docName: string;
  entity: string;
  subsidiary: string;
  metric: string;
  value: number;
  unit: string;
  period: string;
  confidence: number;
  status: 'Verified' | 'Pending' | 'Warning' | 'Blocked';
  pageNumber: number | null;
  sourceSnippet: string;
  sha256Provenance: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export async function fetchFacts(params?: { doc_id?: string; status?: string }): Promise<BackendFact[]> {
  const qs = new URLSearchParams();
  if (params?.doc_id) qs.set('doc_id', params.doc_id);
  if (params?.status) qs.set('status', params.status);
  const r = await apiFetch<{ facts: BackendFact[] }>(`/api/facts?${qs}`);
  return r.facts;
}

export async function verifyFact(factId: string, verifiedBy?: string): Promise<{
  factId: string;
  status: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
}> {
  return apiFetch(`/api/facts/${factId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ fact_id: factId, verified_by: verifiedBy || 'authorized.user@cmpdi.co.in' }),
  });
}

export async function fetchFactPassport(factId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/api/facts/${factId}/passport`);
}

// ── Firewall ────────────────────────────────────────────────────────────────

export interface FirewallResult {
  status: string;
  findings: Array<{
    ruleId?: string;
    name: string;
    severity: 'CRITICAL' | 'WARNING' | 'PASS';
    category?: string;
    description: string;
    evidence?: string;
    actionRequired?: string;
    targetEntity?: string;
  }>;
  errors: number;
  warnings: number;
}

export async function fetchFirewall(): Promise<FirewallResult> {
  return apiFetch<FirewallResult>('/api/firewall');
}

export async function fetchFirewallSummary(): Promise<{
  status: string;
  totalRules: number;
  critical: number;
  warnings: number;
  passed: number;
}> {
  return apiFetch('/api/firewall/summary');
}

// ── Change Intelligence ──────────────────────────────────────────────────────

export interface ChangeItem {
  entity: string;
  metric: string;
  currentPeriod: string;
  currentValue: number;
  previousPeriod: string;
  previousValue: number;
  unit: string;
  delta: number;
  pctChange: number;
  significance: 'High' | 'Normal' | 'Critical';
  commentary: string;
}

export async function fetchChangeIntelligence(): Promise<ChangeItem[]> {
  const r = await apiFetch<{ changes: ChangeItem[] }>('/api/change-intelligence');
  return r.changes;
}

// ── Parliamentary Copilot ────────────────────────────────────────────────────

export interface ParliamentaryAnswer {
  question: string;
  answer: string;
  groundedFacts: string[];
  confidence: number;
  evidenceSnippets: Array<{ source: string; page: number | null; text: string }>;
}

export async function askParliamentaryQuestion(question: string): Promise<ParliamentaryAnswer> {
  return apiFetch<ParliamentaryAnswer>('/api/parliamentary/answer', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

// ── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  targetId: string;
  details: string;
}

export async function fetchAuditLogs(limit = 50): Promise<AuditEntry[]> {
  const r = await apiFetch<{ logs: AuditEntry[] }>(`/api/audit-logs?limit=${limit}`);
  return r.logs;
}

// ── Ontology ─────────────────────────────────────────────────────────────────

export async function fetchOntology(): Promise<Record<string, unknown>> {
  const r = await apiFetch<{ ontology: Record<string, unknown> }>('/api/ontology');
  return r.ontology;
}
