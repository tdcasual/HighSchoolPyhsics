import { Html } from '@react-three/drei/web/Html'
import { Line } from '@react-three/drei/core/Line'
import { memo, useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, LinearFilter, type Group, type Mesh } from 'three'
import { drawWedgePattern, type WedgeParams } from './model'
import type { WedgeMode } from './model'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'

function readSceneBackgroundColor(): string {
  if (typeof window === 'undefined') return '#222222'
  const shell = document.querySelector('.app-shell')
  if (!shell) return '#222222'
  return getComputedStyle(shell).getPropertyValue('--scene-optical-bg').trim() || '#222222'
}

const MAT_METAL = { color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 }
const MAT_DARK_METAL = { color: 0x333333, metalness: 0.6, roughness: 0.4 }
const MAT_GLASS_BOTTOM = { color: 0x4488cc, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.6 }
const MAT_GLASS_TOP = { color: 0xaaddff, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.4 }
const MAT_TABLE_EXT = { color: 0x444444, metalness: 0.3, roughness: 0.6 }
const MAT_PAPER = { color: 0xeeeedd, roughness: 0.9 }
const MAT_LIGHT_HOUSING = { color: 0x333333, metalness: 0.4, roughness: 0.6 }
const SHADOW_PROPS = { castShadow: true as const, receiveShadow: true as const }
const NO_SHADOW_PROPS = {}
const PLATE_WIDTH = 16
const PLATE_DEPTH = 10
const PLATE_HEIGHT = 0.5
const PLATE_Y = 3
const TEX_W = 512
const TEX_H = 256

function Label({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center>
      <div className="double-slit-label">{text}</div>
    </Html>
  )
}

/** Renders the interference fringe pattern as a texture on the top plate surface */
function FringeSurface({ params, isLightOn }: { params: WedgeParams; isLightOn: boolean }) {
  const refs = useRef<{ canvas: HTMLCanvasElement; texture: CanvasTexture } | null>(null)

  if (!refs.current) {
    const c = document.createElement('canvas')
    c.width = TEX_W
    c.height = TEX_H
    const tex = new CanvasTexture(c)
    tex.minFilter = LinearFilter
    refs.current = { canvas: c, texture: tex }
  }

  const { canvas, texture } = refs.current

  useEffect(() => {
    const ctx = canvas.getContext('2d')!
    if (!isLightOn) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, TEX_W, TEX_H)
    } else {
      drawWedgePattern(ctx, params)
    }
    texture.needsUpdate = true
  }, [params, isLightOn, canvas, texture])

  useEffect(() => {
    return () => { refs.current?.texture.dispose() }
  }, [])

  return (
    <mesh position={[0, PLATE_HEIGHT / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PLATE_WIDTH, PLATE_DEPTH]} />
      <meshBasicMaterial map={texture} transparent opacity={0.85} side={2} />
    </mesh>
  )
}

/**
 * Scanning light beam — a world-vertical sheet of light from the source down
 * to the wedge surface, sweeping from the contact edge (thin end) to the
 * paper strip (thick end / slope top). Placed in world space so the beam
 * stays truly vertical while the intersection point climbs the slope.
 */
function ScanMarker({ isScanning, visualAngle, groupY }: {
  isScanning: boolean
  visualAngle: number
  groupY: number
}) {
  const beamRef = useRef<Mesh>(null)
  const glowRef = useRef<Mesh>(null)
  const tRef = useRef(0)

  const alphaRad = visualAngle * Math.PI / 180
  const sinA = Math.sin(alphaRad)
  const cosA = Math.cos(alphaRad)
  // Bottom of the light-source bulb in world Y
  const sourceY = PLATE_Y + 5.5

  useFrame((_, delta) => {
    if (!isScanning) return

    tRef.current = (tRef.current + delta * 0.12) % 1
    const margin = PLATE_WIDTH * 0.05
    // Local X along the plate surface
    const xL = -PLATE_WIDTH / 2 + margin + tRef.current * (PLATE_WIDTH - margin * 2)

    // Transform top-surface point to world coords
    const surfaceWX = xL * cosA - (PLATE_HEIGHT / 2) * sinA
    const surfaceWY = groupY + xL * sinA + (PLATE_HEIGHT / 2) * cosA

    // Vertical beam from source down to surface
    if (beamRef.current) {
      const h = Math.max(0.1, sourceY - surfaceWY)
      beamRef.current.position.set(surfaceWX, (sourceY + surfaceWY) / 2, 0)
      beamRef.current.scale.y = h
    }

    // Surface glow line at intersection
    if (glowRef.current) {
      glowRef.current.position.set(surfaceWX, surfaceWY + 0.03, 0)
    }
  })

  if (!isScanning) return null

  return (
    <>
      {/* Vertical light curtain — thin box spanning plate depth */}
      <mesh ref={beamRef}>
        <boxGeometry args={[0.12, 1, PLATE_DEPTH]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.15} />
      </mesh>
      {/* Bright glow at surface intersection */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, PLATE_DEPTH]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.5} side={2} />
      </mesh>
    </>
  )
}

type WedgeInterferenceRig3DProps = {
  params: WedgeParams
  isLightOn: boolean
  lightColorHex: number
  isScanning: boolean
}

export const WedgeInterferenceRig3D = memo(function WedgeInterferenceRig3D({
  params,
  isLightOn,
  lightColorHex,
  isScanning,
}: WedgeInterferenceRig3DProps) {
  const { wedgeAngle, mode, bumpPosition } = params
  const perf = useMemo(() => resolvePerformanceProfile(), [])
  const geoDetail = useMemo(() => perf.geometry, [perf])
  const bgColor = useMemo(() => readSceneBackgroundColor(), [])
  const shadowsEnabled = perf.shadowMapSize !== null

  const shadowProps = shadowsEnabled ? SHADOW_PROPS : NO_SHADOW_PROPS

  const visualAngle = useMemo(() => {
    const fraction = (wedgeAngle - 0.01) / (0.30 - 0.01)
    return 3 + fraction * 8
  }, [wedgeAngle])

  // Position top plate so its left (contact) edge sits on the bottom plate surface
  const groupY = useMemo(() => {
    const alphaRad = visualAngle * Math.PI / 180
    const sinA = Math.sin(alphaRad)
    const cosA = Math.cos(alphaRad)
    const bottomTop = PLATE_Y + PLATE_HEIGHT / 2
    return bottomTop + (PLATE_WIDTH / 2) * sinA + (PLATE_HEIGHT / 2) * cosA
  }, [visualAngle])

  const bumpX = (bumpPosition - 0.5) * PLATE_WIDTH * 0.8

  return (
    <group data-rig-scene="wedge-interference">
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 20, 80]} />

      {/* Lights */}
      <ambientLight intensity={shadowsEnabled ? 0.5 : 0.7} />
      <directionalLight
        position={[5, 20, 15]}
        intensity={0.8}
        castShadow={shadowsEnabled}
        shadow-mapSize-width={perf.shadowMapSize ?? 1024}
        shadow-mapSize-height={perf.shadowMapSize ?? 1024}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* ====== Table / Base ====== */}
      <mesh position={[0, 0, 0]} {...shadowProps}>
        <boxGeometry args={[20, 1.5, 10]} />
        <meshStandardMaterial {...MAT_DARK_METAL} />
      </mesh>
      <mesh position={[0, -1.25, 0]}>
        <boxGeometry args={[22, 1, 12]} />
        <meshStandardMaterial {...MAT_TABLE_EXT} />
      </mesh>

      {/* ====== Bottom glass plate (flat) ====== */}
      <mesh position={[0, PLATE_Y, 0]} {...shadowProps}>
        <boxGeometry args={[PLATE_WIDTH, PLATE_HEIGHT, PLATE_DEPTH]} />
        <meshStandardMaterial {...MAT_GLASS_BOTTOM} />
      </mesh>
      <Label text="下玻璃板" position={[-PLATE_WIDTH / 2 - 1, PLATE_Y, PLATE_DEPTH / 2 + 1]} />

      {/* ====== Top glass plate (tilted) ====== */}
      <group position={[0, groupY, 0]} rotation={[0, 0, visualAngle * Math.PI / 180]}>
        <mesh {...shadowProps}>
          <boxGeometry args={[PLATE_WIDTH, PLATE_HEIGHT, PLATE_DEPTH]} />
          <meshStandardMaterial {...MAT_GLASS_TOP} />
        </mesh>
        {/* Fringe pattern on top surface of upper glass */}
        <FringeSurface params={params} isLightOn={isLightOn} />
      </group>
      <Label text="上玻璃板" position={[PLATE_WIDTH / 2 + 1, PLATE_Y + 2, PLATE_DEPTH / 2 + 1]} />

      {/* ====== Paper strip at thin end ====== */}
      <mesh position={[PLATE_WIDTH / 2 - 0.3, PLATE_Y + PLATE_HEIGHT / 2 + 0.15, 0]}>
        <boxGeometry args={[0.3, 0.3, PLATE_DEPTH * 0.8]} />
        <meshStandardMaterial {...MAT_PAPER} />
      </mesh>
      <Label text="薄纸片" position={[PLATE_WIDTH / 2 + 0.8, PLATE_Y + 1.5, 0]} />

      {/* ====== Bump — subtle surface bulge on bottom plate ====== */}
      {mode === 'bump' && (
        <mesh
          position={[bumpX, PLATE_Y + PLATE_HEIGHT / 2 + 0.06, 0]}
          scale={[2.5, 0.2, 1.8]}
        >
          <sphereGeometry args={[1, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
          <meshStandardMaterial {...MAT_GLASS_BOTTOM} />
        </mesh>
      )}

      {/* ====== Light source above ====== */}
      <group position={[0, PLATE_Y + 7, 0]}>
        <mesh {...(shadowsEnabled ? { castShadow: true } : {})}>
          <cylinderGeometry args={[0.8, 1.2, 2.5, geoDetail.cylinderRadialSegments]} />
          <meshStandardMaterial {...MAT_LIGHT_HOUSING} />
        </mesh>
        <mesh position={[0, -1.5, 0]}>
          <sphereGeometry args={[0.4, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
          <meshBasicMaterial color={isLightOn ? lightColorHex : 0x111111} />
        </mesh>
        {isLightOn && (
          <pointLight
            position={[0, -2, 0]}
            intensity={2}
            distance={15}
            color={lightColorHex}
          />
        )}
      </group>
      <Label text="光源" position={[0, PLATE_Y + 9.5, 0]} />

      {/* ====== Support stand for light source ====== */}
      <mesh position={[0, PLATE_Y + 5, PLATE_DEPTH / 2 + 0.5]}>
        <cylinderGeometry args={[0.15, 0.15, 4, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>
      <mesh position={[0, PLATE_Y + 3, PLATE_DEPTH / 2 + 0.5]}>
        <boxGeometry args={[1.5, 0.4, 1.5]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>

      {/* ====== Light beam ====== */}
      {isLightOn && (
        <>
          <Line
            points={[
              [0, PLATE_Y + 5.5, 0],
              [0, PLATE_Y + PLATE_HEIGHT + 0.5, 0],
            ]}
            color={lightColorHex}
            lineWidth={3}
            transparent
            opacity={0.35}
          />
          <Line
            points={[
              [-2, PLATE_Y + 5.5, 0],
              [0, PLATE_Y + PLATE_HEIGHT + 0.5, 0],
              [2, PLATE_Y + 5.5, 0],
            ]}
            color={lightColorHex}
            lineWidth={1.5}
            transparent
            opacity={0.2}
          />
        </>
      )}

      {/* ====== Contact edge label ====== */}
      <Label text="接触边" position={[-PLATE_WIDTH / 2 - 0.5, PLATE_Y + 0.8, 0]} />

      {/* ====== Scanning light beam (world-space vertical) ====== */}
      <ScanMarker isScanning={isScanning && isLightOn} visualAngle={visualAngle} groupY={groupY} />
    </group>
  )
})
