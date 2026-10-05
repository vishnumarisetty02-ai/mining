/**
 * BackendAnimContext
 * ──────────────────
 * Polls the FastAPI backend every 6 s for live stats and firewall status,
 * then derives animation-control values that the 3-D canvas can consume.
 *
 * Animation signals:
 *  • particleIntensity  0-1  → scales particle opacity/count
 *  • alertColor         hex  → core sphere / orb tint  (green=ok, amber=warning, red=critical)
 *  • pulseRate          0-1  → nebula pulse frequency
 *  • cometSpeedMult     0-3  → multiplier on comet orbital speed
 *  • verifiedRatio      0-1  → fraction of facts that are verified
 *  • backendOnline      bool
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { checkHealth, fetchStats, fetchFirewallSummary } from './api/client'

export interface AnimSignals {
  particleIntensity: number   // 0-1
  alertColor: string          // hex color
  alertColorRgb: string       // "r,g,b" for CSS rgba
  pulseRate: number           // 0-1
  cometSpeedMult: number      // 0.5-3
  verifiedRatio: number       // 0-1
  factCount: number
  docCount: number
  criticalCount: number
  backendOnline: boolean
}

const DEFAULTS: AnimSignals = {
  particleIntensity: 0.5,
  alertColor: '#00F0B5',
  alertColorRgb: '0,240,181',
  pulseRate: 0.5,
  cometSpeedMult: 1,
  verifiedRatio: 0,
  factCount: 0,
  docCount: 0,
  criticalCount: 0,
  backendOnline: false,
}

const BackendAnimContext = createContext<AnimSignals>(DEFAULTS)

export function useAnimSignals() {
  return useContext(BackendAnimContext)
}

function deriveSignals(
  online: boolean,
  stats: { documents: number; facts: number; verified: number; criticalConflicts: number; warnings: number } | null,
  firewall: { critical: number; warnings: number; passed: number; totalRules: number } | null,
): AnimSignals {
  if (!online || !stats) return { ...DEFAULTS, backendOnline: online }

  const { documents, facts, verified, criticalConflicts } = stats
  const fw = firewall ?? { critical: 0, warnings: 0, passed: 0, totalRules: 1 }

  // Particle intensity: more docs/facts = denser particle field (capped 0.3-1)
  const particleIntensity = Math.min(1, 0.3 + (facts / 100) * 0.7)

  // Alert color: critical → red, warnings → amber, all good → emerald
  let alertColor = '#00F0B5'
  let alertColorRgb = '0,240,181'
  if (fw.critical > 0 || criticalConflicts > 0) {
    alertColor = '#FF4D6A'
    alertColorRgb = '255,77,106'
  } else if (fw.warnings > 0) {
    alertColor = '#F5BA6B'
    alertColorRgb = '245,186,107'
  }

  // Pulse rate: more warnings = faster pulse
  const pulseRate = Math.min(1, 0.2 + (fw.warnings + fw.critical) * 0.08)

  // Comet speed: high critical count = faster comets
  const cometSpeedMult = Math.min(3, 1 + criticalConflicts * 0.25)

  // Verified ratio
  const verifiedRatio = facts > 0 ? Math.min(1, verified / facts) : 0

  return {
    particleIntensity,
    alertColor,
    alertColorRgb,
    pulseRate,
    cometSpeedMult,
    verifiedRatio,
    factCount: facts,
    docCount: documents,
    criticalCount: fw.critical + criticalConflicts,
    backendOnline: true,
  }
}

export function BackendAnimProvider({ children }: { children: ReactNode }) {
  const [signals, setSignals] = useState<AnimSignals>(DEFAULTS)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const poll = async () => {
      if (!mountedRef.current) return

      const online = await checkHealth()
      if (!online) {
        setSignals(prev => ({ ...prev, backendOnline: false }))
        return
      }

      try {
        const [stats, fw] = await Promise.all([
          fetchStats(),
          fetchFirewallSummary().catch(() => null),
        ])
        if (mountedRef.current) {
          setSignals(deriveSignals(true, stats, fw))
        }
      } catch {
        if (mountedRef.current) {
          setSignals(prev => ({ ...prev, backendOnline: true }))
        }
      }
    }

    poll()
    const id = setInterval(poll, 6000)

    return () => {
      mountedRef.current = false
      clearInterval(id)
    }
  }, [])

  return (
    <BackendAnimContext.Provider value={signals}>
      {children}
    </BackendAnimContext.Provider>
  )
}
