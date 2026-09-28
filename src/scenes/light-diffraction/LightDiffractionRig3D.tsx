import { Html } from '@react-three/drei/web/Html'
import { Line } from '@react-three/drei/core/Line'
import { memo, useEffect, useMemo } from 'react'
import { CanvasTexture, CylinderGeometry, DoubleSide, Path, Shape, ShapeGeometry, SRGBColorSpace } from 'three'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'
import {
  FILTER_HEX,
  airyDiskRadius,
  drawDiffractionPattern,
  drawWhiteLightPattern,
  getApertureRange,
  getPhysicalViewWidth,
  gratingFirstOrderDisplacement,
  singleSlitFirstMinimumPosition,
  poissonSpotFirstDarkRadius,
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
} from './model'

function readSceneBackgroundColor(): string {
  if (typeof window === 'undefined') return '#222222'
  const shell = document.querySelector('.app-shell')
  if (!shell) return '#222222'
  return getComputedStyle(shell).getPropertyValue('--scene-optical-bg').trim() || '#222222'
}

const MAT_METAL = { color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 }
const MAT_BLACK_PLASTIC = { color: 0x151515, metalness: 0.3, roughness: 0.7 }
const MAT_WHITE_TUBE = { color: 0xe0e0e0, metalness: 0.1, roughness: 0.5 }
const MAT_GLASS = {
  color: 0x88ccff,
  transparent: true,
  opacity: 0.4,
  metalness: 0.9,
  roughness: 0.1,
}

const TUBE_START_X = -2
const OPTICAL_AXIS_Y = 4.5
const BASE_3D_LENGTH = 10

type LightDiffractionRig3DProps = {
  params: DiffractionParams
  mode: DiffractionMode
  lightColorHex: number
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
}

function Stand({ xPos, height = 3.5, radialSegments = 16 }: { xPos: number; height?: number; radialSegments?: number }) {
  return (
    <group position={[xPos, 0, 0]}>
      <mesh position={[0, height / 2 + 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, height, radialSegments]} />
        <meshStandardMaterial {...MAT_METAL} />
        <mesh position={[0, -height / 2 + 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.4, 2]} />
          <meshStandardMaterial {...MAT_METAL} />
        </mesh>
        <mesh position={[0, -height / 2 + 0.5, 1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.4, radialSegments]} />
          <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
        </mesh>
      </mesh>
    </group>
  )
}

function Label({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center>
      <div className="light-diffraction-label">{text}</div>
    </Html>
  )
}

function apertureVisualSize(mode: DiffractionMode, params: DiffractionParams): number {
  if (mode === 'diffraction-grating') return 1.2
  const range = getApertureRange(mode)
  const progress = Math.max(0, Math.min(1, (params.apertureSize - range.min) / (range.max - range.min)))
  return 0.16 + progress * 1.1
}

function createAperturePlateGeometry(mode: DiffractionMode, openingSize: number, segments: number): ShapeGeometry {
  const half = 1.2
  const plate = new Shape()
  plate.moveTo(-half, -half)
  plate.lineTo(-half, half)
  plate.lineTo(half, half)
  plate.lineTo(half, -half)
  plate.lineTo(-half, -half)

  const opening = new Path()
  if (mode === 'single-slit') {
    const halfWidth = openingSize / 2
    const halfHeight = 0.95
    opening.moveTo(-halfWidth, -halfHeight)
    opening.lineTo(halfWidth, -halfHeight)
    opening.lineTo(halfWidth, halfHeight)
    opening.lineTo(-halfWidth, halfHeight)
    opening.lineTo(-halfWidth, -halfHeight)
  } else {
    opening.absellipse(0, 0, openingSize / 2, openingSize / 2, 0, Math.PI * 2, false)
  }
  plate.holes.push(opening)
  return new ShapeGeometry(plate, Math.max(segments, 32))
}

export const LightDiffractionRig3D = memo(function LightDiffractionRig3D({
  params,
  mode,
  lightColorHex,
  isLightOn,
  isWhiteLight,
  filterColor,
}: LightDiffractionRig3DProps) {
  const current3DLength = BASE_3D_LENGTH * params.screenDistance
  const tailX = TUBE_START_X + current3DLength
  const apertureX = TUBE_START_X - 0.75
  const screenX = tailX + 1
  const railStartX = -14
  const railEndX = tailX + 3
  const railLength = railEndX - railStartX
  const railCenterX = (railStartX + railEndX) / 2

  const perf = useMemo(() => resolvePerformanceProfile(), [])
  const geoDetail = useMemo(() => perf.geometry, [perf])
  const bgColor = useMemo(() => readSceneBackgroundColor(), [])
  const shadowsEnabled = perf.shadowMapSize !== null

  const shadowProps = shadowsEnabled
    ? { castShadow: true as const, receiveShadow: true as const }
    : {}

  const tubeGeo = useMemo(() => {
    const geo = new CylinderGeometry(0.8, 0.8, 1, geoDetail.cylinderRadialSegments)
    geo.translate(0, 0.5, 0)
    return geo
  }, [geoDetail.cylinderRadialSegments])

  useEffect(() => {
    return () => { tubeGeo.dispose() }
  }, [tubeGeo])

  const apertureVisualScale = useMemo(() => apertureVisualSize(mode, params), [mode, params])
  const aperturePlateGeometry = useMemo(
    () => mode === 'single-slit' || mode === 'circular-aperture'
      ? createAperturePlateGeometry(mode, apertureVisualScale, geoDetail.circleSegments ?? 32)
      : null,
    [mode, apertureVisualScale, geoDetail.circleSegments],
  )
  useEffect(() => () => aperturePlateGeometry?.dispose(), [aperturePlateGeometry])

  const screenTexture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) return null
    if (!isLightOn) {
      context.fillStyle = '#080808'
      context.fillRect(0, 0, canvas.width, canvas.height)
    } else if (isWhiteLight) {
      drawWhiteLightPattern(context, mode, params, filterColor, 10)
    } else {
      drawDiffractionPattern(context, params, mode)
    }
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
    texture.needsUpdate = true
    return texture
  }, [params, mode, isLightOn, isWhiteLight, filterColor])
  useEffect(() => () => screenTexture?.dispose(), [screenTexture])

  // Map the first visible feature into the same adaptive physical field used
  // by the screen texture. This keeps the 3D rays on the panel even though
  // the apparatus and screen are schematic rather than to scale.
  const displayParams = isWhiteLight ? { ...params, wavelength: 700 } : params
  const featurePosition = mode === 'single-slit'
    ? singleSlitFirstMinimumPosition(displayParams)
    : mode === 'circular-aperture'
      ? airyDiskRadius(displayParams)
      : mode === 'circular-obstacle'
        ? poissonSpotFirstDarkRadius(displayParams)
        : gratingFirstOrderDisplacement(displayParams)
  const beamSpreadZ = Number.isFinite(featurePosition)
    ? Math.min(1.1, featurePosition / getPhysicalViewWidth(mode, displayParams) * 2.2)
    : 0

  return (
    <group data-rig-scene="light-diffraction">
      {/* Background & fog */}
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 20, 80]} />

      {/* Lights */}
      <ambientLight intensity={shadowsEnabled ? 0.4 : 0.6} />
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
      <pointLight
        position={[-11, OPTICAL_AXIS_Y, 0]}
        intensity={isLightOn ? 1.5 : 0}
        distance={25}
        color={lightColorHex}
      />

      {/* Light beam visualization */}
      {isLightOn && (
        <>
          {/* Main beam */}
          <Line
            points={[
              [-12.2, OPTICAL_AXIS_Y, 0],
              [apertureX, OPTICAL_AXIS_Y, 0],
            ]}
            color={lightColorHex}
            lineWidth={2.5}
            transparent
            opacity={0.25}
          />
          {/* Beam inside tube */}
          {mode !== 'circular-obstacle' && (
            <Line
              points={[
                [apertureX, OPTICAL_AXIS_Y, 0],
                [screenX, OPTICAL_AXIS_Y, 0],
              ]}
              color={lightColorHex}
              lineWidth={5}
              transparent
              opacity={0.15}
            />
          )}
          {/* Diverging beams for diffraction */}
          {(mode === 'single-slit' || mode === 'diffraction-grating') && (
            <>
              <Line
                points={[
                  [apertureX, OPTICAL_AXIS_Y, 0],
                  [screenX, OPTICAL_AXIS_Y, beamSpreadZ],
                ]}
                color={lightColorHex}
                lineWidth={1.5}
                transparent
                opacity={0.18}
              />
              <Line
                points={[
                  [apertureX, OPTICAL_AXIS_Y, 0],
                  [screenX, OPTICAL_AXIS_Y, -beamSpreadZ],
                ]}
                color={lightColorHex}
                lineWidth={1.5}
                transparent
                opacity={0.18}
              />
            </>
          )}
          {(mode === 'circular-aperture' || mode === 'circular-obstacle') && (
            <>
              {/* Conical beam spread for circular patterns */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2
                const z = Math.cos(angle) * beamSpreadZ
                const yOff = Math.sin(angle) * beamSpreadZ
                return (
                  <Line
                    key={i}
                    points={[
                      [
                        apertureX,
                        OPTICAL_AXIS_Y + (mode === 'circular-obstacle' ? apertureVisualScale / 2 : 0) * Math.sin(angle),
                        (mode === 'circular-obstacle' ? apertureVisualScale / 2 : 0) * Math.cos(angle),
                      ],
                      [screenX, OPTICAL_AXIS_Y + yOff, z],
                    ]}
                    color={lightColorHex}
                    lineWidth={1.2}
                    transparent
                    opacity={0.12}
                  />
                )
              })}
            </>
          )}
        </>
      )}

      {/* ====== Rail ====== */}
      <mesh position={[railCenterX, 0, 0]} {...shadowProps}>
        <boxGeometry args={[railLength, 1, 3]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>

      {/* Scale on rail */}
      <mesh position={[railCenterX, 0, 1.51]}>
        <planeGeometry args={[railLength - 1, 0.8]} />
        <meshBasicMaterial color="#dddddd" />
      </mesh>

      {/* Rail feet */}
      <mesh position={[railStartX + 1, -1, 0]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <boxGeometry args={[2, 2, 4]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>
      <mesh position={[railEndX - 1, -1, 0]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <boxGeometry args={[2, 2, 4]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>

      {/* ====== Light source ====== */}
      <Stand xPos={-13} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />
      <mesh position={[-13, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <cylinderGeometry args={[1.2, 1.2, 2, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>
      <mesh position={[-12.2, OPTICAL_AXIS_Y, 0]}>
        <sphereGeometry args={[0.5, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshBasicMaterial color={isLightOn ? lightColorHex : 0x111111} />
      </mesh>
      <Label text="光源" position={[-13, OPTICAL_AXIS_Y + 2.8, 0]} />

      {/* ====== Lens ====== */}
      <Stand xPos={-9.5} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />
      <mesh position={[-9.5, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1, 0.15, geoDetail.torusRadialSegments, geoDetail.torusTubularSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>
      <mesh position={[-9.5, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.95, 0.95, 0.1, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_GLASS} />
      </mesh>
      <Label text="透镜" position={[-9.5, OPTICAL_AXIS_Y + 1.2, 0]} />

      {/* ====== Filter (before aperture) ====== */}
      {isWhiteLight && filterColor !== 'none' && (
        <>
          <Stand xPos={TUBE_START_X - 2.5} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />
          <mesh position={[TUBE_START_X - 2.5, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.6, 1.6]} />
            <meshStandardMaterial
              color={FILTER_HEX[filterColor]}
              transparent
              opacity={0.55}
              side={2}
              emissive={FILTER_HEX[filterColor]}
              emissiveIntensity={0.2}
            />
          </mesh>
          <Label text="滤光片" position={[TUBE_START_X - 2.5, OPTICAL_AXIS_Y + 1.2, 0]} />
        </>
      )}

      {/* ====== Aperture / Obstacle ====== */}
      <Stand xPos={TUBE_START_X - 0.75} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />

      {/* Open holder ring leaves the optical path clear. */}
      <mesh position={[apertureX, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.34, 0.09, geoDetail.torusRadialSegments, geoDetail.torusTubularSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>

      {aperturePlateGeometry && (
        <mesh
          geometry={aperturePlateGeometry}
          position={[apertureX, OPTICAL_AXIS_Y, 0]}
          rotation={[0, Math.PI / 2, 0]}
          renderOrder={1}
        >
          <meshBasicMaterial color={0x374047} side={DoubleSide} />
        </mesh>
      )}

      {mode === 'circular-obstacle' && (
        <mesh position={[apertureX, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[apertureVisualScale / 2, geoDetail.circleSegments ?? 32]} />
          <meshStandardMaterial color={0x111820} metalness={0.15} roughness={0.8} side={DoubleSide} />
        </mesh>
      )}

      {mode === 'diffraction-grating' && (
        <group position={[apertureX, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[2.4, 2.4]} />
            <meshBasicMaterial color={0x1c252b} side={DoubleSide} />
          </mesh>
          {Array.from({ length: 25 }, (_, index) => (
            <mesh key={index} position={[(index - 12) * 0.088, 0, 0.035]}>
              <boxGeometry args={[0.026, 2.2, 0.05]} />
              <meshBasicMaterial color={0x9bb9c5} />
            </mesh>
          ))}
        </group>
      )}

      <Label
        text={mode === 'circular-obstacle' ? '不透明圆盘' : mode === 'diffraction-grating' ? '光栅（结构示意）' : mode === 'circular-aperture' ? '圆孔' : '单缝'}
        position={[apertureX, OPTICAL_AXIS_Y + 2.8, 0]}
      />

      {/* ====== Main tube (dynamic length) ====== */}
      <mesh
        position={[TUBE_START_X, OPTICAL_AXIS_Y, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        scale={[1, current3DLength, 1]}
        {...(shadowsEnabled ? { castShadow: true } : {})}
        geometry={tubeGeo}
      >
        <meshStandardMaterial {...MAT_WHITE_TUBE} />
      </mesh>
      <Label
        text="遮光筒"
        position={[TUBE_START_X + current3DLength / 2, OPTICAL_AXIS_Y + 1.3, 0]}
      />

      {/* ====== Tail group ====== */}
      <Stand xPos={tailX - 1} height={3.5} radialSegments={geoDetail.cylinderRadialSegments} />

      {/* Open screen frame leaves the textured observation plane unobstructed. */}
      <mesh position={[screenX, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.15, 0.1, geoDetail.torusRadialSegments, geoDetail.torusTubularSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>

      {/* Screen */}
      <mesh position={[screenX + 0.04, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={2}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial map={screenTexture ?? undefined} color={0xffffff} side={DoubleSide} toneMapped={false} />
      </mesh>

      <Label text="衍射屏" position={[screenX, OPTICAL_AXIS_Y + 3, 0]} />

    </group>
  )
})
