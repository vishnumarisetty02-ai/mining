import { useState, useRef, useEffect, useCallback } from "react"
import {
  motion,
  AnimatePresence,
  type Variants,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  useReducedMotion,
} from "framer-motion"
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
  Maximize2,
  Activity,
  Lock,
} from "lucide-react"

interface StageNode {
  id: string
  icon: React.ElementType
  title: string
  subtitle?: string
  tag?: string
  isHighlight?: boolean
  latency?: string
  stageNum: number
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let raf: number

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const COUNT = 55
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      opacity: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.6 ? 168 : 192,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0, 240, 181, ${0.08 * (1 - dist / 110)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.opacity})`
        ctx.fill()

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5)
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, 0.15)`)
        grad.addColorStop(1, "transparent")
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.55,
      }}
    />
  )
}

function ProgressRing({ pct, color = "#00F0B5", size = 56 }: { pct: number; color?: string; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 1.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}

function StageBadge({ num }: { num: number }) {
  return (
    <motion.div
      className="stage-badge-3d"
      initial={{ scale: 0, opacity: 0, rotateY: -90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 18, delay: num * 0.08 }}
    >
      {String(num).padStart(2, "0")}
    </motion.div>
  )
}

function TiltCard({ children, className = "", intensity = 10 }: { children: React.ReactNode; className?: string; intensity?: number }) {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotX = useSpring(useTransform(my, [-1, 1], [intensity, -intensity]), { stiffness: 100, damping: 22 })
  const rotY = useSpring(useTransform(mx, [-1, 1], [-intensity, intensity]), { stiffness: 100, damping: 22 })
  const glowX = useTransform(mx, [-1, 1], ["0%", "100%"])
  const glowY = useTransform(my, [-1, 1], ["0%", "100%"])

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1)
    my.set(((e.clientY - rect.top) / rect.height) * 2 - 1)
  }, [reduced, mx, my])
  const onLeave = useCallback(() => { mx.set(0); my.set(0) }, [mx, my])

  const bgStyle = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.07) 0%, transparent 60%)`
  )

  return (
    <motion.div
      ref={cardRef}
      className={className}
      style={{
        rotateX: reduced ? 0 : rotX,
        rotateY: reduced ? 0 : rotY,
        transformStyle: "preserve-3d",
        perspective: 900,
        position: "relative",
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {!reduced && (
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background: bgStyle,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
      )}
      {children}
    </motion.div>
  )
}

export default function WorkflowDiagram() {
  const [viewMode, setViewMode] = useState<"3d-isometric" | "3d-perspective" | "flat">("3d-perspective")
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [hoveredStage, setHoveredStage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: scrollRef })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -40])

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  }

  const item3d: Variants = {
    hidden:   { opacity: 0, y: 32, scale: 0.92, rotateX: -20, filter: "blur(6px)" },
    visible:  { opacity: 1, y: 0,  scale: 1,    rotateX: 0,   filter: "blur(0px)",
      transition: { type: "spring", stiffness: 90, damping: 16 } },
  }

  const Node = ({ id, icon: Icon, title, subtitle, tag, isHighlight = false, latency, stageNum }: StageNode) => {
    const isSelected = activeStage === id
    const isHovered  = hoveredStage === id
    const ringPct    = latency === "Verified" ? 100 : latency === "Interactive" ? 72 : 85

    return (
      <motion.div variants={item3d} style={{ width: "100%", display: "flex", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)", zIndex: 10 }}>
          <StageBadge num={stageNum} />
        </div>

        <TiltCard
          className={`node-card-3d ${isHighlight ? "highlight-node-3d" : ""} ${isSelected ? "active-selected-node" : ""}`}
          intensity={isHovered ? 14 : 8}
        >
          <div className="card-3d-shimmer" />
          <div className="card-extrude-edge" />

          <motion.div
            style={{ display: "flex", alignItems: "center", gap: "1.4rem", width: "100%", position: "relative", zIndex: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveStage(isSelected ? null : id)}
            onHoverStart={() => setHoveredStage(id)}
            onHoverEnd={() => setHoveredStage(null)}
          >
            <div className="node-icon-3d-wrap">
              <div style={{ position: "relative", width: 56, height: 56 }}>
                <ProgressRing pct={ringPct} color={isHighlight ? "#00F0B5" : "#00D8F6"} size={56} />
                <div className="node-icon-3d" style={{ position: "absolute", inset: 4 }}>
                  <Icon size={20} />
                </div>
              </div>
              {isHighlight && (
                <span className="pulse-beacon">
                  <span className="pulse-beacon-ping" />
                  <span className="pulse-beacon-dot" />
                </span>
              )}
            </div>

            <div className="node-text-3d" style={{ flex: 1 }}>
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
                  <span className="telemetry-status">? LIVE</span>
                </div>
              )}
            </div>

            <div className="node-status-col">
              {isHighlight
                ? <Lock size={14} style={{ color: "#00F0B5", filter: "drop-shadow(0 0 6px #00F0B5)" }} />
                : <Activity size={14} style={{ color: "#00D8F6", opacity: 0.7 }} />}
            </div>
          </motion.div>

          <AnimatePresence>
            {isSelected && (
              <motion.div
                className="node-detail-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="detail-panel-inner">
                  <div className="detail-metric-row">
                    <span className="detail-metric">
                      <span className="dm-label">Stage</span>
                      <span className="dm-value">#{String(stageNum).padStart(2, "0")}</span>
                    </span>
                    <span className="detail-metric">
                      <span className="dm-label">Latency</span>
                      <span className="dm-value">{latency ?? "—"}</span>
                    </span>
                    <span className="detail-metric">
                      <span className="dm-label">Status</span>
                      <span className="dm-value" style={{ color: "#00F0B5" }}>NOMINAL</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="node-3d-corner" />
        </TiltCard>
      </motion.div>
    )
  }

  const FlowPulseConnector = ({ label }: { label?: string }) => (
    <motion.div variants={item3d} className="flow-connector-wrap">
      <div className="energy-beam-line">
        <div className="energy-pulse-particle slow-pulse" />
        <div className="energy-pulse-particle slow-pulse" style={{ animationDelay: "1.1s", opacity: 0.5, height: "10px" }} />
      </div>
      <motion.div
        className="arrow-down-3d"
        animate={{ y: [0, 5, 0], scale: [1, 1.07, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown size={18} />
      </motion.div>
      {label && <span className="connector-label-chip">{label}</span>}
    </motion.div>
  )

  const vpTransform =
    viewMode === "3d-perspective" ? "rotateX(8deg)"
    : viewMode === "3d-isometric" ? "rotateX(18deg) rotateY(-8deg) rotateZ(3deg) scale(0.96)"
    : "none"

  return (
    <div className={`workflow-container-3d mode-${viewMode}`} style={{ position: "relative", overflow: "hidden" }}>
      <div className="workflow-bg-canvas">
        <ParticleField />
        <div className="wf-orb wf-orb-1" />
        <div className="wf-orb wf-orb-2" />
        <div className="wf-orb wf-orb-3" />
      </div>

      <motion.div
        className="workflow-view-controls"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="controls-label">
          <Layers size={14} className="accent-icon" /> 3D Viewport Mode:
        </div>
        <div className="view-mode-buttons">
          <button type="button" className={`btn-mode-toggle ${viewMode === "3d-perspective" ? "active" : ""}`} onClick={() => setViewMode("3d-perspective")}>
            <Sparkles size={13} /> 3D Holographic
          </button>
          <button type="button" className={`btn-mode-toggle ${viewMode === "3d-isometric" ? "active" : ""}`} onClick={() => setViewMode("3d-isometric")}>
            <Maximize2 size={13} /> 3D Isometric
          </button>
          <button type="button" className={`btn-mode-toggle ${viewMode === "flat" ? "active" : ""}`} onClick={() => setViewMode("flat")}>
            <Eye size={13} /> Orthographic 2D
          </button>
        </div>
      </motion.div>

      <div ref={scrollRef} style={{ width: "100%", maxHeight: "80vh", overflowY: "auto", overflowX: "visible", paddingBottom: "2rem" }}>
        <motion.div
          className="workflow-stage-viewport"
          style={{ transform: vpTransform, transformStyle: "preserve-3d", y: parallaxY }}
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <Node id="ingestion"     icon={FileText}    title="CMPDI / CIL DOCUMENTS"              subtitle="Mining Reports • Geo-Surveys • Production Ledgers • Safety Filings"                            tag="INGESTION"        latency="~18ms / doc"  stageNum={1} />
          <FlowPulseConnector label="Multi-modal Ingestion" />

          <Node id="doc-ai"        icon={Cpu}         title="DOCUMENT AI NEURAL PIPELINE"        subtitle="OCR Engine • Spatial Table Extraction • Domain Named-Entity Recognition"                        tag="AI EXTRACTOR"     latency="42ms / page"  stageNum={2} />
          <FlowPulseConnector label="Structured Extraction" />

          <Node id="domain-layer"  icon={Database}    title="DOMAIN DATA LAYER"                  subtitle="Entity Graph • Coal Seam Ontologies • Multi-Subsidiary RLS Isolation"  isHighlight tag="CORE ORCHESTRATOR" latency="4.8ms query"  stageNum={3} />
          <FlowPulseConnector label="Ontological Alignment" />

          <Node id="normalization" icon={Bot}          title="NORMALIZATION ENGINE"                subtitle="Unit Standardizer (MT, kL, Ha) • ISO-8601 Temporal Resolver • Canonical Aliases"              tag="NORMALIZER"       latency="6.2ms"        stageNum={4} />
          <FlowPulseConnector label="Canonical Harmonization" />

          <Node id="validation"    icon={Shield}       title="VALIDATION ENGINE"                  subtitle="Mathematical Invariant Verification • Temporal Cross-Document Discrepancy Checks"              tag="VALIDATOR"        latency="12ms"         stageNum={5} />
          <FlowPulseConnector label="Certified Consistency" />

          <Node id="fact-store"    icon={Database}    title="TRUSTED FACT STORE"                 subtitle="Cryptographic SHA-256 Provenance • Append-Only Ledger • Strict Audit Lineage"   isHighlight tag="LEDGER REPOSITORY" latency="1.4ms"        stageNum={6} />

          <motion.div variants={item3d} style={{ width: "100%", maxWidth: 720 }}>
            <div className="split-branch-container">
              <div className="split-branch-lines">
                <div className="branch-line branch-left"><div className="energy-pulse-particle slow-pulse" /></div>
                <div className="branch-line branch-center"><div className="energy-pulse-particle slow-pulse" /></div>
                <div className="branch-line branch-right"><div className="energy-pulse-particle slow-pulse" /></div>
              </div>
              <div className="split-nodes-3d">
                <Node id="rag"       icon={Search}   title="RAG SEARCH"  subtitle="Hybrid Dense/Sparse Vector Retr." tag="SEMANTIC"     latency="19ms"  stageNum={7} />
                <Node id="report-ai" icon={FileText} title="REPORT AI"   subtitle="Statutory PDF & Board Briefs"     tag="GENERATOR"    latency="850ms" stageNum={7} />
                <Node id="topic-ai"  icon={Bot}      title="TOPIC AI"    subtitle="Parliamentary Q&A Copilot"        tag="INTELLIGENCE" latency="240ms" stageNum={7} />
              </div>
              <div className="join-branch-lines">
                <div className="join-line branch-left"><div className="energy-pulse-particle slow-pulse" /></div>
                <div className="join-line branch-center"><div className="energy-pulse-particle slow-pulse" /></div>
                <div className="join-line branch-right"><div className="energy-pulse-particle slow-pulse" /></div>
              </div>
            </div>
          </motion.div>

          <Node id="firewall"      icon={Shield}       title="DETERMINISTIC CONSISTENCY FIREWALL" subtitle="Hard Blocking of Hallucinations • Zero-Tolerance Threshold Enforcement • Automated Rejection" isHighlight tag="SECURITY GATEWAY" latency="3.1ms check" stageNum={8} />
          <FlowPulseConnector label="Strict Signoff Protocol" />

          <Node id="human-review"  icon={CheckCircle}  title="EXPERT HUMAN REVIEW & SIGN-OFF"     subtitle="Chief Mining Engineer Authorization • Multi-Party Digital Cryptographic Signature"            tag="GOVERNANCE"       latency="Interactive"  stageNum={9} />
          <FlowPulseConnector label="Audited Clearance" />

          <Node id="final-output"  icon={FileCheck2}   title="FINAL CERTIFIED STATUTORY OUTPUT"   subtitle="100% Deterministically Traceable • Court/Parliament Grade Evidence Repository" isHighlight tag="ENTERPRISE OUTPUT" latency="Verified"     stageNum={10} />
        </motion.div>
      </div>
    </div>
  )
}
