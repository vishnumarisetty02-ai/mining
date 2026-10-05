import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars, Torus, Trail } from '@react-three/drei'
import * as THREE from 'three'
import { useAnimSignals } from './BackendAnimContext'

// ── 1. Floating Crystal Polyhedron ────────────────────────────────────────────
function FloatingCrystal({
  position,
  scale = 1,
  speed = 0.5,
  color = '#00F0B5',
  type = 'octahedron',
}: {
  position: [number, number, number]
  scale?: number
  speed?: number
  color?: string
  type?: 'octahedron' | 'dodecahedron' | 'tetrahedron' | 'icosahedron'
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.Mesh>(null)
  const offset = useMemo(() => Math.random() * 10, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed * 0.6 + offset
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.07
      meshRef.current.rotation.y = t * 0.11
      meshRef.current.position.y = position[1] + Math.sin(t * 0.25) * 0.35
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = -t * 0.05
      wireRef.current.rotation.z = t * 0.08
      wireRef.current.position.y = position[1] + Math.sin(t * 0.25) * 0.35
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} scale={scale}>
        {type === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        {type === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
        {type === 'tetrahedron' && <tetrahedronGeometry args={[1, 0]} />}
        {type === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        <meshPhysicalMaterial
          color={color}
          roughness={0.12}
          metalness={0.9}
          transmission={0.4}
          thickness={0.8}
          transparent
          opacity={0.7}
          emissive={color}
          emissiveIntensity={0.25}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh ref={wireRef} scale={scale * 1.18}>
        {type === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        {type === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
        {type === 'tetrahedron' && <tetrahedronGeometry args={[1, 0]} />}
        {type === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        <meshStandardMaterial
          color={color}
          wireframe
          transparent
          opacity={0.35}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  )
}

// ── 2. Central Core — tinted by backend alert color ───────────────────────────
function CentralCore() {
  const { alertColor, pulseRate, verifiedRatio, backendOnline } = useAnimSignals()
  const sphereRef = useRef<THREE.Mesh>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)

  // Lerp target color from backend alert
  const targetColor = useMemo(() => new THREE.Color(alertColor), [alertColor])
  const currentColor = useRef(new THREE.Color('#00F0B5'))

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // Smooth color transition
    currentColor.current.lerp(targetColor, 0.02)

    const distortSpeed = backendOnline ? 0.35 + pulseRate * 0.4 : 0.35

    if (sphereRef.current) {
      sphereRef.current.rotation.x = t * 0.025
      sphereRef.current.rotation.y = t * 0.035
      // Pulse emissive with pulseRate
      const mat = sphereRef.current.material as THREE.MeshStandardMaterial
      if (mat && 'emissive' in mat) {
        mat.emissive = currentColor.current
        mat.emissiveIntensity = 0.2 + Math.sin(t * (1 + pulseRate * 3)) * 0.15
      }
      void distortSpeed // used via MeshDistortMaterial speed prop below
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.03
      ring1Ref.current.rotation.y = t * 0.05
      const mat = ring1Ref.current.material as THREE.MeshStandardMaterial
      if (mat) mat.color = currentColor.current
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.035
      ring2Ref.current.rotation.z = t * 0.042
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -t * 0.025
      ring3Ref.current.rotation.z = -t * 0.03
    }
  })

  // Verified ratio drives ring opacity — more verified = brighter rings
  const ringOpacity = 0.4 + verifiedRatio * 0.4

  return (
    <Float speed={0.35} rotationIntensity={0.25} floatIntensity={0.6}>
      <group position={[3.6, -0.2, -1.5]}>
        <Sphere ref={sphereRef} args={[1, 64, 64]} scale={2.2}>
          <MeshDistortMaterial
            color={alertColor}
            attach="material"
            distort={0.28}
            speed={0.35 + pulseRate * 0.4}
            roughness={0.15}
            metalness={0.92}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={2.8}
          />
        </Sphere>
        <mesh scale={2.75}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial
            color="#00D8F6"
            wireframe
            transparent
            opacity={0.16}
            emissive="#00D8F6"
            emissiveIntensity={0.3}
          />
        </mesh>
        <Torus ref={ring1Ref} args={[3.2, 0.02, 16, 100]} scale={1}>
          <meshStandardMaterial
            color={alertColor}
            emissive={alertColor}
            emissiveIntensity={1.2}
            transparent
            opacity={ringOpacity}
          />
        </Torus>
        <Torus ref={ring2Ref} args={[3.7, 0.018, 16, 100]} scale={1}>
          <meshStandardMaterial color="#00D8F6" emissive="#00D8F6" emissiveIntensity={1} transparent opacity={0.6} />
        </Torus>
        <Torus ref={ring3Ref} args={[4.2, 0.015, 16, 100]} scale={1}>
          <meshStandardMaterial color="#F5BA6B" emissive="#F5BA6B" emissiveIntensity={0.8} transparent opacity={0.45} />
        </Torus>
      </group>
    </Float>
  )
}

// ── 3. Geological Grid Floor ──────────────────────────────────────────────────
function GeologicalGridFloor() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { particleIntensity } = useAnimSignals()

  const { geometry, count } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(36, 36, 48, 48)
    geom.rotateX(-Math.PI / 2.3)
    return { geometry: geom, count: geom.attributes.position.count }
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.22
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z =
        Math.sin(x * 0.35 + t) * 0.4 +
        Math.cos(y * 0.35 + t * 0.8) * 0.35 +
        Math.sin((x + y) * 0.2 + t * 0.5) * 0.2
      pos.setZ(i, z)
    }
    pos.needsUpdate = true
    // Opacity tied to particleIntensity
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    if (mat) mat.opacity = 0.05 + particleIntensity * 0.1
  })

  return (
    <group position={[0, -5.5, -4]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color="#00F0B5" wireframe transparent opacity={0.09} emissive="#00D8F6" emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}

// ── 4. Mineral Dust Particles — density from backend ─────────────────────────
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const { particleIntensity } = useAnimSignals()
  const count = 300

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sc = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2
      sc[i] = Math.random() * 0.08 + 0.03
    }
    return [pos, sc]
  }, [count])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.08
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.1
      pointsRef.current.rotation.x = Math.sin(t * 0.08) * 0.05
      const mat = pointsRef.current.material as THREE.PointsMaterial
      if (mat) mat.opacity = 0.3 + particleIntensity * 0.5
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-scale" args={[scales, 1]} />
      </bufferGeometry>
      <pointsMaterial size={0.065} color="#00F0B5" transparent opacity={0.65} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ── 5. Cyan Dust Swarm ─────────────────────────────────────────────────────────
function SecondaryParticleSwarm() {
  const pointsRef = useRef<THREE.Points>(null)
  const { particleIntensity } = useAnimSignals()
  const count = 180

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4
    }
    return pos
  }, [count])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.055
    if (pointsRef.current) {
      pointsRef.current.rotation.y = -t * 0.08
      pointsRef.current.rotation.z = Math.cos(t * 0.06) * 0.04
      const mat = pointsRef.current.material as THREE.PointsMaterial
      if (mat) mat.opacity = 0.2 + particleIntensity * 0.35
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#00D8F6" transparent opacity={0.45} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ── 6. DNA Double Helix ───────────────────────────────────────────────────────
function DNAHelix() {
  const { verifiedRatio, alertColor } = useAnimSignals()
  const groupRef = useRef<THREE.Group>(null)
  const count = 40

  const { strand1, strand2, rungs } = useMemo(() => {
    const s1: [number, number, number][] = []
    const s2: [number, number, number][] = []
    const r: { from: [number, number, number]; to: [number, number, number] }[] = []
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 4
      const y = (i / count) * 5 - 2.5
      s1.push([Math.cos(t) * 0.7, y, Math.sin(t) * 0.7])
      s2.push([Math.cos(t + Math.PI) * 0.7, y, Math.sin(t + Math.PI) * 0.7])
      r.push({
        from: [Math.cos(t) * 0.7, y, Math.sin(t) * 0.7],
        to: [Math.cos(t + Math.PI) * 0.7, y, Math.sin(t + Math.PI) * 0.7],
      })
    }
    return { strand1: s1, strand2: s2, rungs: r }
  }, [count])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.15
    if (groupRef.current) {
      groupRef.current.rotation.y = t
    }
  })

  // Verified ratio drives how many rungs light up (more verified = more rungs lit)
  const litRungs = Math.ceil(verifiedRatio * rungs.length)

  return (
    <Float speed={0.3} floatIntensity={0.5} rotationIntensity={0.1}>
      <group ref={groupRef} position={[-5.5, 0.5, -2]}>
        {strand1.map((pos, i) => (
          <mesh key={`s1-${i}`} position={pos}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#00F0B5" emissive="#00F0B5" emissiveIntensity={1.5} transparent opacity={0.85} />
          </mesh>
        ))}
        {strand2.map((pos, i) => (
          <mesh key={`s2-${i}`} position={pos}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#00D8F6" emissive="#00D8F6" emissiveIntensity={1.5} transparent opacity={0.85} />
          </mesh>
        ))}
        {rungs.map((rung, i) => {
          if (i % 3 !== 0) return null
          const mid: [number, number, number] = [
            (rung.from[0] + rung.to[0]) / 2,
            (rung.from[1] + rung.to[1]) / 2,
            (rung.from[2] + rung.to[2]) / 2,
          ]
          const dx = rung.to[0] - rung.from[0]
          const dz = rung.to[2] - rung.from[2]
          const len = Math.sqrt(dx * dx + dz * dz)
          // Lit rungs use alertColor, unlit use amber
          const isLit = i < litRungs
          const rungColor = isLit ? alertColor : '#F5BA6B'
          return (
            <mesh key={`rung-${i}`} position={mid} rotation={[0, -Math.atan2(dz, dx), Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.015, len, 6]} />
              <meshStandardMaterial
                color={rungColor}
                emissive={rungColor}
                emissiveIntensity={isLit ? 1.2 : 0.8}
                transparent
                opacity={isLit ? 0.8 : 0.5}
              />
            </mesh>
          )
        })}
      </group>
    </Float>
  )
}

// ── 7. Comet Streak — speed driven by backend cometSpeedMult ──────────────────
function CometStreak({ orbitRadius = 5.5, color = '#00D8F6', baseSpeed = 0.1, tilt = 0 }: {
  orbitRadius?: number
  color?: string
  baseSpeed?: number
  tilt?: number
}) {
  const { cometSpeedMult } = useAnimSignals()
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * baseSpeed * cometSpeedMult
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * orbitRadius
      ref.current.position.y = Math.sin(t * 0.5) * 1.2 + tilt
      ref.current.position.z = Math.sin(t) * orbitRadius * 0.6 - 3
    }
  })

  return (
    <Trail width={1.2} length={8} color={color} attenuation={(t) => t * t} decay={1}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
      </mesh>
    </Trail>
  )
}

// ── 8. Giant Pulsing Nebula Ring — pulse driven by backend ────────────────────
function NebulaRing() {
  const { pulseRate, alertColor } = useAnimSignals()
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.06
    if (ref.current) {
      ref.current.rotation.x = t * 0.5
      ref.current.rotation.z = t * 0.3
      const mat = ref.current.material as THREE.MeshStandardMaterial
      // pulseRate 0-1 → faster/stronger pulse when backend has issues
      mat.opacity = 0.06 + Math.sin(t * (2 + pulseRate * 6)) * 0.05
    }
  })

  return (
    <mesh ref={ref} position={[0, 0, -6]}>
      <torusGeometry args={[7, 0.6, 12, 80]} />
      <meshStandardMaterial
        color={alertColor}
        emissive={alertColor}
        emissiveIntensity={0.5}
        wireframe
        transparent
        opacity={0.1}
      />
    </mesh>
  )
}

// ── 9. Data Stream Ribbons — intensity from backend ───────────────────────────
function DataStreamRibbons() {
  const { particleIntensity, alertColor } = useAnimSignals()
  const group = useRef<THREE.Group>(null)
  const count = 60

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = (i / count) * 12 - 6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 5
    }
    return pos
  }, [count])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.18
    if (group.current) {
      group.current.position.y = (t % 6) - 3
      group.current.rotation.y = Math.sin(t * 0.3) * 0.3
      const pts = group.current.children[0] as THREE.Points
      if (pts) {
        const mat = pts.material as THREE.PointsMaterial
        if (mat) {
          mat.opacity = 0.2 + particleIntensity * 0.4
          mat.color.set(alertColor)
        }
      }
    }
  })

  return (
    <group ref={group} position={[4.5, -3, -4]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color={alertColor} transparent opacity={0.5} sizeAttenuation blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

// ── 10. Live Status HUD (backend indicator floating in 3D space) ──────────────
function LiveStatusHUD() {
  const { backendOnline, factCount, docCount, criticalCount } = useAnimSignals()
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.position.y = -3.5 + Math.sin(t * 0.4) * 0.08
    }
  })

  // Small pulsing dot — red if critical, green if online, grey if offline
  const dotColor = !backendOnline ? '#555' : criticalCount > 0 ? '#FF4D6A' : '#00F0B5'

  return (
    <group ref={groupRef} position={[-7, -3.5, 0]}>
      {/* Status dot */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={dotColor} emissive={dotColor} emissiveIntensity={2} transparent opacity={0.9} />
      </mesh>
      {/* Ring around the dot — pulsing */}
      <mesh>
        <torusGeometry args={[0.22, 0.015, 8, 32]} />
        <meshStandardMaterial color={dotColor} emissive={dotColor} emissiveIntensity={1.5} transparent opacity={0.6} />
      </mesh>
      {/* Tiny fact/doc count indicators as stacked bars */}
      {[...Array(Math.min(docCount, 8))].map((_, i) => (
        <mesh key={`doc-${i}`} position={[0.45 + i * 0.18, 0, 0]}>
          <boxGeometry args={[0.1, 0.35, 0.05]} />
          <meshStandardMaterial color="#00D8F6" emissive="#00D8F6" emissiveIntensity={1} transparent opacity={0.7} />
        </mesh>
      ))}
      {[...Array(Math.min(Math.floor(factCount / 10), 8))].map((_, i) => (
        <mesh key={`fact-${i}`} position={[0.45 + i * 0.18, -0.45, 0]}>
          <boxGeometry args={[0.1, 0.22, 0.05]} />
          <meshStandardMaterial color="#00F0B5" emissive="#00F0B5" emissiveIntensity={1} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// ── 11. Camera Rig ────────────────────────────────────────────────────────────
function CameraRig() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const targetX = state.pointer.x * 0.45 + Math.sin(t * 0.15) * 0.15
    const targetY = state.pointer.y * 0.3 + Math.cos(t * 0.12) * 0.1
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.022)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.022)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

// ── Dynamic Lights driven by alert color ──────────────────────────────────────
function DynamicLights() {
  const { alertColor, pulseRate } = useAnimSignals()
  const light1Ref = useRef<THREE.PointLight>(null)
  const light2Ref = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (light1Ref.current) {
      light1Ref.current.intensity = 2.0 + Math.sin(t * (1 + pulseRate * 2)) * 0.5
      light1Ref.current.color.set(alertColor)
    }
    if (light2Ref.current) {
      light2Ref.current.intensity = 1.4 + Math.cos(t * (0.8 + pulseRate)) * 0.3
    }
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[12, 12, 6]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-10, -8, -4]} intensity={0.7} color="#00ffcc" />
      <pointLight ref={light1Ref} position={[3, 2, 2]} intensity={2.0} color={alertColor} distance={10} />
      <pointLight ref={light2Ref} position={[-4, -2, 1]} intensity={1.4} color="#00D8F6" distance={8} />
      <pointLight position={[0, 4, -2]} intensity={0.9} color="#F5BA6B" distance={12} />
      <pointLight position={[-5.5, 0.5, -2]} intensity={1.2} color="#00F0B5" distance={6} />
      <pointLight position={[0, 0, -6]} intensity={0.8} color="#00D8F6" distance={10} />
    </>
  )
}

// ── Main CanvasBackground Component ──────────────────────────────────────────
export default function CanvasBackground() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <CameraRig />
        <DynamicLights />

        <CentralCore />

        <FloatingCrystal position={[-4.5, 2.2, -3]} scale={0.55} speed={0.25} color="#00F0B5" type="octahedron" />
        <FloatingCrystal position={[-3.2, -2.4, -2]} scale={0.45} speed={0.3} color="#00D8F6" type="dodecahedron" />
        <FloatingCrystal position={[4.8, 3.0, -4]} scale={0.65} speed={0.22} color="#F5BA6B" type="icosahedron" />
        <FloatingCrystal position={[2.0, -3.2, -2.5]} scale={0.4} speed={0.28} color="#00F0B5" type="tetrahedron" />
        <FloatingCrystal position={[-1.5, 3.4, -5]} scale={0.5} speed={0.18} color="#00D8F6" type="octahedron" />
        <FloatingCrystal position={[-5.2, -0.5, -4]} scale={0.48} speed={0.26} color="#F5BA6B" type="dodecahedron" />

        <GeologicalGridFloor />
        <ParticleField />
        <SecondaryParticleSwarm />

        <DNAHelix />
        <CometStreak orbitRadius={5.5} color="#00D8F6" baseSpeed={0.1} tilt={1.0} />
        <CometStreak orbitRadius={4.2} color="#00F0B5" baseSpeed={0.075} tilt={-0.8} />
        <CometStreak orbitRadius={6.8} color="#F5BA6B" baseSpeed={0.055} tilt={0.3} />
        <NebulaRing />
        <DataStreamRibbons />
        <LiveStatusHUD />

        <Stars radius={120} depth={60} count={3500} factor={4} saturation={0.5} fade speed={0.35} />
      </Canvas>
    </div>
  )
}
