import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Search, 
  Filter, 
  Eye, 
  Hash, 
  Sparkles,
  X,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import type { DocumentItem, FactItem } from '../types';
import { uploadDocument } from '../api/client';

interface DocumentCenterViewProps {
  documents: DocumentItem[];
  facts: FactItem[];
  onUploadDocument: (newDoc: DocumentItem, extractedFacts: FactItem[]) => void;
  backendOnline?: boolean;
}

export const DocumentCenterView: React.FC<DocumentCenterViewProps> = ({
  documents,
  facts,
  onUploadDocument,
  backendOnline = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadMessage(null);

    if (backendOnline) {
      // Real upload to FastAPI backend
      try {
        setUploadProgress(30);
        const result = await uploadDocument(file);
        setUploadProgress(100);
        setUploadMessage(result.message);

        // Adapt backend response to frontend types
        const newDoc: DocumentItem = result.document as DocumentItem;
        const newFacts = result.facts.map((f: any) => ({
          factId: f.factId,
          docId: f.docId,
          docName: f.docName,
          entity: f.entity,
          subsidiary: f.subsidiary || 'Unknown',
          metric: f.metric,
          value: f.value,
          unit: f.unit,
          period: f.period,
          confidence: f.confidence,
          status: f.status as FactItem['status'],
          pageNumber: f.pageNumber ?? 0,
          sourceSnippet: f.sourceSnippet,
          sha256Provenance: f.sha256Provenance,
        }));

        onUploadDocument(newDoc, newFacts);
      } catch (err: any) {
        setUploadError(err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Demo mode — simulate upload
      const timer1 = setTimeout(() => setUploadProgress(45), 400);
      const timer2 = setTimeout(() => setUploadProgress(85), 900);
      const timer3 = setTimeout(() => {
        setUploadProgress(100);
        setIsUploading(false);
        setUploadMessage(`Demo mode: simulated ingestion of "${file.name}"`);

        const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
        const docId = `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
        const sha = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

        const newDoc: DocumentItem = {
          id: docId,
          name: file.name,
          type: ext,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          pages: Math.floor(Math.random() * 20) + 4,
          uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          subsidiary: 'SECL',
          mine: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          period: 'FY 2024-25',
          status: 'Indexed',
          sha256: sha,
          factsExtracted: 6,
          tablesCount: 3,
          contentSnippet: `Simulated document: ${file.name}. Start the FastAPI backend for real extraction.`,
        };

        const newFact: FactItem = {
          factId: `FCT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          docId,
          docName: file.name,
          entity: newDoc.mine,
          subsidiary: 'SECL',
          metric: 'Simulated Production',
          value: 2850000,
          unit: 'tonnes (2.85 MT)',
          period: 'FY 2024-25',
          confidence: 0.94,
          status: 'Pending',
          pageNumber: 1,
          sourceSnippet: 'Simulated extraction — start backend for real data.',
          sha256Provenance: sha,
        };

        onUploadDocument(newDoc, [newFact]);
        clearTimeout(timer1);
        clearTimeout(timer2);
      }, 1400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.mine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSub = selectedSubsidiary === 'ALL' || doc.subsidiary === selectedSubsidiary;
    return matchesSearch && matchesSub;
  });

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h1 className="view-page-title">Document Center</h1>
          <p className="view-page-caption">
            Ingest and parse PDF, Scanned PDF (OCR), Excel, Word, and CSV reports with automatic table extraction.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="uploader-card">
        {/* Backend status banner */}
        <div className={`uploader-backend-status ${backendOnline ? 'status-live' : 'status-demo'}`}>
          {backendOnline
            ? <><Wifi size={14} /> Backend API connected — uploads will perform real AI extraction</>
            : <><WifiOff size={14} /> Demo Mode — start the FastAPI backend (uvicorn api:app --port 8000) for real extraction</>}
        </div>

        <label className="uploader-drop-area">
          <input 
            type="file" 
            className="hidden-file-input" 
            accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <div className="uploader-content">
            <div className="uploader-icon-halo">
              <UploadCloud size={32} className="uploader-icon" />
            </div>
            <h3 className="uploader-title">Drag & Drop Geological or Operational Reports</h3>
            <p className="uploader-subtitle">
              Supports PDF, Scanned PDF with OCR, XLSX, DOCX, CSV · Automatic table & metadata extraction
            </p>

            <div className="uploader-file-tags">
              <span className="file-chip">📄 PDF / Scan OCR</span>
              <span className="file-chip">📊 XLSX / CSV Tables</span>
              <span className="file-chip">📑 DOCX Reports</span>
              <span className="file-chip">🔒 SHA-256 Hashing</span>
            </div>

          {isUploading && (
              <div className="upload-progress-wrapper">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="progress-status-text">
                  <span>{backendOnline ? 'Ingesting & extracting facts via backend...' : 'Simulating extraction...'}</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="upload-error-toast">
                <AlertCircle size={16} /> {uploadError}
              </div>
            )}

            {uploadMessage && !isUploading && (
              <div className="upload-success-toast">
                <CheckCircle2 size={16} /> {uploadMessage}
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-controls-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            placeholder="Search documents by name, mine, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
        </div>

        <div className="filter-select-wrapper">
          <Filter size={16} className="filter-icon" />
          <select 
            value={selectedSubsidiary} 
            onChange={(e) => setSelectedSubsidiary(e.target.value)}
            className="custom-dropdown"
          >
            <option value="ALL">All Subsidiaries (CMPDI / CIL)</option>
            <option value="SECL">SECL · South Eastern Coalfields</option>
            <option value="BCCL">BCCL · Bharat Coking Coal</option>
            <option value="NCL">NCL · Northern Coalfields</option>
            <option value="ECL">ECL · Eastern Coalfields</option>
            <option value="CCL">CCL · Central Coalfields</option>
            <option value="WCL">WCL · Western Coalfields</option>
            <option value="MCL">MCL · Mahanadi Coalfields</option>
            <option value="CMPDI">CMPDI · Exploration Core</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-table-wrapper">
        <table className="custom-data-table">
          <thead>
            <tr>
              <th>DOCUMENT ID</th>
              <th>FILE NAME & MINE</th>
              <th>SUBSIDIARY</th>
              <th>PERIOD</th>
              <th>TYPE & SIZE</th>
              <th>EXTRACTED FACTS</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="table-data-row">
                <td>
                  <span className="doc-id-pill">{doc.id}</span>
                </td>
                <td>
                  <div className="doc-name-cell">
                    <FileText size={16} className="doc-type-icon" />
                    <div>
                      <div className="doc-title-text">{doc.name}</div>
                      <div className="doc-mine-text">{doc.mine}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="subsidiary-badge">{doc.subsidiary}</span>
                </td>
                <td>{doc.period}</td>
                <td>
                  <div className="doc-meta-text">
                    {doc.type} · {doc.size} · {doc.pages} pages
                  </div>
                </td>
                <td>
                  <div className="fact-count-pill">
                    <Sparkles size={13} /> {doc.factsExtracted} facts
                  </div>
                </td>
                <td>
                  <span className="status-pill pill-verified">
                    <CheckCircle2 size={12} /> {doc.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => setSelectedDoc(doc)}
                    className="btn-action-view"
                  >
                    <Eye size={14} /> Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Document Inspection Drawer / Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="modal-backdrop" onClick={() => setSelectedDoc(null)}>
            <motion.div 
              className="modal-container-large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <div className="modal-eyebrow">DOCUMENT INSPECTOR · {selectedDoc.id}</div>
                  <h2 className="modal-title">{selectedDoc.name}</h2>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="modal-close-btn">
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-scroll">
                <div className="doc-meta-grid">
                  <div className="meta-card">
                    <span className="meta-label">Mine / Project</span>
                    <span className="meta-val">{selectedDoc.mine}</span>
                  </div>
                  <div className="meta-card">
                    <span className="meta-label">Subsidiary</span>
                    <span className="meta-val">{selectedDoc.subsidiary}</span>
                  </div>
                  <div className="meta-card">
                    <span className="meta-label">Reporting Period</span>
                    <span className="meta-val">{selectedDoc.period}</span>
                  </div>
                  <div className="meta-card">
                    <span className="meta-label">Pages & Size</span>
                    <span className="meta-val">{selectedDoc.pages} pages ({selectedDoc.size})</span>
                  </div>
                </div>

                <div className="provenance-hash-box">
                  <div className="hash-label">
                    <Hash size={14} /> SHA-256 Provenance Fingerprint:
                  </div>
                  <div className="hash-code">{selectedDoc.sha256}</div>
                </div>

                <div className="extracted-section">
                  <h3 className="section-subheading">Extracted Text Content (Document AI)</h3>
                  <div className="text-content-box">
                    {selectedDoc.contentSnippet}
                  </div>
                </div>

                <div className="extracted-section">
                  <h3 className="section-subheading">Associated Structured Facts</h3>
                  <div className="mini-facts-table">
                    {facts.filter(f => f.docId === selectedDoc.id).map(f => (
                      <div key={f.factId} className="mini-fact-row">
                        <div>
                          <div className="mini-fact-id">{f.factId}</div>
                          <div className="mini-fact-metric">{f.metric}</div>
                        </div>
                        <div className="mini-fact-val">
                          {f.unit}
                        </div>
                        <span className="status-pill pill-verified">{f.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setSelectedDoc(null)} className="btn-modal-close">
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
