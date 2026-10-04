export interface DocumentItem {
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
  contentSnippet: string;
  tablesCount: number;
}

export interface FactItem {
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
  pageNumber: number;
  sourceSnippet: string;
  sha256Provenance: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface FirewallRuleResult {
  ruleId: string;
  name: string;
  category: 'Arithmetic' | 'Temporal' | 'Physical Limit' | 'Grade Band';
  severity: 'CRITICAL' | 'WARNING' | 'PASS';
  targetEntity: string;
  description: string;
  evidence: string;
  actionRequired: string;
  status: 'Active' | 'Resolved' | 'Overridden';
}

export interface ChangeAnalysis {
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

export interface ParliamentaryQuery {
  id: string;
  question: string;
  sourceSession: string;
  ministry: string;
  answerDraft: string;
  groundedFacts: string[];
  confidenceScore: number;
  evidenceSnippets: { source: string; page: number; text: string }[];
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  targetId: string;
  details: string;
}
