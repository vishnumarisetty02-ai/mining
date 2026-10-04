import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  Bot, 
  Sparkles, 
  BookOpen, 
  GitBranch, 
  History, 
  Pickaxe,
  ChevronRight
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard'
  | 'documents'
  | 'facts'
  | 'firewall'
  | 'change'
  | 'parliamentary'
  | 'topic'
  | 'ontology'
  | 'workflow'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  backendOnline: boolean;
  factsCount: number;
  docsCount: number;
}

const navItems = [
  { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
  { id: 'documents' as ActiveTab, label: 'Document Center', icon: FileText },
  { id: 'facts' as ActiveTab, label: 'Fact Passport', icon: Award, badge: 'USP' },
  { id: 'firewall' as ActiveTab, label: 'Consistency Firewall', icon: ShieldCheck, badge: 'Rules' },
  { id: 'change' as ActiveTab, label: 'Change Intelligence', icon: TrendingUp },
  { id: 'parliamentary' as ActiveTab, label: 'Parliamentary Copilot', icon: Bot, badge: 'AI' },
  { id: 'topic' as ActiveTab, label: 'Topic Intelligence', icon: Sparkles },
  { id: 'ontology' as ActiveTab, label: 'Mining Ontology', icon: BookOpen },
  { id: 'workflow' as ActiveTab, label: 'Workflow Engine', icon: GitBranch },
  { id: 'audit' as ActiveTab, label: 'Audit Trail', icon: History },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  backendOnline,
  factsCount,
  docsCount,
}) => {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand-box">
        <div className="sidebar-logo">
          <div className="logo-icon-wrap">
            <Pickaxe size={22} className="logo-icon" />
          </div>
          <div className="logo-text-wrap">
            <div className="logo-title">Geo<span>Mine</span></div>
            <div className="logo-sub">CMPDI / CIL Intelligence</div>
          </div>
        </div>

        <div className="system-telemetry-badge">
          <div className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
          <span>{backendOnline ? 'Core Pipeline Online' : 'Local Edge Standalone'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">PLATFORM MODULES</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon-label">
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </div>
              
              <div className="nav-meta">
                {item.badge && (
                  <span className={`nav-chip ${item.badge === 'USP' ? 'chip-usp' : 'chip-regular'}`}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={14} className="nav-chevron" />
              </div>

              {isActive && (
                <motion.div 
                  layoutId="activeIndicator" 
                  className="active-pill-bar" 
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer-card">
        <div className="footer-stats-row">
          <div>
            <div className="stat-label">INDEXED DOCS</div>
            <div className="stat-value">{docsCount}</div>
          </div>
          <div className="stat-divider" />
          <div>
            <div className="stat-label">EXTRACTED FACTS</div>
            <div className="stat-value">{factsCount}</div>
          </div>
        </div>
        <div className="footer-usp-note">
          <span>Zero Hallucinations</span> · Every number verified back to source PDF / core log.
        </div>
      </div>
    </aside>
  );
};
