import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Float } from '@react-three/drei'
import * as THREE from 'three'
import {
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Compass,
  Zap,
  Info
} from 'lucide-react'

// ── 1. Layered Geological Strata Model ────────────────────────────────────────
function GeologicalStratum({
  position,
  color,
  opacity = 0.85,
  name,
  thickness = 0.45,
  wireframe = false,
  densityVal,
}: {
  position: [number, number, number]
  color: string
  opacity?: number
  name: string
  thickness?: number
  wireframe?: boolean
  densityVal: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[4.2, thickness, 3.2]} />
        <meshStandardMaterial
          color={hovered ? '#00F0B5' : color}
          wireframe={wireframe}
          transparent
          opacity={hovered ? 0.95 : opacity}
          roughness={0.25}
          metalness={0.7}
          emissive={hovered ? '#00F0B5' : color}
          emissiveIntensity={hovered ? 0.45 : 0.12}
        />
      </mesh>

      {/* Edge Wireframe Outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(4.22, thickness + 0.02, 3.22)]} />
        <lineBasicMaterial
          color={hovered ? '#00F0B5' : '#00D8F6'}
          transparent
          opacity={hovered ? 0.9 : 0.25}
        />
      </lineSegments>

      {hovered && (
        <Html position={[2.3, 0, 0]} distanceFactor={8} center>
          <div className="mine-3d-tooltip">
            <div className="tooltip-title">{name}</div>
            <div className="tooltip-sub">Density: {densityVal}</div>
            <div className="tooltip-stat">Status: Validated Strata</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ── 2. Laser Borehole Inspection Probe ────────────────────────────────────────
function BoreholeLaserProbe({
  position,
  label,
  depth,
  grade,
}: {
  position: [number, number, number]
  label: string
  depth: string
  grade: string
}) {
  const cylinderRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (cylinderRef.current) {
      cylinderRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.08
    }
  })

  return (
    <group position={position}>
      {/* Vertical Laser Beam */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 3.6, 16]} />
        <meshBasicMaterial color="#00F0B5" transparent opacity={0.75} />
      </mesh>

      {/* Sensor Beacon Head */}
      <mesh
        ref={cylinderRef}
        position={[0, 1.85, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color="#00D8F6"
          emissive="#00D8F6"
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      <Html position={[0, 2.3, 0]} distanceFactor={7} center>
        <div className={`sensor-tag-marker ${hovered ? 'marker-hovered' : ''}`}>
          <div className="marker-header">
            <span className="marker-pulse" />
            <span className="marker-name">{label}</span>
          </div>
          {hovered && (
            <div className="marker-detail">
              <div>Depth: {depth}</div>
              <div>Grade: {grade}</div>
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

// ── 3. Rotating 3D Scene Root ─────────────────────────────────────────────────
function MineSceneContent({
  autoRotateSpeed,
  wireframeMode,
}: {
  autoRotateSpeed: number
  wireframeMode: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (groupRef.current && autoRotateSpeed > 0) {
      groupRef.current.rotation.y = t * (0.08 * autoRotateSpeed)
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Strata Layer 1: Topsoil / Overburden */}
      <GeologicalStratum
        position={[0, 1.2, 0]}
        color="#8B7355"
        name="Topsoil & Overburden (OB)"
        thickness={0.4}
        wireframe={wireframeMode}
        densityVal="1.82 g/cm³"
      />

      {/* Strata Layer 2: Sandstone & Shale Interburden */}
      <GeologicalStratum
        position={[0, 0.65, 0]}
        color="#3A506B"
        name="Upper Sandstone & Shale Horizon"
        thickness={0.55}
        wireframe={wireframeMode}
        densityVal="2.45 g/cm³"
      />

      {/* Strata Layer 3: Main Coal Seam Alpha (Gevra Seam VI) */}
      <GeologicalStratum
        position={[0, -0.05, 0]}
        color="#00F0B5"
        name="Primary Coal Seam (Gevra VI-A)"
        thickness={0.7}
        wireframe={wireframeMode}
        densityVal="1.38 g/cm³ (GCV: 4,820 kcal/kg)"
      />

      {/* Strata Layer 4: Lower Carbonaceous Shale */}
      <GeologicalStratum
        position={[0, -0.75, 0]}
        color="#1F2937"
        name="Lower Carbonaceous Siltstone"
        thickness={0.5}
        wireframe={wireframeMode}
        densityVal="2.58 g/cm³"
      />

      {/* Strata Layer 5: Basal Granitic Bedrock */}
      <GeologicalStratum
        position={[0, -1.35, 0]}
        color="#111827"
        name="Basal Archean Bedrock Horizon"
        thickness={0.55}
        wireframe={wireframeMode}
        densityVal="2.89 g/cm³"
      />

      {/* Borehole Laser Sensor Probes */}
      <BoreholeLaserProbe
        position={[-1.2, 0, 0.8]}
        label="BH-GEV-204"
        depth="142.5m"
        grade="G-11 High Grade"
      />
      <BoreholeLaserProbe
        position={[1.1, 0, -0.7]}
        label="BH-KUS-89"
        depth="168.0m"
        grade="G-10 Prime Seam"
      />
      <BoreholeLaserProbe
        position={[0.3, 0, 1.0]}
        label="BH-RAJ-12"
        depth="95.2m"
        grade="G-12 Standard"
      />
    </group>
  )
}

// ── 4. Main Exported 3D Mining Digital Twin Component ─────────────────────────
export function Interactive3DMineModel() {
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.5) // Slow motion default
  const [wireframeMode, setWireframeMode] = useState<boolean>(false)

  return (
    <div className="mine-3d-container">
      {/* 3D Model Header Controls */}
      <div className="mine-3d-header">
        <div className="mine-3d-title-block">
          <div className="live-pulse-badge">
            <span className="pulse-dot" /> 3D GEOLOGICAL DIGITAL TWIN
          </div>
          <h3 className="mine-3d-title">CIL Multi-Seam Spatial Strata Model</h3>
          <p className="mine-3d-subtitle">
            Interactive real-time 3D telemetry showing borehole survey logs, density horizons, and seam provenance.
          </p>
        </div>

        <div className="mine-3d-controls-bar">
          <button
            type="button"
            className={`btn-control-pill ${rotationSpeed === 0 ? 'active' : ''}`}
            onClick={() => setRotationSpeed(0)}
          >
            <RotateCcw size={13} /> Pause
          </button>
          <button
            type="button"
            className={`btn-control-pill ${rotationSpeed === 0.5 ? 'active' : ''}`}
            onClick={() => setRotationSpeed(0.5)}
          >
            <Sparkles size={13} /> Slow Motion
          </button>
          <button
            type="button"
            className={`btn-control-pill ${rotationSpeed === 1.5 ? 'active' : ''}`}
            onClick={() => setRotationSpeed(1.5)}
          >
            <Zap size={13} /> Realtime
          </button>
          <button
            type="button"
            className={`btn-control-pill ${wireframeMode ? 'active' : ''}`}
            onClick={() => setWireframeMode(!wireframeMode)}
          >
            <Layers size={13} /> Wireframe
          </button>
        </div>
      </div>

      {/* WebGL 3D Canvas Box */}
      <div className="mine-3d-canvas-box">
        <Canvas
          camera={{ position: [5.5, 3.8, 6.2], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 15, 10]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, -5, -8]} intensity={0.6} color="#00ffcc" />
          <pointLight position={[0, 4, 0]} intensity={1.8} color="#00F0B5" />

          <Float speed={0.4} rotationIntensity={0.2} floatIntensity={0.3}>
            <MineSceneContent
              autoRotateSpeed={rotationSpeed}
              wireframeMode={wireframeMode}
            />
          </Float>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={4}
            maxDistance={14}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Canvas>

        {/* 3D Canvas Corner Badges */}
        <div className="canvas-badge-overlay-top">
          <span className="badge-item">
            <Compass size={12} /> True North: 024° NE
          </span>
          <span className="badge-item">
            <Activity size={12} /> Active Boreholes: 3 Live
          </span>
        </div>

        <div className="canvas-badge-overlay-bottom">
          <span className="badge-help">
            <Info size={12} /> Drag to rotate 3D view • Scroll to zoom • Hover layers for strata telemetry
          </span>
        </div>
      </div>
    </div>
  )
}
