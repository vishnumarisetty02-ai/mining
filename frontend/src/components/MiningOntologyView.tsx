import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Layers, Building, Calculator, ArrowRight } from 'lucide-react';
import { ONTOLOGY_GRADES, SUBSIDIARIES_DATA } from '../data/mockData';

export const MiningOntologyView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'grades' | 'subsidiaries' | 'converter'>('grades');

  // Converter state
  const [inputVal, setInputVal] = useState(3.5);
  const [fromUnit, setFromUnit] = useState('MT');

  const filteredGrades = ONTOLOGY_GRADES.filter(g => 
    g.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.gcvRange.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h1 className="view-page-title">Mining Domain Ontology & Grade Matrix</h1>
          <p className="view-page-caption">
            Canonical taxonomy for Coal India subsidiaries, Ministry of Coal G1–G17 GCV grade bands, and standardized metric normalizers.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="ontology-tab-bar">
        <button 
          className={`tab-switch-btn ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          <Layers size={16} /> GCV Coal Grades (G1 - G17)
        </button>
        <button 
          className={`tab-switch-btn ${activeTab === 'subsidiaries' ? 'active' : ''}`}
          onClick={() => setActiveTab('subsidiaries')}
        >
          <Building size={16} /> Coal India Subsidiaries
        </button>
        <button 
          className={`tab-switch-btn ${activeTab === 'converter' ? 'active' : ''}`}
          onClick={() => setActiveTab('converter')}
        >
          <Calculator size={16} /> Unit Normalization Calculator
        </button>
      </div>

      {/* View Content: Grades */}
      {activeTab === 'grades' && (
        <div className="glass-panel-section">
          <div className="table-controls-bar">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text"
                placeholder="Search grades (e.g. G10, 4800, Thermal Power)..."
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
                  <th>COAL GRADE</th>
                  <th>GCV RANGE (KCAL/KG)</th>
                  <th>CLASSIFICATION CATEGORY</th>
                  <th>PRIMARY STATUTORY UTILIZATION</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((grade) => (
                  <tr key={grade.grade} className="table-data-row">
                    <td>
                      <span className="grade-badge-chip">{grade.grade}</span>
                    </td>
                    <td>
                      <span className="gcv-range-bold">{grade.gcvRange}</span>
                    </td>
                    <td>{grade.category}</td>
                    <td>
                      <span className="grade-use-text">{grade.primaryUse}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Content: Subsidiaries */}
      {activeTab === 'subsidiaries' && (
        <div className="subsidiary-cards-grid">
          {SUBSIDIARIES_DATA.map((sub) => (
            <motion.div 
              key={sub.code} 
              className="subsidiary-profile-card"
              whileHover={{ y: -4, borderColor: '#00F0B5' }}
            >
              <div className="sub-header-line">
                <div className="sub-code-large">{sub.code}</div>
                <span className="cil-tag">Coal India Sub</span>
              </div>
              <h3 className="sub-full-name">{sub.name}</h3>
              <div className="sub-hq-line">📍 Headquarters: {sub.hq}</div>
              <p className="sub-role-desc">{sub.role}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Content: Unit Normalizer */}
      {activeTab === 'converter' && (
        <div className="glass-panel-section converter-container">
          <h2 className="section-title">Standardized Mining Unit Converter</h2>
          <p className="section-caption">Converts arbitrary report terminology to canonical SI and statutory units.</p>

          <div className="converter-card-box">
            <div className="converter-input-group">
              <label>Input Value:</label>
              <input 
                type="number" 
                value={inputVal} 
                onChange={(e) => setInputVal(parseFloat(e.target.value) || 0)}
                className="converter-num-input"
              />
            </div>

            <div className="converter-input-group">
              <label>From Reporting Unit:</label>
              <select 
                value={fromUnit} 
                onChange={(e) => setFromUnit(e.target.value)}
                className="custom-dropdown"
              >
                <option value="MT">Million Tonnes (MT)</option>
                <option value="Lakh Tonnes">Lakh Tonnes (LT)</option>
                <option value="MCum">Million Cubic Metres (MCum)</option>
                <option value="Kcal/kg">Gross Calorific Value (kcal/kg)</option>
              </select>
            </div>

            <div className="converter-arrow-box">
              <ArrowRight size={24} className="text-emerald" />
            </div>

            <div className="converter-result-box">
              <span className="res-label">Canonical Standardized Value:</span>
              <div className="res-value">
                {fromUnit === 'MT' && `${(inputVal * 1000000).toLocaleString()} Tonnes`}
                {fromUnit === 'Lakh Tonnes' && `${(inputVal * 100000).toLocaleString()} Tonnes (${(inputVal * 0.1).toFixed(2)} MT)`}
                {fromUnit === 'MCum' && `${(inputVal * 1000000).toLocaleString()} m³ Overburden`}
                {fromUnit === 'Kcal/kg' && `${inputVal} kcal/kg (Validated)`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
