import React, { useState } from 'react';
import WorkflowDiagram from '../WorkflowDiagram';
import { Interactive3DMineModel } from './Interactive3DMineModel';
import { GitBranch, Box, Sparkles, ShieldCheck } from 'lucide-react';

export const WorkflowView: React.FC = () => {
  const [selectedSubView, setSelectedSubView] = useState<'pipeline' | '3d-twin'>('pipeline');

  return (
    <div className="view-container workflow-enhanced-view">
      <div className="view-header-row">
        <div>
          <div className="live-pulse-badge">
            <span className="pulse-dot" /> 3D ARCHITECTURE & GEOLOGICAL TWIN
          </div>
          <h1 className="view-page-title">Intelligence Pipeline & 3D Spatial Twin</h1>
          <p className="view-page-caption">
            Deterministic CIL/CMPDI verification pipeline with slow-motion data streams, 3D holographic cards, and real-time geological strata visualization.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="workflow-subview-tabs">
          <button
            type="button"
            className={`subview-tab-btn ${selectedSubView === 'pipeline' ? 'active' : ''}`}
            onClick={() => setSelectedSubView('pipeline')}
          >
            <GitBranch size={15} />
            <span>3D Pipeline Graph</span>
          </button>
          <button
            type="button"
            className={`subview-tab-btn ${selectedSubView === '3d-twin' ? 'active' : ''}`}
            onClick={() => setSelectedSubView('3d-twin')}
          >
            <Box size={15} />
            <span>3D Geological Twin</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedSubView === 'pipeline' ? (
        <div className="workflow-diagram-glass-wrapper">
          <div className="pipeline-banner-bar">
            <div className="banner-left">
              <Sparkles size={16} className="text-emerald" />
              <span>
                <strong>End-to-End Governance:</strong> 10-stage verifiable lifecycle with active latency telemetry and cryptographic SHA-256 provenance.
              </span>
            </div>
            <div className="banner-right">
              <ShieldCheck size={16} className="text-cyan" />
              <span>Firewall Active • Strict Non-Hallucination Gate</span>
            </div>
          </div>
          <WorkflowDiagram />
        </div>
      ) : (
        <div className="workflow-3d-model-wrapper">
          <Interactive3DMineModel />
        </div>
      )}
    </div>
  );
};
