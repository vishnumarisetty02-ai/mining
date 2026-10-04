import { useState, useRef } from 'react'
import { motion, type Variants, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  ArrowDown,
  Database,
  Cpu,
  Search,
  FileText,
  Bot,
  Shield,
  CheckCircle,
  FileCheck2,
  Zap,
  Layers,
  Sparkles,
  Eye,
  Maximize2
} from 'lucide-react'

export default function WorkflowDiagram() {
  const [viewMode, setViewMode] = useState<'3d-isometric' | '3d-perspective' | 'flat'>('3d-perspective')
  const [activeStage, setActiveStage] = useState<string | null>(null)

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 110, damping: 14 }
    }
  }

  // ── Gyroscopic 3D tilt node ──
  const Node = ({
    id,
    icon: Icon,
    title,
    subtitle,
    tag,
    isHighlight = false,
    latency,
  }: {
    id: string
    icon: any
    title: string
    subtitle?: string
    tag?: string
    isHighlight?: boolean
    latency?: string
  }) => {
    const isSelected = activeStage === id
    const cardRef = useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const rotateX = useSpring(useTransform(mouseY, [-1, 1], [10, -10]), { stiffness: 80, damping: 20 })
    const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-10, 10]), { stiffness: 80, damping: 20 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = cardRef.current?.getBoundingClientRect()
      if (!rect) return
      mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1)
      mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }
    const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0) }

    return (
      <motion.div
        ref={cardRef}
        variants={item}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
        whileHover={{ scale: 1.032, z: 18 }}
        whileTap={{ scale: 0.97 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setActiveStage(isSelected ? null : id)}
        className={`glass-card node-card-3d ${isHighlight ? 'highlight-node-3d' : ''} ${isSelected ? 'active-selected-node' : ''}`}
      >
        {/* Slow Motion 3D Shimmer Overlay */}
        <div className="card-3d-shimmer" />

        <div className="node-icon-3d-wrap">
          <div className="node-icon-3d">
            <Icon size={22} />
          </div>
          {isHighlight && (
            <span className="pulse-beacon">
              <span className="pulse-beacon-ping" />
              <span className="pulse-beacon-dot" />
            </span>
          )}
        </div>

        <div className="node-text-3d">
          <div className="node-header-line">
            <h3>{title}</h3>
            {tag && <span className="node-tag-pill">{tag}</span>}
          </div>
          {subtitle && <p className="node-subtitle-text">{subtitle}</p>}
          {latency && (
            <div className="node-telemetry-row">
              <span className="telemetry-item">
                <Zap size={11} className="telemetry-icon" /> {latency}
              </span>
              <span className="telemetry-status">ONLINE</span>
            </div>
          )}
        </div>

        {/* 3D Corner Accent */}
        <div className="node-3d-corner" />

        {/* Depth face — gives the card a 3D extruded bottom edge */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          background: 'linear-gradient(180deg, transparent 70%, rgba(0,240,181,0.04) 100%)',
          transform: 'translateZ(-6px)', pointerEvents: 'none'
        }} />
      </motion.div>
    )
  }

  const FlowPulseConnector = ({ label }: { label?: string }) => (
    <motion.div variants={item} className="flow-connector-wrap">
      <div className="energy-beam-line">
        <div className="energy-pulse-particle slow-pulse" />
      </div>
      <div className="arrow-down-3d">
        <ArrowDown size={18} />
      </div>
      {label && <span className="connector-label-chip">{label}</span>}
    </motion.div>
  )

  return (
    <div className={`workflow-container-3d mode-${viewMode}`}>
      {/* ── Animated Background Canvas ── */}
      <div className="workflow-bg-canvas">
        <div className="wf-orb wf-orb-1" />
        <div className="wf-orb wf-orb-2" />
        <div className="wf-orb wf-orb-3" />
      </div>
      {/* 3D Perspective Controls */}
      <div className="workflow-view-controls">
        <div className="controls-label">
          <Layers size={14} className="accent-icon" /> 3D Viewport Mode:
        </div>
        <div className="view-mode-buttons">
          <button
            type="button"
            className={`btn-mode-toggle ${viewMode === '3d-perspective' ? 'active' : ''}`}
            onClick={() => setViewMode('3d-perspective')}
          >
            <Sparkles size={13} /> 3D Holographic
          </button>
          <button
            type="button"
            className={`btn-mode-toggle ${viewMode === '3d-isometric' ? 'active' : ''}`}
            onClick={() => setViewMode('3d-isometric')}
          >
            <Maximize2 size={13} /> 3D Isometric
          </button>
          <button
            type="button"
            className={`btn-mode-toggle ${viewMode === 'flat' ? 'active' : ''}`}
            onClick={() => setViewMode('flat')}
          >
            <Eye size={13} /> Orthographic 2D
          </button>
        </div>
      </div>

      <motion.div
        className="workflow-stage-viewport"
        variants={container}
        initial="hidden"
        animate="visible"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Stage 1: Document Ingestion */}
        <Node
          id="ingestion"
          icon={FileText}
          title="CMPDI / CIL DOCUMENTS"
          subtitle="Mining Reports • Geo-Surveys • Production Ledgers • Safety Filings"
          tag="INGESTION"
          latency="~18ms / doc"
        />
        <FlowPulseConnector label="Multi-modal Ingestion" />

        {/* Stage 2: Document AI */}
        <Node
          id="doc-ai"
          icon={Cpu}
          title="DOCUMENT AI NEURAL PIPELINE"
          subtitle="OCR Engine • Spatial Table Extraction • Domain Named-Entity Recognition"
          tag="AI EXTRACTOR"
          latency="42ms / page"
        />
        <FlowPulseConnector label="Structured Extraction" />

        {/* Stage 3: Domain Data Layer */}
        <Node
          id="domain-layer"
          icon={Database}
          title="DOMAIN DATA LAYER"
          subtitle="Entity Graph • Coal Seam Ontologies • Multi-Subsidiary RLS Isolation"
          isHighlight
          tag="CORE ORCHESTRATOR"
          latency="4.8ms query"
        />
        <FlowPulseConnector label="Ontological Alignment" />

        {/* Stage 4: Normalization Engine */}
        <Node
          id="normalization"
          icon={Bot}
          title="NORMALIZATION ENGINE"
          subtitle="Unit Standardizer (MT, kL, Ha) • ISO-8601 Temporal Resolver • Canonical Aliases"
          tag="NORMALIZER"
          latency="6.2ms"
        />
        <FlowPulseConnector label="Canonical Harmonization" />

        {/* Stage 5: Validation Engine */}
        <Node
          id="validation"
          icon={Shield}
          title="VALIDATION ENGINE"
          subtitle="Mathematical Invariant Verification • Temporal Cross-Document Discrepancy Checks"
          tag="VALIDATOR"
          latency="12ms"
        />
        <FlowPulseConnector label="Certified Consistency" />

        {/* Stage 6: Trusted Fact Store */}
        <Node
          id="fact-store"
          icon={Database}
          title="TRUSTED FACT STORE"
          subtitle="Cryptographic SHA-256 Provenance • Append-Only Ledger • Strict Audit Lineage"
          isHighlight
          tag="LEDGER REPOSITORY"
          latency="1.4ms"
        />

        {/* Split Multi-Branch Engine */}
        <div className="split-branch-container">
          <div className="split-branch-lines">
            <div className="branch-line branch-left">
              <div className="energy-pulse-particle slow-pulse" />
            </div>
            <div className="branch-line branch-center">
              <div className="energy-pulse-particle slow-pulse" />
            </div>
            <div className="branch-line branch-right">
              <div className="energy-pulse-particle slow-pulse" />
            </div>
          </div>

          <motion.div variants={item} className="split-nodes-3d">
            <Node
              id="rag"
              icon={Search}
              title="RAG SEARCH"
              subtitle="Hybrid Dense/Sparse Vector Retr."
              tag="SEMANTIC"
              latency="19ms"
            />
            <Node
              id="report-ai"
              icon={FileText}
              title="REPORT AI"
              subtitle="Statutory PDF & Board Briefs"
              tag="GENERATOR"
              latency="850ms"
            />
            <Node
              id="topic-ai"
              icon={Bot}
              title="TOPIC AI"
              subtitle="Parliamentary Q&A Copilot"
              tag="INTELLIGENCE"
              latency="240ms"
            />
          </motion.div>

          <div className="join-branch-lines">
            <div className="join-line branch-left">
              <div className="energy-pulse-particle slow-pulse" />
            </div>
            <div className="join-line branch-center">
              <div className="energy-pulse-particle slow-pulse" />
            </div>
            <div className="join-line branch-right">
              <div className="energy-pulse-particle slow-pulse" />
            </div>
          </div>
        </div>

        {/* Stage 8: Consistency Firewall */}
        <Node
          id="firewall"
          icon={Shield}
          title="DETERMINISTIC CONSISTENCY FIREWALL"
          subtitle="Hard Blocking of Hallucinations • Zero-Tolerance Threshold Enforcement • Automated Rejection"
          isHighlight
          tag="SECURITY GATEWAY"
          latency="3.1ms check"
        />
        <FlowPulseConnector label="Strict Signoff Protocol" />

        {/* Stage 9: Human Review & Certification */}
        <Node
          id="human-review"
          icon={CheckCircle}
          title="EXPERT HUMAN REVIEW & SIGN-OFF"
          subtitle="Chief Mining Engineer Authorization • Multi-Party Digital Cryptographic Signature"
          tag="GOVERNANCE"
          latency="Interactive"
        />
        <FlowPulseConnector label="Audited Clearance" />

        {/* Stage 10: Final Output */}
        <Node
          id="final-output"
          icon={FileCheck2}
          title="FINAL CERTIFIED STATUTORY OUTPUT"
          subtitle="100% Deterministically Traceable • Court/Parliament Grade Evidence Repository"
          isHighlight
          tag="ENTERPRISE OUTPUT"
          latency="Verified"
        />
      </motion.div>
    </div>
  )
}
