import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import type { AuditRecord } from '../types';

interface AuditLogViewProps {
  logs: AuditRecord[];
  backendOnline?: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h1 className="view-page-title">Immutable Audit Trail</h1>
          <p className="view-page-caption">
            Cryptographic ledger tracking all document uploads, fact verifications, consistency overrides, and report generations.
          </p>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            placeholder="Search audit records by user email, action, or Fact ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
        </div>
      </div>

      <div className="glass-table-wrapper">
        <table className="custom-data-table">
          <thead>
            <tr>
              <th>AUDIT ID</th>
              <th>TIMESTAMP (UTC+05:30)</th>
              <th>AUTHENTICATED ACTOR</th>
              <th>ACTION EVENT</th>
              <th>TARGET ENTITY / ID</th>
              <th>ACTIVITY DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="table-data-row">
                <td>
                  <span className="audit-id-badge">{log.id}</span>
                </td>
                <td>
                  <span className="timestamp-text">{log.timestamp}</span>
                </td>
                <td>
                  <div className="user-cell">
                    <User size={14} className="text-muted" />
                    <span>{log.user}</span>
                  </div>
                </td>
                <td>
                  <span className={`action-pill ${log.action.includes('VERIFIED') ? 'pill-verified' : 'pill-action'}`}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <span className="target-id-chip">{log.targetId}</span>
                </td>
                <td>
                  <div className="audit-details-text">{log.details}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
