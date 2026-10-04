import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Calendar, 
  Download
} from 'lucide-react';
import type { ChangeAnalysis } from '../types';

interface ChangeIntelligenceViewProps {
  changes: ChangeAnalysis[];
  backendOnline?: boolean;
}

export const ChangeIntelligenceView: React.FC<ChangeIntelligenceViewProps> = ({ changes }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('FY 2024-25 vs FY 2023-24');

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h1 className="view-page-title">Change Intelligence & Variance AI</h1>
          <p className="view-page-caption">
            Period-over-period comparative analytics across mines and subsidiaries with automatically synthesized natural-language executive commentary.
          </p>
        </div>

        <button 
          onClick={() => alert('Exporting period-over-period variance report in DOCX format...')}
          className="btn-export-secondary"
        >
          <Download size={16} /> Export Variance Dossier
        </button>
      </div>

      {/* Period Selection Ribbon */}
      <div className="period-selector-ribbon">
        <div className="period-label">
          <Calendar size={16} /> Comparing Reporting Horizons:
        </div>
        <div className="period-chips">
          <button 
            className={`period-pill ${selectedPeriod.includes('2024-25') ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('FY 2024-25 vs FY 2023-24')}
          >
            FY 2024-25 vs FY 2023-24 (Annual)
          </button>
          <button 
            className={`period-pill ${selectedPeriod.includes('Q3') ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('Q3 FY 2024-25 vs Q2 FY 2024-25')}
          >
            Q3 vs Q2 (Quarterly Delta)
          </button>
        </div>
      </div>

      {/* Change Cards Matrix */}
      <div className="change-intelligence-grid">
        {changes.map((item, idx) => {
          const isPositive = item.delta > 0;
          const isNegative = item.delta < 0;

          return (
            <motion.div 
              key={idx}
              className="change-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
            >
              <div className="change-card-top">
                <div>
                  <div className="change-entity">{item.entity}</div>
                  <div className="change-metric">{item.metric}</div>
                </div>

                <div className={`delta-badge ${isPositive ? 'delta-pos' : isNegative ? 'delta-neg' : 'delta-neu'}`}>
                  {isPositive && <ArrowUpRight size={16} />}
                  {isNegative && <ArrowDownRight size={16} />}
                  {isPositive ? `+${item.pctChange}%` : `${item.pctChange}%`}
                </div>
              </div>

              {/* Comparative Values Row */}
              <div className="change-values-row">
                <div className="val-box">
                  <span className="val-period-label">{item.currentPeriod}</span>
                  <span className="val-figure-current">
                    {item.currentValue} <span className="unit-small">{item.unit}</span>
                  </span>
                </div>

                <div className="val-divider-arrow">
                  <span>vs</span>
                </div>

                <div className="val-box">
                  <span className="val-period-label">{item.previousPeriod}</span>
                  <span className="val-figure-prev">
                    {item.previousValue} <span className="unit-small">{item.unit}</span>
                  </span>
                </div>
              </div>

              {/* Automated AI Commentary */}
              <div className="ai-commentary-box">
                <div className="ai-commentary-header">
                  <Sparkles size={14} className="sparkle-gold" /> Automated Narrative Commentary:
                </div>
                <p className="ai-commentary-text">
                  {item.commentary}
                </p>
              </div>

              <div className="change-card-footer">
                <span className={`significance-tag tag-${item.significance.toLowerCase()}`}>
                  {item.significance} Variance Impact
                </span>
                <span className="delta-numeric-val">
                  Net Absolute Delta: {item.delta > 0 ? `+${item.delta}` : item.delta} {item.unit}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
