import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars, Torus, Trail } from '@react-three/drei'
import * as THREE from 'three'

// ── 1. Floating Crystal Polyhedron (Geological Ore Node) ──────────────────────
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
    // slowed by 40%
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

// ── 2. Central 3D Core with Slow Motion Gyroscopic Orbital Rings ──────────────
function CentralCore() {
  const sphereRef = useRef<THREE.Mesh>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // slowed by ~40%
    if (sphereRef.current) {
      sphereRef.current.rotation.x = t * 0.025
      sphereRef.current.rotation.y = t * 0.035
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.03
      ring1Ref.current.rotation.y = t * 0.05
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

  return (
    <Float speed={0.35} rotationIntensity={0.25} floatIntensity={0.6}>
      <group position={[3.6, -0.2, -1.5]}>
        <Sphere ref={sphereRef} args={[1, 64, 64]} scale={2.2}>
          <MeshDistortMaterial
            color="#00F0B5"
            attach="material"
            distort={0.28}
            speed={0.35}
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
          <meshStandardMaterial color="#00F0B5" emissive="#00F0B5" emissiveIntensity={1.2} transparent opacity={0.7} />
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
  })

  return (
    <group position={[0, -5.5, -4]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color="#00F0B5" wireframe transparent opacity={0.09} emissive="#00D8F6" emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}

// ── 4. Mineral Dust Particles ──────────────────────────────────────────────────
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
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

// ── NEW 6. DNA Double Helix ───────────────────────────────────────────────────
function DNAHelix() {
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
          return (
            <mesh key={`rung-${i}`} position={mid} rotation={[0, -Math.atan2(dz, dx), Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.015, len, 6]} />
              <meshStandardMaterial color="#F5BA6B" emissive="#F5BA6B" emissiveIntensity={0.8} transparent opacity={0.55} />
            </mesh>
          )
        })}
      </group>
    </Float>
  )
}

// ── NEW 7. Comet Streak with Trail ────────────────────────────────────────────
function CometStreak({ orbitRadius = 5.5, color = '#00D8F6', speed = 0.12, tilt = 0 }: {
  orbitRadius?: number
  color?: string
  speed?: number
  tilt?: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed
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

// ── NEW 8. Giant Pulsing Nebula Ring ──────────────────────────────────────────
function NebulaRing() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.06
    if (ref.current) {
      ref.current.rotation.x = t * 0.5
      ref.current.rotation.z = t * 0.3
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.08 + Math.sin(t * 4) * 0.04
    }
  })

  return (
    <mesh ref={ref} position={[0, 0, -6]}>
      <torusGeometry args={[7, 0.6, 12, 80]} />
      <meshStandardMaterial color="#00F0B5" emissive="#00D8F6" emissiveIntensity={0.5} wireframe transparent opacity={0.1} />
    </mesh>
  )
}

// ── NEW 9. Data Stream Ribbons ────────────────────────────────────────────────
function DataStreamRibbons() {
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
    }
  })

  return (
    <group ref={group} position={[4.5, -3, -4]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#00F0B5" transparent opacity={0.5} sizeAttenuation blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

// ── 10. Camera Rig with Smooth Inertia Parallax ───────────────────────────────
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

        <ambientLight intensity={0.55} />
        <directionalLight position={[12, 12, 6]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-10, -8, -4]} intensity={0.7} color="#00ffcc" />
        <pointLight position={[3, 2, 2]} intensity={2.0} color="#00F0B5" distance={10} />
        <pointLight position={[-4, -2, 1]} intensity={1.4} color="#00D8F6" distance={8} />
        <pointLight position={[0, 4, -2]} intensity={0.9} color="#F5BA6B" distance={12} />
        <pointLight position={[-5.5, 0.5, -2]} intensity={1.2} color="#00F0B5" distance={6} />
        <pointLight position={[0, 0, -6]} intensity={0.8} color="#00D8F6" distance={10} />

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

        {/* New 3D Elements */}
        <DNAHelix />
        <CometStreak orbitRadius={5.5} color="#00D8F6" speed={0.1} tilt={1.0} />
        <CometStreak orbitRadius={4.2} color="#00F0B5" speed={0.075} tilt={-0.8} />
        <CometStreak orbitRadius={6.8} color="#F5BA6B" speed={0.055} tilt={0.3} />
        <NebulaRing />
        <DataStreamRibbons />

        <Stars radius={120} depth={60} count={3500} factor={4} saturation={0.5} fade speed={0.35} />
      </Canvas>
    </div>
  )
}
