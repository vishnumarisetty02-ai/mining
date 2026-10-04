import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Hash, 
  Download, 
  Check
} from 'lucide-react';
import type { FactItem } from '../types';

interface FactPassportViewProps {
  facts: FactItem[];
  selectedFact: FactItem | null;
  onSelectFact: (fact: FactItem | null) => void;
  onToggleVerify: (factId: string) => void;
}

export const FactPassportView: React.FC<FactPassportViewProps> = ({
  facts,
  selectedFact,
  onSelectFact,
  onToggleVerify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [metricFilter, setMetricFilter] = useState('ALL');

  const filteredFacts = facts.filter((f) => {
    const matchesSearch = f.factId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.metric.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.docName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchesMetric = metricFilter === 'ALL' || f.metric.toLowerCase().includes(metricFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesMetric;
  });

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <div className="usp-badge-banner">
            <Award size={15} /> CORE UNIQUE DIFFERENTIATOR
          </div>
          <h1 className="view-page-title">Fact Passport System</h1>
          <p className="view-page-caption">
            Every extracted numerical value possesses an immutable digital passport: source document anchor, page snippet, extraction confidence, and SHA-256 provenance fingerprint.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-controls-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            placeholder="Search by Fact ID (e.g. FCT-1499...), Mine name, or Metric..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
        </div>

        <div className="filter-group-right">
          <div className="filter-select-wrapper">
            <Filter size={16} className="filter-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="custom-dropdown"
            >
              <option value="ALL">All Statuses</option>
              <option value="Verified">Verified Only</option>
              <option value="Pending">Pending Review</option>
              <option value="Warning">Warning Flagged</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select 
              value={metricFilter} 
              onChange={(e) => setMetricFilter(e.target.value)}
              className="custom-dropdown"
            >
              <option value="ALL">All Metrics</option>
              <option value="production">Coal Production</option>
              <option value="target">Annual Target</option>
              <option value="overburden">Overburden Removal</option>
              <option value="gcv">GCV / Quality</option>
              <option value="reserve">Geological Reserve</option>
              <option value="dispatch">Coal Dispatch</option>
              <option value="depth">Borehole Depth</option>
            </select>
          </div>
        </div>
      </div>

      {/* Facts Table */}
      <div className="glass-table-wrapper">
        <table className="custom-data-table">
          <thead>
            <tr>
              <th>FACT PASSPORT ID</th>
              <th>MINE / ENTITY</th>
              <th>METRIC</th>
              <th>STANDARDIZED VALUE</th>
              <th>PERIOD</th>
              <th>SOURCE DOCUMENT & PAGE</th>
              <th>CONFIDENCE</th>
              <th>VERIFICATION STATUS</th>
              <th>PASSPORT</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacts.map((fact) => (
              <tr key={fact.factId} className="table-data-row">
                <td>
                  <span className="fact-id-chip">{fact.factId}</span>
                </td>
                <td>
                  <div>
                    <div className="table-entity-name">{fact.entity}</div>
                    <span className="subsidiary-mini-tag">{fact.subsidiary}</span>
                  </div>
                </td>
                <td>
                  <span className="metric-tag">{fact.metric}</span>
                </td>
                <td>
                  <span className="metric-bold-value">{fact.unit}</span>
                </td>
                <td>{fact.period}</td>
                <td>
                  <div className="source-link-cell">
                    <FileText size={14} className="source-doc-icon" />
                    <div>
                      <div className="doc-link-text">{fact.docName}</div>
                      <div className="doc-page-sub">Page {fact.pageNumber}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="confidence-pill-wrap">
                    <div className="conf-bar-bg">
                      <div 
                        className="conf-bar-fill" 
                        style={{ width: `${fact.confidence * 100}%` }} 
                      />
                    </div>
                    <span className="conf-percent">{(fact.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td>
                  <span className={`status-pill pill-${fact.status.toLowerCase()}`}>
                    {fact.status === 'Verified' && <CheckCircle2 size={12} />}
                    {fact.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => onSelectFact(fact)}
                    className="btn-passport-open"
                  >
                    <Award size={14} /> Passport
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fact Passport Modal / Certificate */}
      <AnimatePresence>
        {selectedFact && (
          <div className="modal-backdrop" onClick={() => onSelectFact(null)}>
            <motion.div 
              className="passport-modal-card"
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Passport Ribbon */}
              <div className="passport-header-ribbon">
                <div className="ribbon-brand">
                  <Award size={22} className="passport-gold-icon" />
                  <div>
                    <div className="passport-top-title">OFFICIAL FACT PASSPORT CERTIFICATE</div>
                    <div className="passport-top-sub">CMPDI / Coal India Verified Provenance Record</div>
                  </div>
                </div>

                <div className="passport-id-badge">
                  {selectedFact.factId}
                </div>
              </div>

              <div className="passport-content-body">
                <div className="passport-two-col">
                  {/* Left Column: Metric Details */}
                  <div className="passport-detail-pane">
                    <div className="passport-field-group">
                      <span className="field-label">Canonical Entity / Mine</span>
                      <div className="field-value-lg">{selectedFact.entity} ({selectedFact.subsidiary})</div>
                    </div>

                    <div className="passport-field-group">
                      <span className="field-label">Domain Metric & Period</span>
                      <div className="field-value-metric">
                        {selectedFact.metric} · <span className="period-highlight">{selectedFact.period}</span>
                      </div>
                    </div>

                    <div className="passport-field-group">
                      <span className="field-label">Verified Value & Unit</span>
                      <div className="passport-value-banner">
                        {selectedFact.unit}
                      </div>
                    </div>

                    <div className="passport-meta-row">
                      <div>
                        <span className="field-label">Extraction Confidence</span>
                        <div className="conf-value-big">{(selectedFact.confidence * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="field-label">Verification Status</span>
                        <span className={`status-pill pill-${selectedFact.status.toLowerCase()}`}>
                          {selectedFact.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Source Document Anchor & Provenance */}
                  <div className="passport-provenance-pane">
                    <div className="provenance-section-header">
                      <FileText size={16} /> EVIDENCE TRACE ANCHOR
                    </div>

                    <div className="source-anchor-box">
                      <div className="anchor-doc-name">{selectedFact.docName}</div>
                      <div className="anchor-page-num">📍 Located on Page {selectedFact.pageNumber}</div>
                      <div className="anchor-snippet-box">
                        <span className="quote-mark">“</span>
                        {selectedFact.sourceSnippet}
                        <span className="quote-mark">”</span>
                      </div>
                    </div>

                    <div className="sha-provenance-box">
                      <div className="sha-label"><Hash size={13} /> SHA-256 Provenance Hash:</div>
                      <div className="sha-hash-text">{selectedFact.sha256Provenance}</div>
                    </div>

                    {selectedFact.verifiedBy && (
                      <div className="verified-by-card">
                        <CheckCircle2 size={16} className="verified-icon" />
                        <div>
                          <div className="verified-user">{selectedFact.verifiedBy}</div>
                          <div className="verified-time">{selectedFact.verifiedAt || 'Certified via Blockchain Log'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Passport Actions */}
              <div className="passport-footer-actions">
                <button 
                  onClick={() => onToggleVerify(selectedFact.factId)}
                  className={`btn-verify-action ${selectedFact.status === 'Verified' ? 'btn-unverify' : 'btn-verify'}`}
                >
                  {selectedFact.status === 'Verified' ? (
                    <>Mark as Pending Review</>
                  ) : (
                    <><Check size={16} /> Approve & Certify Fact</>
                  )}
                </button>

                <button 
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedFact, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `${selectedFact.factId}_passport.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="btn-export-passport"
                >
                  <Download size={16} /> Export JSON Passport
                </button>

                <button onClick={() => onSelectFact(null)} className="btn-close-passport">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
