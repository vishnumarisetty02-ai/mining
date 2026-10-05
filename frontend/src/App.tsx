import { useState, useEffect, useCallback } from 'react';
import { BackendAnimProvider, useAnimSignals } from './BackendAnimContext';
import { AnimatePresence, motion } from 'framer-motion';
import CanvasBackground from './CanvasBackground';
import { Sidebar } from './components/Sidebar';
import type { ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DocumentCenterView } from './components/DocumentCenterView';
import { FactPassportView } from './components/FactPassportView';
import { ConsistencyFirewallView } from './components/ConsistencyFirewallView';
import { ChangeIntelligenceView } from './components/ChangeIntelligenceView';
import { ParliamentaryCopilotView } from './components/ParliamentaryCopilotView';
import { TopicIntelligenceView } from './components/TopicIntelligenceView';
import { MiningOntologyView } from './components/MiningOntologyView';
import { WorkflowView } from './components/WorkflowView';
import { AuditLogView } from './components/AuditLogView';

// ── API client ──────────────────────────────────────────────────────────────
import {
  checkHealth,
  fetchDocuments,
  fetchFacts,
  fetchAuditLogs,
  verifyFact,
  type BackendDocument,
  type BackendFact,
  type AuditEntry,
} from './api/client';

// ── Mock data fallback (used while backend is offline) ──────────────────────
import {
  INITIAL_DOCUMENTS,
  INITIAL_FACTS,
  FIREWALL_RULES,
  CHANGE_INTELLIGENCE,
  PARLIAMENTARY_QUESTIONS,
  AUDIT_LOGS,
} from './data/mockData';
import type { DocumentItem, FactItem, FirewallRuleResult, AuditRecord } from './types';

import './App.css';
import './workflow.css';

// ── Type adapters: backend ↔ frontend ───────────────────────────────────────

function adaptDoc(d: BackendDocument): DocumentItem {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    size: d.size,
    pages: d.pages,
    uploadedAt: d.uploadedAt,
    subsidiary: d.subsidiary,
    mine: d.mine,
    period: d.period,
    status: d.status,
    sha256: d.sha256,
    factsExtracted: d.factsExtracted,
    tablesCount: d.tablesCount,
    contentSnippet: d.contentSnippet,
  };
}

function adaptFact(f: BackendFact): FactItem {
  return {
    factId: f.factId,
    docId: f.docId,
    docName: f.docName,
    entity: f.entity,
    subsidiary: f.subsidiary,
    metric: f.metric,
    value: f.value,
    unit: f.unit,
    period: f.period,
    confidence: f.confidence,
    status: f.status as FactItem['status'],
    pageNumber: f.pageNumber ?? 0,
    sourceSnippet: f.sourceSnippet,
    sha256Provenance: f.sha256Provenance,
    verifiedBy: f.verifiedBy ?? undefined,
    verifiedAt: f.verifiedAt ?? undefined,
  };
}

function adaptAudit(a: AuditEntry): AuditRecord {
  return {
    id: a.id,
    timestamp: a.timestamp,
    user: a.user,
    action: a.action,
    targetId: a.targetId,
    details: a.details,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════════════════

// Inner component so it can consume the context
function AppInner() {
  const { alertColorRgb, backendOnline: animOnline } = useAnimSignals();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // App state — starts with mock data, replaced by live data when backend is up
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [facts, setFacts] = useState<FactItem[]>(INITIAL_FACTS);
  const [firewallRules] = useState<FirewallRuleResult[]>(FIREWALL_RULES);
  const [selectedFact, setSelectedFact] = useState<FactItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(AUDIT_LOGS);

  // ── Live data loader ──────────────────────────────────────────────────────

  const loadLiveData = useCallback(async () => {
    try {
      const [liveDocs, liveFacts, liveAudits] = await Promise.all([
        fetchDocuments(),
        fetchFacts(),
        fetchAuditLogs(50),
      ]);

      if (liveDocs.length > 0) setDocuments(liveDocs.map(adaptDoc));
      if (liveFacts.length > 0) setFacts(liveFacts.map(adaptFact));
      if (liveAudits.length > 0) setAuditLogs(liveAudits.map(adaptAudit));
    } catch {
      // backend available but fetch failed — keep existing state
    }
  }, []);

  // ── Poll backend health ──────────────────────────────────────────────────

  // Sync CSS variable for background aurora color with backend alert state
  useEffect(() => {
    document.documentElement.style.setProperty('--anim-alert-rgb', alertColorRgb);
  }, [alertColorRgb]);

  useEffect(() => {
    const tick = async () => {
      const online = await checkHealth();
      setBackendOnline(prev => {
        if (online && !prev) {
          // Came online — load live data
          loadLiveData();
        }
        return online;
      });
    };

    tick();
    const id = setInterval(tick, 6000);
    return () => clearInterval(id);
  }, [loadLiveData, animOnline]);

  // ── Upload handler ────────────────────────────────────────────────────────

  const handleUploadDocument = async (newDoc: DocumentItem, newFacts: FactItem[]) => {
    // Optimistic update — immediately show in UI
    setDocuments(prev => [newDoc, ...prev]);
    setFacts(prev => [...newFacts, ...prev]);

    const auditEntry: AuditRecord = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'authorized.user@cmpdi.co.in',
      action: 'DOCUMENT_INGESTED',
      targetId: newDoc.id,
      details: `Uploaded & parsed ${newDoc.name}. Extracted ${newFacts.length} structured facts.`,
    };
    setAuditLogs(prev => [auditEntry, ...prev]);

    // Sync with backend if online
    if (backendOnline) {
      // DocumentCenterView handles the actual API call and passes results here.
      // If the backend is online, reload live data to sync any server-side changes.
      setTimeout(loadLiveData, 1000);
    }
  };

  // ── Fact verify toggle ────────────────────────────────────────────────────

  const handleToggleVerify = async (factId: string) => {
    // Optimistic UI update
    setFacts(prev => prev.map(f => {
      if (f.factId === factId) {
        const newStatus = f.status === 'Verified' ? 'Pending' : 'Verified';
        const updated: FactItem = {
          ...f,
          status: newStatus as FactItem['status'],
          verifiedBy: newStatus === 'Verified' ? 'Chief Mining Engineer (CMPDI)' : undefined,
          verifiedAt: newStatus === 'Verified'
            ? new Date().toISOString().replace('T', ' ').substring(0, 16)
            : undefined,
        };
        if (selectedFact?.factId === factId) setSelectedFact(updated);
        return updated;
      }
      return f;
    }));

    const auditEntry: AuditRecord = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'chief.engineer@cmpdi.co.in',
      action: 'FACT_CERTIFICATION_TOGGLE',
      targetId: factId,
      details: `Updated verification status for Fact ID ${factId}.`,
    };
    setAuditLogs(prev => [auditEntry, ...prev]);

    // Sync with backend
    if (backendOnline) {
      try {
        await verifyFact(factId, 'chief.engineer@cmpdi.co.in');
      } catch {
        // ignore — UI already updated optimistically
      }
    }
  };

  // ── Resolve firewall rule ────────────────────────────────────────────────

  const handleResolveRule = (ruleId: string) => {
    // Note: firewall state is managed locally; full backend sync handled by ConsistencyFirewallView
    const auditEntry: AuditRecord = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'safety.officer@cil.gov.in',
      action: 'FIREWALL_RULE_SIGNOFF',
      targetId: ruleId,
      details: `Manually verified & authorized clearance for rule ${ruleId}.`,
    };
    setAuditLogs(prev => [auditEntry, ...prev]);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="app-layout">
      {/* 3D Slow Motion WebGL Background */}
      <CanvasBackground />

      {/* Slow-Motion Background Ambient Aurora & Light Orbs */}
      <div className="bg-aurora-glow-1" />
      <div className="bg-aurora-glow-2" />
      <div className="bg-aurora-glow-3" />
      <div className="bg-aurora-glow-4" />
      <div className="bg-aurora-glow-5" />
      <div className="bg-cyber-grid-overlay" />
      {/* New background layers */}
      <div className="bg-scan-line" />
      <div className="bg-float-orb-1" />
      <div className="bg-float-orb-2" />
      <div className="bg-float-orb-3" />
      <div className="bg-corner-vignette" />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
        factsCount={facts.length}
        docsCount={documents.length}
      />

      {/* Main Canvas */}
      <main className="main-content-canvas">
        <header className="top-navigation-bar">
          <div className="top-breadcrumbs">
            <span className="crumb-root">GeoMine Intelligence</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">{activeTab.toUpperCase()}</span>
          </div>

          <div className="top-actions-right">
            {/* Backend status indicator */}
            <div className={`backend-status-pill ${backendOnline ? 'online' : 'offline'}`}>
              <span className={`status-dot ${backendOnline ? 'dot-online' : 'dot-offline'}`} />
              {backendOnline ? 'Backend Live' : 'Demo Mode'}
            </div>

            <div className="live-clock-badge">
              <span className="clock-dot" /> IST {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={() => setActiveTab('facts')}
              className="btn-top-quick"
            >
              Fact Passports ({facts.length})
            </button>
          </div>
        </header>

        <div className="content-scroll-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="tab-view-wrapper"
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  documents={documents}
                  facts={facts}
                  firewallRules={firewallRules}
                  onNavigate={setActiveTab}
                  onSelectFact={(f) => {
                    setSelectedFact(f);
                    setActiveTab('facts');
                  }}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentCenterView
                  documents={documents}
                  facts={facts}
                  onUploadDocument={handleUploadDocument}
                  backendOnline={backendOnline}
                />
              )}

              {activeTab === 'facts' && (
                <FactPassportView
                  facts={facts}
                  selectedFact={selectedFact}
                  onSelectFact={setSelectedFact}
                  onToggleVerify={handleToggleVerify}
                />
              )}

              {activeTab === 'firewall' && (
                <ConsistencyFirewallView
                  rules={firewallRules}
                  onResolveRule={handleResolveRule}
                  backendOnline={backendOnline}
                />
              )}

              {activeTab === 'change' && (
                <ChangeIntelligenceView
                  changes={CHANGE_INTELLIGENCE}
                  backendOnline={backendOnline}
                />
              )}

              {activeTab === 'parliamentary' && (
                <ParliamentaryCopilotView
                  questions={PARLIAMENTARY_QUESTIONS}
                  facts={facts}
                  backendOnline={backendOnline}
                />
              )}

              {activeTab === 'topic' && <TopicIntelligenceView />}
              {activeTab === 'ontology' && <MiningOntologyView />}
              {activeTab === 'workflow' && <WorkflowView />}

              {activeTab === 'audit' && (
                <AuditLogView
                  logs={auditLogs}
                  backendOnline={backendOnline}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BackendAnimProvider>
      <AppInner />
    </BackendAnimProvider>
  );
}
