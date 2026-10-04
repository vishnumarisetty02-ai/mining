import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Award, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  Bot, 
  Zap,
  TrendingUp
} from 'lucide-react';
import type { DocumentItem, FactItem, FirewallRuleResult } from '../types';

interface DashboardViewProps {
  documents: DocumentItem[];
  facts: FactItem[];
  firewallRules: FirewallRuleResult[];
  onNavigate: (tab: any) => void;
  onSelectFact: (fact: FactItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  facts,
  firewallRules,
  onNavigate,
  onSelectFact,
}) => {
  const verifiedCount = facts.filter(f => f.status === 'Verified').length;
  const criticalConflicts = firewallRules.filter(r => r.severity === 'CRITICAL').length;
  const warningCount = firewallRules.filter(r => r.severity === 'WARNING').length;

  const kpis = [
    {
      label: 'DOCUMENTS INDEXED',
      value: documents.length,
      icon: FileText,
      detail: 'Source PDF, XLSX, DOCX files',
      accent: 'emerald',
    },
    {
      label: 'FACTS EXTRACTED',
      value: facts.length,
      icon: Award,
      detail: 'Structured facts with SHA-256 provenance',
      accent: 'emerald',
    },
    {
      label: 'VERIFIED FACTS',
      value: verifiedCount,
      icon: CheckCircle2,
      detail: 'Reviewed & certified by authorized engineers',
      accent: 'copper',
    },
    {
      label: 'HARD CONFLICTS',
      value: criticalConflicts,
      icon: ShieldCheck,
      detail: criticalConflicts === 0 ? 'Zero arithmetic violations' : 'Requires immediate resolution',
      accent: criticalConflicts > 0 ? 'crimson' : 'emerald',
    },
    {
      label: 'REVIEW WARNINGS',
      value: warningCount,
      icon: AlertTriangle,
      detail: 'Monotonicity & minor baseline drifts',
      accent: warningCount > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'INTELLIGENCE SUITE',
      value: '100%',
      icon: Layers,
      detail: 'Deterministic AI Firewall Active',
      accent: 'cyan',
    },
  ];

  return (
    <div className="view-container">
      {/* Hero Welcome Banner */}
      <motion.div 
        className="dashboard-hero-banner"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="hero-left-content">
          <div className="hero-tag">
            <Zap size={14} className="tag-sparkle" /> CMPDI & COAL INDIA INTELLIGENCE PLATFORM
          </div>
          <h1 className="hero-main-title">
            Evidence-Grounded Reporting & <span className="highlight-text">Consistency Firewall</span>
          </h1>
          <p className="hero-subtext">
            Ingest multi-subsidiary geological reports, core logs, and operational statements.
            Every metric is validated deterministically with zero hallucination.
          </p>

          <div className="hero-action-pills">
            <button onClick={() => onNavigate('documents')} className="btn-hero-primary">
              <FileText size={16} /> Ingest Documents
            </button>
            <button onClick={() => onNavigate('parliamentary')} className="btn-hero-secondary">
              <Bot size={16} /> Parliamentary Copilot
            </button>
            <button onClick={() => onNavigate('firewall')} className="btn-hero-ghost">
              <ShieldCheck size={16} /> View Firewall Rules
            </button>
          </div>
        </div>

        <div className="hero-right-visual">
          <div className="ambient-3d-crystal-wrapper">
            <div className="hero-3d-polyhedron">
              <div className="poly-facet poly-facet-1" />
              <div className="poly-facet poly-facet-2" />
              <div className="poly-facet-core" />
            </div>
            <div className="hero-orbit orbit-1">
              <div className="hero-sat sat-1" />
            </div>
            <div className="hero-orbit orbit-2">
              <div className="hero-sat sat-2" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Command Grid */}
      <div className="kpi-command-grid">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              className={`kpi-card accent-${kpi.accent}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <div className="kpi-card-header">
                <span className="kpi-label">{kpi.label}</span>
                <div className="kpi-icon-box">
                  <Icon size={18} />
                </div>
              </div>
              <div className="kpi-value-num">{kpi.value}</div>
              <div className="kpi-sub-detail">{kpi.detail}</div>
              <div className="kpi-corner-accent" />
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid Sections */}
      <div className="dashboard-split-grid">
        {/* Left Column: Recent Extracted Facts with Fact Passport */}
        <div className="glass-panel-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Verified Fact Feed</h2>
              <p className="section-caption">Live extraction stream with SHA-256 evidence provenance</p>
            </div>
            <button onClick={() => onNavigate('facts')} className="btn-text-link">
              View All Facts <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="facts-quick-list">
            {facts.slice(0, 5).map((fact) => (
              <div 
                key={fact.factId} 
                className="fact-feed-row"
                onClick={() => onSelectFact(fact)}
              >
                <div className="fact-entity-col">
                  <div className="fact-badge-id">{fact.factId}</div>
                  <div className="fact-entity-name">{fact.entity} ({fact.subsidiary})</div>
                  <div className="fact-doc-source">{fact.docName} · Page {fact.pageNumber}</div>
                </div>

                <div className="fact-metric-col">
                  <div className="fact-metric-title">{fact.metric}</div>
                  <div className="fact-metric-val">{fact.unit}</div>
                </div>

                <div className="fact-status-col">
                  <span className={`status-pill pill-${fact.status.toLowerCase()}`}>
                    {fact.status}
                  </span>
                  <div className="confidence-label">{(fact.confidence * 100).toFixed(0)}% confidence</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Consistency Firewall & Intelligence Highlights */}
        <div className="glass-panel-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Consistency Firewall Status</h2>
              <p className="section-caption">Deterministic mathematical & physical rules</p>
            </div>
            <button onClick={() => onNavigate('firewall')} className="btn-text-link">
              Firewall Engine <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="firewall-rules-summary">
            {firewallRules.map((rule) => (
              <div key={rule.ruleId} className="firewall-status-card">
                <div className="rule-top-line">
                  <div className="rule-title-box">
                    <span className="rule-name">{rule.name}</span>
                    <span className="rule-entity">{rule.targetEntity}</span>
                  </div>
                  <span className={`severity-tag sev-${rule.severity.toLowerCase()}`}>
                    {rule.severity}
                  </span>
                </div>
                <p className="rule-desc">{rule.description}</p>
                <div className="rule-evidence-chip">
                  <span>Evidence:</span> {rule.evidence}
                </div>
              </div>
            ))}
          </div>

          <div className="quick-module-launchpad">
            <h3 className="launchpad-title">Intelligence Modules</h3>
            <div className="launchpad-grid">
              <div onClick={() => onNavigate('change')} className="launchpad-card">
                <TrendingUp size={20} className="launchpad-icon icon-emerald" />
                <div className="launchpad-info">
                  <div className="launchpad-name">Change Intelligence</div>
                  <div className="launchpad-sub">Period-over-period delta detection</div>
                </div>
              </div>

              <div onClick={() => onNavigate('parliamentary')} className="launchpad-card">
                <Bot size={20} className="launchpad-icon icon-cyan" />
                <div className="launchpad-info">
                  <div className="launchpad-name">Parliamentary Copilot</div>
                  <div className="launchpad-sub">Lok Sabha / Rajya Sabha drafted QA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
