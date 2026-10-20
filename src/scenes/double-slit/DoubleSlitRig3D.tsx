import { Html } from '@react-three/drei/web/Html'
import { Line } from '../../scene3d/ClassroomLine'
import { useThree } from '@react-three/fiber'
import { memo, useEffect, useMemo } from 'react'
import { CanvasTexture, CylinderGeometry, DoubleSide, SRGBColorSpace } from 'three'
import { buildSlitPlateLayout } from './apparatus'
import { FILTER_HEX, drawInterferencePattern, drawWhiteLightPattern, PHYSICAL_VIEW_WIDTH, type DoubleSlitParams, type FilterColor } from './model'
import { INITIAL_MEASUREMENT_READOUT_MM, micrometerWheelRotationRadians } from './measurement'
import { OpticalStageLighting, Stand } from '../../domains/optics/OpticalBench3D'
import { MAT_BLACK_PLASTIC, MAT_METAL, useOpticalStage } from '../../domains/optics/opticalStage'

/** Canvas textures are imperative three.js objects; flag a re-upload after redrawing the canvas. */
function markTextureDirty(texture: CanvasTexture) {
  texture.needsUpdate = true
}

const MAT_DARK_METAL = { color: 0x222222, metalness: 0.5, roughness: 0.45 }
const MAT_TRANSPARENT_TUBE = { color: 0x738390, metalness: 0.2, roughness: 0.65, transparent: true, opacity: 0.22, depthWrite: false, side: DoubleSide }
const MAT_GLASS = { color: 0x88ccff, transparent: true, opacity: 0.4, metalness: 0.2, roughness: 0.2, side: DoubleSide }

const OPTICAL_AXIS_Y = 4.5
const SOURCE_X = -13
const LENS_X = -9.5
const FILTER_X = -6.5
const SINGLE_SLIT_X = -4.75
const DOUBLE_SLIT_X = -3.5
const TUBE_START_X = DOUBLE_SLIT_X + 0.2
const DISPLAY_UNITS_PER_METER = 10
const SLIT_PLATE_THICKNESS = 0.12

type DoubleSlitRig3DProps = {
  params: DoubleSlitParams
  lightColorHex: number
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  singleSlitAngle: number
  doubleSlitAngle: number
  eyepieceAngle: number
  wheelReadoutMm: number
  showFringeOrders: boolean
}

function Label({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center>
      <div className="double-slit-label">{text}</div>
    </Html>
  )
}

function SlitPlate({
  x,
  angle,
  slitCount,
  params,
}: {
  x: number
  angle: number
  slitCount: 1 | 2
  params: DoubleSlitParams
}) {
  const layout = useMemo(
    () => buildSlitPlateLayout(slitCount, params.slitDistance, params.slitWidth),
    [slitCount, params.slitDistance, params.slitWidth],
  )
  const material = slitCount === 1 ? MAT_BLACK_PLASTIC : MAT_DARK_METAL
  const rotation = angle * Math.PI / 180

  return (
    <group position={[x, OPTICAL_AXIS_Y, 0]} rotation={[rotation, 0, 0]}>
      {layout.bars.map((bar, index) => (
        <mesh key={index} position={[0, bar.centerY, bar.centerZ]} castShadow>
          <boxGeometry args={[SLIT_PLATE_THICKNESS, bar.height, bar.widthZ]} />
          <meshStandardMaterial {...material} />
        </mesh>
      ))}
    </group>
  )
}

function ScreenPattern({
  screenX,
  params,
  isLightOn,
  isWhiteLight,
  filterColor,
  doubleSlitAngle,
  singleSlitAngle,
  eyepieceAngle,
  wheelReadoutMm,
  showFringeOrders,
}: {
  screenX: number
  params: DoubleSlitParams
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  doubleSlitAngle: number
  singleSlitAngle: number
  eyepieceAngle: number
  wheelReadoutMm: number
  showFringeOrders: boolean
}) {
  const invalidate = useThree((state) => state.invalidate)
  const display = useMemo(() => {
    const patternCanvas = document.createElement('canvas')
    const reticleCanvas = document.createElement('canvas')
    patternCanvas.width = 256
    patternCanvas.height = 256
    reticleCanvas.width = 256
    reticleCanvas.height = 256
    const patternTexture = new CanvasTexture(patternCanvas)
    const reticleTexture = new CanvasTexture(reticleCanvas)
    patternTexture.colorSpace = SRGBColorSpace
    reticleTexture.colorSpace = SRGBColorSpace
    return { patternCanvas, reticleCanvas, patternTexture, reticleTexture }
  }, [])

  useEffect(() => {
    const ctx = display.patternCanvas.getContext('2d')
    if (!ctx) return
    if (!isLightOn) {
      ctx.fillStyle = '#07090b'
      ctx.fillRect(0, 0, display.patternCanvas.width, display.patternCanvas.height)
      ctx.beginPath()
      ctx.arc(128, 128, 126, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 2
      ctx.stroke()
    } else if (isWhiteLight) {
      drawWhiteLightPattern(ctx, params, filterColor, doubleSlitAngle, singleSlitAngle, 15)
    } else {
      drawInterferencePattern(ctx, params, doubleSlitAngle, singleSlitAngle)
    }
    markTextureDirty(display.patternTexture)
    invalidate()
  }, [display, invalidate, params, isLightOn, isWhiteLight, filterColor, doubleSlitAngle, singleSlitAngle])

  useEffect(() => {
    const ctx = display.reticleCanvas.getContext('2d')
    if (!ctx) return
    const size = display.reticleCanvas.width
    const center = size / 2
    const radius = size / 2 - 3
    ctx.clearRect(0, 0, size, size)

    const wheelOffsetMm = wheelReadoutMm - INITIAL_MEASUREMENT_READOUT_MM
    const reticleOffsetPx = wheelOffsetMm * 1e-3 / PHYSICAL_VIEW_WIDTH * size
    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.clip()
    ctx.translate(center + reticleOffsetPx, center)
    ctx.rotate(eyepieceAngle * Math.PI / 180)
    ctx.strokeStyle = isLightOn ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-radius * 0.48, 0)
    ctx.lineTo(radius * 0.48, 0)
    ctx.moveTo(0, -radius * 0.48)
    ctx.lineTo(0, radius * 0.48)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.arc(0, 0, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    const displayWavelengthNm = isWhiteLight
      ? filterColor === 'none' ? null : filterColor === 'red' ? 650 : filterColor === 'green' ? 532 : 450
      : params.wavelength
    if (displayWavelengthNm !== null) {
      const spacingM = params.screenDistance * displayWavelengthNm * 1e-9 / (params.slitDistance * 1e-3)
      const spacingPx = spacingM / PHYSICAL_VIEW_WIDTH * size
      if (spacingPx > 8 && Number.isFinite(spacingPx)) {
        const barY = center + radius * 0.72
        const barStartX = center - spacingPx / 2
        ctx.strokeStyle = 'rgba(255,255,255,0.68)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(barStartX, barY)
        ctx.lineTo(barStartX + spacingPx, barY)
        ctx.moveTo(barStartX, barY - 3)
        ctx.lineTo(barStartX, barY + 3)
        ctx.moveTo(barStartX + spacingPx, barY - 3)
        ctx.lineTo(barStartX + spacingPx, barY + 3)
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Δx', center, barY + 14)

        if (showFringeOrders && !isWhiteLight) {
          const maxOrder = Math.min(12, Math.floor(radius / spacingPx))
          ctx.font = '10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillStyle = 'rgba(255,255,255,0.78)'
          ctx.strokeStyle = 'rgba(255,255,255,0.65)'
          for (let order = -maxOrder; order <= maxOrder; order += 1) {
            const x = center + order * spacingPx
            ctx.beginPath()
            ctx.moveTo(x, center - 5)
            ctx.lineTo(x, center + 5)
            ctx.stroke()
            ctx.fillText(String(order), x, center - radius * 0.12)
          }
        }
      }
    }
    markTextureDirty(display.reticleTexture)
    invalidate()
  }, [display, invalidate, params, isLightOn, isWhiteLight, filterColor, eyepieceAngle, wheelReadoutMm, showFringeOrders])

  useEffect(() => () => {
    display.patternTexture.dispose()
    display.reticleTexture.dispose()
  }, [display])

  return (
    <group>
      <mesh position={[screenX + 1.03, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial map={display.patternTexture} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[screenX + 1.04, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial map={display.reticleTexture} side={DoubleSide} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

export const DoubleSlitRig3D = memo(function DoubleSlitRig3D({
  params,
  lightColorHex,
  isLightOn,
  isWhiteLight,
  filterColor,
  singleSlitAngle,
  doubleSlitAngle,
  eyepieceAngle,
  wheelReadoutMm,
  showFringeOrders,
}: DoubleSlitRig3DProps) {
  const invalidate = useThree((state) => state.invalidate)
  const screenX = DOUBLE_SLIT_X + DISPLAY_UNITS_PER_METER * params.screenDistance
  const tubeLength = screenX - TUBE_START_X
  const wheelX = screenX + 2
  const eyepieceX = screenX + 3.5
  const wheelOffsetMm = wheelReadoutMm - INITIAL_MEASUREMENT_READOUT_MM
  const reticleOffsetUnits = wheelOffsetMm * (2.4 / (PHYSICAL_VIEW_WIDTH * 1000))
  const wheelRotation = micrometerWheelRotationRadians(wheelReadoutMm)
  const eyepieceRotation = eyepieceAngle * Math.PI / 180
  const slitAngle = doubleSlitAngle * Math.PI / 180
  const slitSeparation = params.slitDistance * 2
  const halfSeparationY = -Math.sin(slitAngle) * slitSeparation / 2
  const halfSeparationZ = Math.cos(slitAngle) * slitSeparation / 2

  const stage = useOpticalStage()
  const { perf, shadowsEnabled, shadowProps } = stage
  const geoDetail = useMemo(() => perf.geometry, [perf])

  const tubeGeo = useMemo(() => {
    const geometry = new CylinderGeometry(0.8, 0.8, 1, geoDetail.cylinderRadialSegments)
    geometry.translate(0, 0.5, 0)
    return geometry
  }, [geoDetail.cylinderRadialSegments])

  useEffect(() => () => tubeGeo.dispose(), [tubeGeo])
  useEffect(() => {
    invalidate()
    const frame = window.requestAnimationFrame(invalidate)
    return () => window.cancelAnimationFrame(frame)
  }, [invalidate])

  const outgoingColor = isWhiteLight && filterColor === 'none' ? 0xffffff : lightColorHex

  return (
    <group data-rig-scene="double-slit">
      <OpticalStageLighting stage={stage} />
      <pointLight position={[-11, OPTICAL_AXIS_Y, 0]} intensity={isLightOn ? 1.5 : 0} distance={25} color={outgoingColor} />

      {isLightOn && (
        <>
          <Line points={[[-12.2, OPTICAL_AXIS_Y, 0], [SINGLE_SLIT_X, OPTICAL_AXIS_Y, 0]]} color={outgoingColor} lineWidth={2.5} transparent opacity={0.28} />
          <Line points={[[SINGLE_SLIT_X, OPTICAL_AXIS_Y, 0], [DOUBLE_SLIT_X, OPTICAL_AXIS_Y, 0]]} color={outgoingColor} lineWidth={2} transparent opacity={0.22} />
          <Line points={[[DOUBLE_SLIT_X, OPTICAL_AXIS_Y - halfSeparationY, -halfSeparationZ], [screenX, OPTICAL_AXIS_Y - halfSeparationY * 1.5, -halfSeparationZ * 1.5]]} color={outgoingColor} lineWidth={1.8} transparent opacity={0.2} />
          <Line points={[[DOUBLE_SLIT_X, OPTICAL_AXIS_Y + halfSeparationY, halfSeparationZ], [screenX, OPTICAL_AXIS_Y + halfSeparationY * 1.5, halfSeparationZ * 1.5]]} color={outgoingColor} lineWidth={1.8} transparent opacity={0.2} />
        </>
      )}

      <mesh position={[0, 0, 0]} {...shadowProps}>
        <boxGeometry args={[32, 1, 3]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>
      <mesh position={[0, 0, 1.51]}>
        <planeGeometry args={[31, 0.8]} />
        <meshBasicMaterial color="#dddddd" />
      </mesh>
      <mesh position={[-14, -1, 0]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <boxGeometry args={[2, 2, 4]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>
      <mesh position={[14, -1, 0]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <boxGeometry args={[2, 2, 4]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>

      <Stand xPos={SOURCE_X} height={3} radialSegments={geoDetail.cylinderRadialSegments} />
      <mesh position={[SOURCE_X, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <cylinderGeometry args={[1.2, 1.2, 2, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>
      <mesh position={[-12.2, OPTICAL_AXIS_Y, 0]}>
        <sphereGeometry args={[0.5, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshBasicMaterial color={isLightOn ? outgoingColor : 0x111111} />
      </mesh>
      <Label text="光源" position={[SOURCE_X, OPTICAL_AXIS_Y + 3.5, -0.6]} />

      <Stand xPos={LENS_X} height={3} radialSegments={geoDetail.cylinderRadialSegments} />
      <mesh position={[LENS_X, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1, 0.15, geoDetail.torusRadialSegments, geoDetail.torusTubularSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>
      <mesh position={[LENS_X, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.95, 0.95, 0.1, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_GLASS} />
      </mesh>
      <Label text="透镜" position={[LENS_X, OPTICAL_AXIS_Y + 2, 0.7]} />

      {isWhiteLight && filterColor !== 'none' && (
        <>
          <Stand xPos={FILTER_X} height={3} radialSegments={geoDetail.cylinderRadialSegments} />
          <mesh position={[FILTER_X, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.6, 1.6]} />
            <meshStandardMaterial color={FILTER_HEX[filterColor]} transparent opacity={0.6} side={DoubleSide} emissive={FILTER_HEX[filterColor]} emissiveIntensity={0.2} />
          </mesh>
          <Label text="滤光片" position={[FILTER_X, OPTICAL_AXIS_Y + 3, -0.7]} />
        </>
      )}

      <Stand xPos={SINGLE_SLIT_X} height={3} radialSegments={geoDetail.cylinderRadialSegments} />
      <SlitPlate x={SINGLE_SLIT_X} angle={singleSlitAngle} slitCount={1} params={params} />
      <Label text="单缝开口" position={[SINGLE_SLIT_X, OPTICAL_AXIS_Y + 3.5, 0.7]} />

      <Stand xPos={DOUBLE_SLIT_X} height={3} radialSegments={geoDetail.cylinderRadialSegments} />
      <SlitPlate x={DOUBLE_SLIT_X} angle={doubleSlitAngle} slitCount={2} params={params} />
      <mesh position={[DOUBLE_SLIT_X + 1.7, OPTICAL_AXIS_Y + 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 3.4, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>
      <mesh position={[DOUBLE_SLIT_X + 1.7, OPTICAL_AXIS_Y + 0.75, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.5, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>
      <mesh position={[DOUBLE_SLIT_X + 3.4, OPTICAL_AXIS_Y + 1.55, 0]}>
        <sphereGeometry args={[0.3, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>
      <Label text="双缝开口" position={[DOUBLE_SLIT_X - 2, OPTICAL_AXIS_Y + 6, -0.8]} />

      <mesh position={[TUBE_START_X, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, tubeLength, 1]} {...shadowProps} geometry={tubeGeo}>
        <meshStandardMaterial {...MAT_TRANSPARENT_TUBE} />
      </mesh>
      <Label text="遮光筒（剖视示意）" position={[TUBE_START_X + tubeLength / 2, OPTICAL_AXIS_Y + 0.5, 0]} />

      <Stand xPos={screenX} height={3.5} radialSegments={geoDetail.cylinderRadialSegments} />
      <mesh position={[screenX, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <cylinderGeometry args={[1.25, 1.25, 2, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial color={isLightOn ? outgoingColor : 0x17191c} transparent opacity={0.5} roughness={0.92} metalness={0.05} emissive={isLightOn ? outgoingColor : 0x000000} emissiveIntensity={isLightOn ? 0.08 : 0} depthWrite={false} />
      </mesh>
      <ScreenPattern
        screenX={screenX}
        params={params}
        isLightOn={isLightOn}
        isWhiteLight={isWhiteLight}
        filterColor={filterColor}
        doubleSlitAngle={doubleSlitAngle}
        singleSlitAngle={singleSlitAngle}
        eyepieceAngle={eyepieceAngle}
        wheelReadoutMm={wheelReadoutMm}
        showFringeOrders={showFringeOrders}
      />
      <Label text="毛玻璃与干涉条纹" position={[screenX + 2.5, OPTICAL_AXIS_Y + 4, -0.6]} />

      <mesh position={[wheelX, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.35, 1.35, 0.4, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>
      <group position={[wheelX, OPTICAL_AXIS_Y, 0]} rotation={[wheelRotation, 0, 0]}>
        <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.12, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
          <meshBasicMaterial color="#f6ad55" />
        </mesh>
      </group>
      <Label text="测量手轮" position={[wheelX + 0.6, OPTICAL_AXIS_Y + 3.2, 0.8]} />

      <mesh position={[eyepieceX, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 2.5, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>
      <mesh position={[eyepieceX - 1.26, OPTICAL_AXIS_Y, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.58, 40]} />
        <meshBasicMaterial color="#111820" transparent opacity={0.8} side={DoubleSide} />
      </mesh>
      <Line
        points={[
          [eyepieceX - 1.27, OPTICAL_AXIS_Y - 0.45 * Math.cos(eyepieceRotation), reticleOffsetUnits - 0.45 * Math.sin(eyepieceRotation)],
          [eyepieceX - 1.27, OPTICAL_AXIS_Y + 0.45 * Math.cos(eyepieceRotation), reticleOffsetUnits + 0.45 * Math.sin(eyepieceRotation)],
        ]}
        color="#b7f7dc"
        lineWidth={1.5}
      />
      <Line
        points={[
          [eyepieceX - 1.27, OPTICAL_AXIS_Y + 0.45 * Math.sin(eyepieceRotation), reticleOffsetUnits - 0.45 * Math.cos(eyepieceRotation)],
          [eyepieceX - 1.27, OPTICAL_AXIS_Y - 0.45 * Math.sin(eyepieceRotation), reticleOffsetUnits + 0.45 * Math.cos(eyepieceRotation)],
        ]}
        color="#b7f7dc"
        lineWidth={1.5}
      />
      <Label text="目镜与分划板" position={[eyepieceX + 1.5, OPTICAL_AXIS_Y + 1.5, -0.8]} />
    </group>
  )
})
