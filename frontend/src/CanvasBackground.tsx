import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars, Torus } from '@react-three/drei'
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
    const t = state.clock.getElapsedTime() * speed + offset
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.12
      meshRef.current.rotation.y = t * 0.18
      meshRef.current.position.y = position[1] + Math.sin(t * 0.4) * 0.35
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = -t * 0.08
      wireRef.current.rotation.z = t * 0.14
      wireRef.current.position.y = position[1] + Math.sin(t * 0.4) * 0.35
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
    // Slow-motion rotation for core
    if (sphereRef.current) {
      sphereRef.current.rotation.x = t * 0.04
      sphereRef.current.rotation.y = t * 0.06
    }
    // Precession motion on orbital rings in slow motion
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.05
      ring1Ref.current.rotation.y = t * 0.08
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.06
      ring2Ref.current.rotation.z = t * 0.07
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -t * 0.04
      ring3Ref.current.rotation.z = -t * 0.05
    }
  })

  return (
    <Float speed={0.6} rotationIntensity={0.4} floatIntensity={0.9}>
      <group position={[3.6, -0.2, -1.5]}>
        {/* Core Organic Shimmer Sphere */}
        <Sphere ref={sphereRef} args={[1, 64, 64]} scale={2.2}>
          <MeshDistortMaterial
            color="#00F0B5"
            attach="material"
            distort={0.38}
            speed={0.6}
            roughness={0.15}
            metalness={0.92}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={2.8}
          />
        </Sphere>

        {/* Outer Icosahedron Lattice */}
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

        {/* Slow Gyroscopic Orbital Rings */}
        <Torus ref={ring1Ref} args={[3.2, 0.02, 16, 100]} scale={1}>
          <meshStandardMaterial
            color="#00F0B5"
            emissive="#00F0B5"
            emissiveIntensity={1.2}
            transparent
            opacity={0.7}
          />
        </Torus>

        <Torus ref={ring2Ref} args={[3.7, 0.018, 16, 100]} scale={1}>
          <meshStandardMaterial
            color="#00D8F6"
            emissive="#00D8F6"
            emissiveIntensity={1}
            transparent
            opacity={0.6}
          />
        </Torus>

        <Torus ref={ring3Ref} args={[4.2, 0.015, 16, 100]} scale={1}>
          <meshStandardMaterial
            color="#F5BA6B"
            emissive="#F5BA6B"
            emissiveIntensity={0.8}
            transparent
            opacity={0.45}
          />
        </Torus>
      </group>
    </Float>
  )
}

// ── 3. Slow-Motion Undulating Topographical Geological Grid Floor ─────────────
function GeologicalGridFloor() {
  const meshRef = useRef<THREE.Mesh>(null)

  const { geometry, count } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(36, 36, 48, 48)
    geom.rotateX(-Math.PI / 2.3)
    return { geometry: geom, count: geom.attributes.position.count }
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.4
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // Slow sinusoidal wave calculation
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
        <meshStandardMaterial
          color="#00F0B5"
          wireframe
          transparent
          opacity={0.09}
          emissive="#00D8F6"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  )
}

// ── 4. Slow Motion Rising Mineral Dust Particles ──────────────────────────────
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
    const t = state.clock.getElapsedTime() * 0.15
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
      <pointsMaterial
        size={0.065}
        color="#00F0B5"
        transparent
        opacity={0.65}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ── 5. Cyan Secondary Dust Layer ──────────────────────────────────────────────
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
    const t = state.clock.getElapsedTime() * 0.1
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
      <pointsMaterial
        size={0.045}
        color="#00D8F6"
        transparent
        opacity={0.45}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ── 6. Camera Rig with Smooth Inertia Parallax ────────────────────────────────
function CameraRig() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // Subtle slow-motion breathing motion + smooth pointer parallax
    const targetX = state.pointer.x * 0.6 + Math.sin(t * 0.25) * 0.2
    const targetY = state.pointer.y * 0.4 + Math.cos(t * 0.2) * 0.15
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.035)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.035)
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

        {/* Ambient & Directional Lights with Slow-Motion Warm/Cool Accent */}
        <ambientLight intensity={0.65} />
        <directionalLight position={[12, 12, 6]} intensity={1.4} color="#ffffff" />
        <directionalLight position={[-10, -8, -4]} intensity={0.8} color="#00ffcc" />
        <pointLight position={[3, 2, 2]} intensity={2.2} color="#00F0B5" distance={10} />
        <pointLight position={[-4, -2, 1]} intensity={1.5} color="#00D8F6" distance={8} />
        <pointLight position={[0, 4, -2]} intensity={1.0} color="#F5BA6B" distance={12} />

        {/* Central Core & Orbital Rings */}
        <CentralCore />

        {/* Floating Geological Ore Crystals in Slow Motion at various depths */}
        <FloatingCrystal
          position={[-4.5, 2.2, -3]}
          scale={0.55}
          speed={0.4}
          color="#00F0B5"
          type="octahedron"
        />
        <FloatingCrystal
          position={[-3.2, -2.4, -2]}
          scale={0.45}
          speed={0.5}
          color="#00D8F6"
          type="dodecahedron"
        />
        <FloatingCrystal
          position={[4.8, 3.0, -4]}
          scale={0.65}
          speed={0.35}
          color="#F5BA6B"
          type="icosahedron"
        />
        <FloatingCrystal
          position={[2.0, -3.2, -2.5]}
          scale={0.4}
          speed={0.45}
          color="#00F0B5"
          type="tetrahedron"
        />
        <FloatingCrystal
          position={[-1.5, 3.4, -5]}
          scale={0.5}
          speed={0.3}
          color="#00D8F6"
          type="octahedron"
        />
        <FloatingCrystal
          position={[-5.2, -0.5, -4]}
          scale={0.48}
          speed={0.42}
          color="#F5BA6B"
          type="dodecahedron"
        />

        {/* Slow Motion Undulating Geological Grid Floor */}
        <GeologicalGridFloor />

        {/* Dynamic Dual Layer Particles & Star Dust */}
        <ParticleField />
        <SecondaryParticleSwarm />
        <Stars
          radius={120}
          depth={60}
          count={3500}
          factor={4}
          saturation={0.5}
          fade
          speed={0.6}
        />
      </Canvas>
    </div>
  )
}
