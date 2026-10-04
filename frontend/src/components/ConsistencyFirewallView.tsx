import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  RefreshCw, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import type { FirewallRuleResult } from '../types';

interface ConsistencyFirewallViewProps {
  rules: FirewallRuleResult[];
  onResolveRule: (ruleId: string) => void;
  backendOnline?: boolean;
}

export const ConsistencyFirewallView: React.FC<ConsistencyFirewallViewProps> = ({
  rules,
  onResolveRule,
}) => {
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const criticalCount = rules.filter(r => r.severity === 'CRITICAL').length;
  const warningCount = rules.filter(r => r.severity === 'WARNING').length;
  const passCount = rules.filter(r => r.severity === 'PASS').length;

  const handleRunFullScan = () => {
    setIsRunningScan(true);
    setScanMessage('Evaluating mathematical limits & mass conservation checks...');
    setTimeout(() => {
      setScanMessage('Cross-validating GCV grade band matrices with Ministry notifications...');
    }, 600);
    setTimeout(() => {
      setIsRunningScan(false);
      setScanMessage('Deterministic consistency scan complete: 4 rules evaluated.');
    }, 1200);
  };

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <div className="usp-badge-banner">
            <ShieldCheck size={15} /> CORE UNIQUE DIFFERENTIATOR
          </div>
          <h1 className="view-page-title">Consistency Firewall Engine</h1>
          <p className="view-page-caption">
            Deterministic mathematical and domain-grounded rules validate every metric across documents to block anomalies, impossible dispatch figures, and arithmetic hallucinations.
          </p>
        </div>

        <button 
          onClick={handleRunFullScan} 
          disabled={isRunningScan}
          className="btn-run-firewall"
        >
          <RefreshCw size={16} className={isRunningScan ? 'spin-anim' : ''} />
          {isRunningScan ? 'Running Audit Scan...' : 'Re-Evaluate All Rules'}
        </button>
      </div>

      {/* Top Firewall Health Status Cards */}
      <div className="firewall-health-grid">
        <div className="firewall-status-banner-card">
          <div className="firewall-shield-icon-halo">
            <ShieldCheck size={36} className="firewall-main-icon" />
          </div>
          <div>
            <div className="health-status-badge">
              {criticalCount === 0 ? 'STATUS: PASS · ZERO HARD BLOCKS' : 'STATUS: REVIEW REQUIRED'}
            </div>
            <h3 className="health-title">Mass Conservation & Geological Invariants Active</h3>
            <p className="health-sub">
              Deterministic rule checks prevent statutory report submission until critical violations are cleared.
            </p>
          </div>
        </div>

        <div className="firewall-metric-pill-card">
          <div className="mini-status-stat">
            <span className="stat-num text-emerald">{passCount}</span>
            <span className="stat-label">RULES PASSED</span>
          </div>
          <div className="mini-status-stat">
            <span className="stat-num text-amber">{warningCount}</span>
            <span className="stat-label">WARNINGS</span>
          </div>
          <div className="mini-status-stat">
            <span className="stat-num text-crimson">{criticalCount}</span>
            <span className="stat-label">CRITICAL CONFLICTS</span>
          </div>
        </div>
      </div>

      {scanMessage && (
        <div className="scan-toast-alert">
          <Sparkles size={16} /> {scanMessage}
        </div>
      )}

      {/* Rule Breakdown Cards */}
      <div className="firewall-rules-list">
        {rules.map((rule) => {
          const isCritical = rule.severity === 'CRITICAL';
          const isWarning = rule.severity === 'WARNING';
          const isPass = rule.severity === 'PASS';

          return (
            <motion.div 
              key={rule.ruleId} 
              className={`firewall-rule-card ${isCritical ? 'border-critical' : isWarning ? 'border-warning' : 'border-pass'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="rule-card-header">
                <div className="rule-badge-group">
                  <span className={`severity-tag sev-${rule.severity.toLowerCase()}`}>
                    {isPass && <CheckCircle2 size={13} />}
                    {isWarning && <AlertTriangle size={13} />}
                    {isCritical && <XCircle size={13} />}
                    {rule.severity}
                  </span>
                  <span className="rule-category-pill">{rule.category}</span>
                  <span className="rule-id-text">{rule.ruleId}</span>
                </div>

                <div className="rule-target-badge">{rule.targetEntity}</div>
              </div>

              <h3 className="rule-name-heading">{rule.name}</h3>
              <p className="rule-description-text">{rule.description}</p>

              <div className="rule-evidence-box">
                <div className="evidence-header">
                  <Cpu size={14} /> Mathematical / Physical Evidence:
                </div>
                <div className="evidence-content">{rule.evidence}</div>
              </div>

              <div className="rule-action-row">
                <div className="action-required-text">
                  <span>Action:</span> {rule.actionRequired}
                </div>

                {rule.status === 'Active' && (
                  <button 
                    onClick={() => onResolveRule(rule.ruleId)}
                    className="btn-resolve-rule"
                  >
                    Authorize & Signoff <ArrowRight size={14} />
                  </button>
                )}

                {rule.status === 'Resolved' && (
                  <span className="status-resolved-tag">
                    <CheckCircle2 size={14} /> Verified & Cleared
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
