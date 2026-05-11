import React, { useMemo } from 'react'
import * as THREE from 'three'
import { type DiffractionMode, type DiffractionParams, type FilterColor } from '../light-diffraction/model'
import { DiffractionScreen } from './DiffractionScreen'

const SOURCE_DISTANCE = 0.2 // m, distance from source to obstacle
const SOURCE_LENGTH = 0.08 // m, line source length (80mm)
const SOURCE_THICKNESS = 0.008 // m
const BOARD_SIZE = 0.06 // m, obstacle board size (60mm)
const BOARD_THICKNESS = 0.002 // m

function SlitObstacle({ slitWidthM }: { slitWidthM: number }) {
  const halfBoard = BOARD_SIZE / 2
  const halfSlit = slitWidthM / 2
  const halfGap = (BOARD_SIZE - slitWidthM) / 4

  return (
    <group>
      {/* Left board */}
      <mesh position={[-halfSlit - halfGap, 0, 0]}>
        <boxGeometry args={[halfBoard * 2 - halfSlit - halfGap * 2, BOARD_SIZE, BOARD_THICKNESS]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Right board */}
      <mesh position={[halfSlit + halfGap, 0, 0]}>
        <boxGeometry args={[halfBoard * 2 - halfSlit - halfGap * 2, BOARD_SIZE, BOARD_THICKNESS]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  )
}

function HoleObstacle({ holeDiameterM }: { holeDiameterM: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const s2 = BOARD_SIZE / 2
    s.moveTo(-s2, -s2)
    s.lineTo(s2, -s2)
    s.lineTo(s2, s2)
    s.lineTo(-s2, s2)
    s.lineTo(-s2, -s2)
    const hole = new THREE.Path()
    hole.absarc(0, 0, holeDiameterM / 2, 0, Math.PI * 2, true)
    s.holes.push(hole)
    return s
  }, [holeDiameterM])

  const geometry = useMemo(() => {
    return new THREE.ExtrudeGeometry(shape, { depth: BOARD_THICKNESS, bevelEnabled: false })
  }, [shape])

  return (
    <mesh geometry={geometry} position={[0, 0, -BOARD_THICKNESS / 2]}>
      <meshStandardMaterial color="#2a2a2a" side={THREE.DoubleSide} />
    </mesh>
  )
}

function GratingObstacle({ slitWidthM, gratingLines }: { slitWidthM: number; gratingLines: number }) {
  const spacingM = 1e-3 / gratingLines
  const slitCount = Math.max(3, Math.min(20, Math.floor(BOARD_SIZE / spacingM)))

  const meshes = useMemo(() => {
    const items: React.JSX.Element[] = []
    const totalWidth = (slitCount - 1) * spacingM
    const startX = -totalWidth / 2

    for (let i = 0; i < slitCount; i++) {
      const x = startX + i * spacingM
      items.push(
        <mesh key={`slit-${i}`} position={[x, 0, 0]}>
          <boxGeometry args={[slitWidthM, BOARD_SIZE, BOARD_THICKNESS * 1.5]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      )
    }
    return items
  }, [slitWidthM, spacingM, slitCount])

  // Backing plate
  return (
    <group>
      <mesh position={[0, 0, -BOARD_THICKNESS / 2]}>
        <boxGeometry args={[BOARD_SIZE, BOARD_SIZE, BOARD_THICKNESS]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {meshes}
    </group>
  )
}

function SphereObstacle({ diameterM }: { diameterM: number }) {
  // Ensure sphere is visible in 3D scene even when physical size is tiny
  const displayRadius = Math.max(diameterM / 2, 0.003)
  return (
    <mesh>
      <sphereGeometry args={[displayRadius, 32, 32]} />
      <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
      {/* Poisson spot indicator — small bright dot on the back face */}
      <mesh position={[0, 0, displayRadius * 0.9]}>
        <sphereGeometry args={[displayRadius * 0.15, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
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
      return <SphereObstacle diameterM={apertureM} />
    case 'diffraction-grating': {
      const d = 1e-3 / params.gratingLines
      const a = d * 0.2
      return <GratingObstacle slitWidthM={a} gratingLines={params.gratingLines} />
    }
  }
}

function LineSource({ color, isLightOn }: { color: number; isLightOn: boolean }) {
  const hex = `#${color.toString(16).padStart(6, '0')}`
  return (
    <group position={[0, 0, -SOURCE_DISTANCE]}>
      {/* Core — bright emissive cylinder */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[SOURCE_THICKNESS / 2, SOURCE_THICKNESS / 2, SOURCE_LENGTH, 16]} />
        <meshStandardMaterial
          color={hex}
          emissive={hex}
          emissiveIntensity={isLightOn ? 4 : 0.2}
          toneMapped={false}
        />
      </mesh>
      {/* Glow halo — larger translucent cylinder */}
      {isLightOn && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[SOURCE_THICKNESS * 1.5, SOURCE_THICKNESS * 1.5, SOURCE_LENGTH * 0.95, 16]} />
          <meshBasicMaterial color={hex} transparent opacity={0.25} toneMapped={false} />
        </mesh>
      )}
      {/* Point light */}
      {isLightOn && (
        <pointLight
          color={hex}
          intensity={15}
          distance={3}
          decay={2}
        />
      )}
      {/* Beam direction indicator — flat translucent panel */}
      <mesh position={[0, 0, SOURCE_DISTANCE / 2]}>
        <boxGeometry args={[SOURCE_LENGTH * 0.8, SOURCE_LENGTH, SOURCE_DISTANCE]} />
        <meshBasicMaterial color={hex} transparent opacity={isLightOn ? 0.04 : 0.01} />
      </mesh>
    </group>
  )
}

export type DiffractionRig3DProps = {
  mode: DiffractionMode
  params: DiffractionParams
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  lightColorHex: number
  screenWidthM: number
  screenHeightM: number
}

export function DiffractionRig3D({ mode, params, isLightOn, isWhiteLight, filterColor, lightColorHex, screenWidthM, screenHeightM }: DiffractionRig3DProps) {
  return (
    <group data-rig-scene="diffraction">
      {/* Ambient */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      {/* Line source */}
      <LineSource color={lightColorHex} isLightOn={isLightOn} />

      {/* Obstacle at origin */}
      <Obstacle mode={mode} params={params} />

      {/* Screen */}
      <DiffractionScreen
        mode={mode}
        params={params}
        isLightOn={isLightOn}
        isWhiteLight={isWhiteLight}
        filterColor={filterColor}
        screenWidthM={screenWidthM}
        screenHeightM={screenHeightM}
      />

      {/* Optical axis helper (subtle) */}
      <mesh position={[0, 0, (params.screenDistance - SOURCE_DISTANCE) / 2]}>
        <cylinderGeometry args={[0.0003, 0.0003, params.screenDistance + SOURCE_DISTANCE, 8]} />
        <meshBasicMaterial color="#444444" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}
