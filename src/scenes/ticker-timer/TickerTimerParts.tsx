import { useMemo } from 'react'
import { CatmullRomCurve3, DoubleSide, Vector3 } from 'three'
import { TAPE, tapeWorldX } from './layout'
import type { PrintQuality, TapeDot } from './model'
import { TICKER_CANDY as C } from './palette'
import { SceneLabel } from '../../scene3d/SceneLabel'

export function PartLabel({
  position,
  children,
  visible,
}: {
  position: [number, number, number]
  children: string
  visible: boolean
}) {
  return visible ? <SceneLabel position={position}>{children}</SceneLabel> : null
}

export function Wire({ points, color }: { points: ReadonlyArray<readonly [number, number, number]>; color: string }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((point) => new Vector3(...point))), [points])
  return (
    <mesh>
      <tubeGeometry args={[curve, 40, 0.018, 8, false]} />
      <meshStandardMaterial color={color} metalness={0.22} roughness={0.46} />
    </mesh>
  )
}

export function Frame({
  position,
  width,
  height,
  depth,
  bar,
  color,
}: {
  position: [number, number, number]
  width: number
  height: number
  depth: number
  bar: number
  color: string
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2 - bar / 2, 0]}>
        <boxGeometry args={[width, bar, depth]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </mesh>
      <mesh position={[0, -height / 2 + bar / 2, 0]}>
        <boxGeometry args={[width, bar, depth]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, depth / 2 - bar / 2]}>
        <boxGeometry args={[width, Math.max(0.01, height - bar * 2), bar]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, -depth / 2 + bar / 2]}>
        <boxGeometry args={[width, Math.max(0.01, height - bar * 2), bar]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </mesh>
    </group>
  )
}

export function BindingTerminal({ position, color }: { position: readonly [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.12, 0.14, 0.25, 20]} />
        <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.18, 20]} />
        <meshStandardMaterial color={color} metalness={0.18} roughness={0.35} />
      </mesh>
    </group>
  )
}

export function GuideWindow({ z }: { z: number }) {
  return (
    <group position={[0.8, 0.39, z]}>
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.06, 0.34, 0.06]} />
          <meshStandardMaterial color={C.guide} metalness={0.7} roughness={0.38} />
        </mesh>
      ))}
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.56, 0.06, 0.06]} />
        <meshStandardMaterial color={C.guide} metalness={0.7} roughness={0.38} />
      </mesh>
    </group>
  )
}

export function PaperTape({
  displacementM,
  dots,
  printQuality,
}: {
  displacementM: number
  dots: TapeDot[]
  printQuality: PrintQuality
}) {
  const tapeMinX = TAPE.centerX - TAPE.visibleLength / 2 + 0.07
  const tapeMaxX = TAPE.centerX + TAPE.visibleLength / 2 - 0.06

  return (
    <group position={[0.8, 0, -0.8]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[TAPE.centerX, TAPE.y, 0]} receiveShadow>
        <boxGeometry args={[TAPE.visibleLength, TAPE.thickness, TAPE.width]} />
        <meshStandardMaterial color={C.tape} roughness={0.82} side={DoubleSide} />
      </mesh>
      {dots.map((dot) => {
        const x = Math.max(tapeMinX, Math.min(tapeMaxX, tapeWorldX(dot.positionM, displacementM)))
        return (
          <mesh
            key={`${dot.index}-${dot.timeS}`}
            position={[x, TAPE.y + TAPE.thickness / 2 + 0.002, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={dot.smeared || printQuality === 'smeared' ? [2.6, 1, 1] : [1, 1, 1]}
          >
            <circleGeometry args={[dot.smeared || printQuality === 'smeared' ? 0.022 : 0.012, 16]} />
            <meshBasicMaterial color={printQuality === 'smeared' ? C.smeared : C.dot} side={DoubleSide} />
          </mesh>
        )
      })}
    </group>
  )
}
