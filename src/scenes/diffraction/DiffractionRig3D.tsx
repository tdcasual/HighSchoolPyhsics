import React, { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  getApertureRange,
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
} from '../../domains/optics/diffraction'
import { DiffractionScreen } from './DiffractionScreen'
import { SceneLabel } from '../../scene3d/SceneLabel'

const SOURCE_DISTANCE = 0.2 // m, distance from source to obstacle
const SOURCE_LENGTH = 0.16 // m, schematic line source length
const SOURCE_THICKNESS = 0.012 // m
const BOARD_SIZE = 0.12 // m, enlarged schematic obstacle board
const BOARD_THICKNESS = 0.004 // m

function enlargedAperture(sizeM: number, mode: DiffractionMode, minFraction: number, maxFraction: number): number {
  const { min, max } = getApertureRange(mode)
  const sizeMm = sizeM * 1000
  const progress = Math.max(0, Math.min(1, (sizeMm - min) / (max - min)))
  return BOARD_SIZE * (minFraction + (maxFraction - minFraction) * progress)
}

function RigLabel({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <SceneLabel position={position} variant="dark" size={12} distanceFactor={2}>
      {text}
    </SceneLabel>
  )
}

function SlitObstacle({ slitWidthM }: { slitWidthM: number }) {
  const halfBoard = BOARD_SIZE / 2
  const visualSlitWidth = enlargedAperture(slitWidthM, 'single-slit', 0.03, 0.12)
  const halfSlit = visualSlitWidth / 2
  const blockWidth = halfBoard - halfSlit
  const leftBlockCenter = -(halfBoard + halfSlit) / 2
  const rightBlockCenter = (halfBoard + halfSlit) / 2

  return (
    <group>
      {/* Left board */}
      <mesh position={[leftBlockCenter, 0, 0]}>
        <boxGeometry args={[blockWidth, BOARD_SIZE, BOARD_THICKNESS]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Right board */}
      <mesh position={[rightBlockCenter, 0, 0]}>
        <boxGeometry args={[blockWidth, BOARD_SIZE, BOARD_THICKNESS]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  )
}

function HoleObstacle({ holeDiameterM }: { holeDiameterM: number }) {
  const visualHoleDiameter = enlargedAperture(holeDiameterM, 'circular-aperture', 0.06, 0.18)
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const s2 = BOARD_SIZE / 2
    s.moveTo(-s2, -s2)
    s.lineTo(s2, -s2)
    s.lineTo(s2, s2)
    s.lineTo(-s2, s2)
    s.lineTo(-s2, -s2)
    const hole = new THREE.Path()
    hole.absarc(0, 0, visualHoleDiameter / 2, 0, Math.PI * 2, true)
    s.holes.push(hole)
    return s
  }, [visualHoleDiameter])

  const geometry = useMemo(() => {
    return new THREE.ExtrudeGeometry(shape, { depth: BOARD_THICKNESS, bevelEnabled: false })
  }, [shape])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  return (
    <mesh geometry={geometry} position={[0, 0, -BOARD_THICKNESS / 2]}>
      <meshStandardMaterial color="#2a2a2a" side={THREE.DoubleSide} />
    </mesh>
  )
}

function GratingObstacle({ gratingLines }: { gratingLines: number }) {
  // The true pitch is too small to resolve at this camera scale. Keep the
  // displayed bars proportional while making their count respond to density.
  const densityProgress = Math.max(0, Math.min(1, (gratingLines - 100) / 500))
  const slitCount = Math.round(6 + densityProgress * 14)
  const visualSpacing = BOARD_SIZE / slitCount
  const opaqueBarWidth = visualSpacing * 0.8

  const bars = useMemo(() => {
    const items: React.JSX.Element[] = []
    const startX = -BOARD_SIZE / 2 + visualSpacing / 2

    for (let i = 0; i < slitCount; i++) {
      const x = startX + i * visualSpacing
      items.push(
        <mesh key={i} position={[x, 0, BOARD_THICKNESS / 2]}>
          <boxGeometry args={[opaqueBarWidth, BOARD_SIZE, BOARD_THICKNESS * 1.5]} />
          <meshStandardMaterial color="#111111" />
        </mesh>,
      )
    }
    return items
  }, [opaqueBarWidth, visualSpacing, slitCount])

  return (
    <group>
      <mesh position={[0, 0, -BOARD_THICKNESS / 2]}>
        <boxGeometry args={[BOARD_SIZE, BOARD_SIZE, BOARD_THICKNESS]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {bars}
    </group>
  )
}

function DiskObstacle({ diameterM }: { diameterM: number }) {
  // The opaque circular plate matches the aperture-mask model used on screen.
  const displayRadius = enlargedAperture(diameterM, 'circular-obstacle', 0.06, 0.18) / 2
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[displayRadius, displayRadius, BOARD_THICKNESS, 32]} />
      <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.15} />
    </mesh>
  )
}

function Obstacle({ mode, params }: { mode: DiffractionMode; params: DiffractionParams }) {
  const apertureM = params.apertureSize * 1e-3

  switch (mode) {
    case 'single-slit':
      return <SlitObstacle slitWidthM={apertureM} />
    case 'circular-aperture':
      return <HoleObstacle holeDiameterM={apertureM} />
    case 'circular-obstacle':
      return <DiskObstacle diameterM={apertureM} />
    case 'diffraction-grating': {
      return <GratingObstacle gratingLines={params.gratingLines} />
    }
  }
}

function LineSource({ color, isLightOn }: { color: number; isLightOn: boolean }) {
  const hex = `#${color.toString(16).padStart(6, '0')}`
  return (
    <group position={[0, 0, -SOURCE_DISTANCE]}>
      {/* Core — bright emissive cylinder */}
      <mesh>
        <cylinderGeometry args={[SOURCE_THICKNESS / 2, SOURCE_THICKNESS / 2, SOURCE_LENGTH, 16]} />
        <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isLightOn ? 4 : 0.2} toneMapped={false} />
      </mesh>
      {/* Glow halo — larger translucent cylinder */}
      {isLightOn && (
        <mesh>
          <cylinderGeometry args={[SOURCE_THICKNESS * 1.5, SOURCE_THICKNESS * 1.5, SOURCE_LENGTH * 0.95, 16]} />
          <meshBasicMaterial color={hex} transparent opacity={0.25} toneMapped={false} />
        </mesh>
      )}
      {/* Point light */}
      {isLightOn && <pointLight color={hex} intensity={15} distance={3} decay={2} />}
      {/* Beam direction indicator — flat translucent panel */}
      <mesh position={[0, 0, SOURCE_DISTANCE / 2]}>
        <boxGeometry args={[SOURCE_THICKNESS, SOURCE_THICKNESS, SOURCE_DISTANCE]} />
        <meshBasicMaterial color={hex} transparent opacity={isLightOn ? 0.06 : 0.01} />
      </mesh>
      <RigLabel text="线光源" position={[0, -SOURCE_LENGTH / 2 - 0.05, 0]} />
    </group>
  )
}

export type DiffractionRig3DProps = {
  mode: DiffractionMode
  params: DiffractionParams
  isLightOn: boolean
  showPattern: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  lightColorHex: number
  screenWidthM: number
  screenHeightM: number
}

export function DiffractionRig3D({
  mode,
  params,
  isLightOn,
  showPattern,
  isWhiteLight,
  filterColor,
  lightColorHex,
  screenWidthM,
  screenHeightM,
}: DiffractionRig3DProps) {
  return (
    <group data-rig-scene="diffraction">
      {/* Ambient */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      {/* Line source */}
      <LineSource color={lightColorHex} isLightOn={isLightOn} />

      {/* Obstacle at origin */}
      <Obstacle mode={mode} params={params} />
      <RigLabel
        text={
          mode === 'single-slit'
            ? '单缝'
            : mode === 'circular-aperture'
              ? '圆孔'
              : mode === 'circular-obstacle'
                ? '不透明圆盘'
                : '衍射光栅'
        }
        position={[0, BOARD_SIZE / 2 + 0.045, 0]}
      />

      {/* Screen */}
      <DiffractionScreen
        mode={mode}
        params={params}
        isLightOn={isLightOn}
        showPattern={showPattern}
        isWhiteLight={isWhiteLight}
        filterColor={filterColor}
        screenWidthM={screenWidthM}
        screenHeightM={screenHeightM}
      />
      <RigLabel text="观察屏" position={[0, screenHeightM / 2 + 0.045, params.screenDistance]} />

      {/* Optical axis helper (subtle) */}
      <mesh position={[0, 0, (params.screenDistance - SOURCE_DISTANCE) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0003, 0.0003, params.screenDistance + SOURCE_DISTANCE, 8]} />
        <meshBasicMaterial color="#444444" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}
