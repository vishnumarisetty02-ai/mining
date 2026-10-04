import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Tag } from 'lucide-react';

const TOPIC_SCORES = [
  { topic: 'Coal Production & Targets', count: 48, percentage: 34, growth: '+12.4%', color: '#00F0B5' },
  { topic: 'Overburden (OB) Removal', count: 32, percentage: 22, growth: '+18.1%', color: '#00D8F6' },
  { topic: 'Geological Core Drilling & Reserves', count: 26, percentage: 18, growth: '+8.5%', color: '#F5BA6B' },
  { topic: 'GCV & Quality Sampling (Bomb Calorimeter)', count: 18, percentage: 13, growth: '+5.0%', color: '#A78BFA' },
  { topic: 'Dispatch & Rail Evacuation (FMC)', count: 14, percentage: 10, growth: '-2.1%', color: '#38BDF8' },
  { topic: 'Safety & Environmental Clearance (EC/FC)', count: 5, percentage: 3, growth: '+1.2%', color: '#F472B6' },
];

const KEYWORDS = [
  { text: 'Overburden Removal', weight: 95 },
  { text: 'Gross Calorific Value', weight: 88 },
  { text: 'Borehole Depth', weight: 82 },
  { text: 'Proved Reserve', weight: 80 },
  { text: 'Kusmunda OCP', weight: 78 },
  { text: 'Gamma Project', weight: 75 },
  { text: 'Dragline Yield', weight: 68 },
  { text: 'Grade G10', weight: 65 },
  { text: 'Stripping Ratio', weight: 62 },
  { text: 'Pithead Closing Stock', weight: 58 },
  { text: 'Rail Dispatch Siding', weight: 55 },
  { text: 'CMPDI Exploration Block', weight: 52 },
];

export const TopicIntelligenceView: React.FC = () => {

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h1 className="view-page-title">Topic Evolution & Reporting Trends</h1>
          <p className="view-page-caption">
            NLP semantic topic tracking across statutory reporting periods, monitoring keyword shifts and operational focus areas across subsidiaries.
          </p>
        </div>
      </div>

      {/* Topic Score Bars Grid */}
      <div className="topics-analytics-grid">
        <div className="glass-panel-section">
          <div className="section-header-row">
            <h2 className="section-title">Dominant Mining & Geological Topics</h2>
            <span className="sample-window-tag">Window: FY 2023-24 to FY 2024-25</span>
          </div>

          <div className="topic-bars-list">
            {TOPIC_SCORES.map((t, idx) => (
              <div key={idx} className="topic-bar-item">
                <div className="topic-bar-top">
                  <span className="topic-bar-name">{t.topic}</span>
                  <div className="topic-bar-stats">
                    <span className="topic-count">{t.count} occurrences</span>
                    <span className="topic-growth text-emerald">{t.growth}</span>
                  </div>
                </div>

                <div className="topic-progress-track">
                  <motion.div 
                    className="topic-progress-fill" 
                    style={{ background: t.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${t.percentage * 2.5}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Keyword Cloud */}
        <div className="glass-panel-section">
          <div className="section-header-row">
            <h2 className="section-title">Semantic Keyword Clusters</h2>
            <span className="sample-window-tag">TF-IDF Weighted</span>
          </div>

          <div className="keyword-cloud-container">
            {KEYWORDS.map((kw, idx) => (
              <motion.span
                key={idx}
                className="keyword-tag-pill"
                style={{
                  fontSize: `${Math.max(0.75, (kw.weight / 100) * 1.15)}rem`,
                  opacity: Math.max(0.6, kw.weight / 100),
                }}
                whileHover={{ scale: 1.08, borderColor: '#00F0B5' }}
              >
                <Tag size={12} className="tag-bullet" /> {kw.text}
              </motion.span>
            ))}
          </div>

          <div className="topic-summary-footer-box">
            <Sparkles size={16} className="text-emerald" />
            <span>
              <strong>Shift Detected:</strong> Overburden removal reporting increased by +18.1% across SECL & NCL due to accelerated pre-stripping.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
