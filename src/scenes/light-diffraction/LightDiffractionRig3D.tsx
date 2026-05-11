import { Html } from '@react-three/drei/web/Html'
import { Line } from '@react-three/drei/core/Line'
import { memo, useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'
import { FILTER_HEX, type DiffractionMode, type DiffractionParams, type FilterColor } from './model'

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

  // Aperture visual size mapping
  const apertureVisualScale = useMemo(() => {
    const a = params.apertureSize
    switch (mode) {
      case 'single-slit':
        return 0.02 + a * 20 // slit width in 3D units
      case 'circular-aperture':
      case 'circular-obstacle':
        return 0.03 + a * 15 // diameter in 3D units
      case 'diffraction-grating':
        return 0.05 // fixed visual size for grating holder
    }
  }, [params.apertureSize, mode])

  // Diffraction divergence angle for beam visualization
  const divergenceAngle = useMemo(() => {
    const lambda = params.wavelength * 1e-9
    const a = params.apertureSize * 1e-3
    if (mode === 'single-slit') {
      return lambda / a // first minimum angle
    }
    if (mode === 'circular-aperture' || mode === 'circular-obstacle') {
      return 1.22 * lambda / a // Airy disk angle
    }
    if (mode === 'diffraction-grating') {
      const d = 1e-3 / params.gratingLines
      return lambda / d // first order angle
    }
    return 0.01
  }, [params, mode])

  const beamSpreadZ = Math.tan(divergenceAngle) * current3DLength

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
              [tailX + 1, OPTICAL_AXIS_Y, 0],
            ]}
            color={lightColorHex}
            lineWidth={2.5}
            transparent
            opacity={0.25}
          />
          {/* Beam inside tube */}
          <Line
            points={[
              [TUBE_START_X - 0.5, OPTICAL_AXIS_Y, 0],
              [tailX, OPTICAL_AXIS_Y, 0],
            ]}
            color={lightColorHex}
            lineWidth={5}
            transparent
            opacity={0.15}
          />
          {/* Diverging beams for diffraction */}
          {(mode === 'single-slit' || mode === 'diffraction-grating') && (
            <>
              <Line
                points={[
                  [TUBE_START_X + 0.5, OPTICAL_AXIS_Y, 0],
                  [tailX + 1, OPTICAL_AXIS_Y, beamSpreadZ],
                ]}
                color={lightColorHex}
                lineWidth={1.5}
                transparent
                opacity={0.18}
              />
              <Line
                points={[
                  [TUBE_START_X + 0.5, OPTICAL_AXIS_Y, 0],
                  [tailX + 1, OPTICAL_AXIS_Y, -beamSpreadZ],
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
                const yOff = Math.sin(angle) * beamSpreadZ * 0.3
                return (
                  <Line
                    key={i}
                    points={[
                      [TUBE_START_X + 0.5, OPTICAL_AXIS_Y, 0],
                      [tailX + 1, OPTICAL_AXIS_Y + yOff, z],
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
      <mesh position={[0, 0, 0]} {...shadowProps}>
        <boxGeometry args={[32, 1, 3]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>

      {/* Scale on rail */}
      <mesh position={[0, 0, 1.51]}>
        <planeGeometry args={[31, 0.8]} />
        <meshBasicMaterial color="#dddddd" />
      </mesh>

      {/* Rail feet */}
      <mesh position={[-14, -1, 0]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <boxGeometry args={[2, 2, 4]} />
        <meshStandardMaterial {...MAT_METAL} />
      </mesh>
      <mesh position={[14, -1, 0]} {...(shadowsEnabled ? { castShadow: true } : {})}>
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
      <Label text="光源" position={[-13, OPTICAL_AXIS_Y + 2, 0]} />

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
      <Label text="透镜" position={[-9.5, OPTICAL_AXIS_Y + 2, 0]} />

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
          <Label text="滤光片" position={[TUBE_START_X - 2.5, OPTICAL_AXIS_Y + 2, 0]} />
        </>
      )}

      {/* ====== Aperture / Obstacle ====== */}
      <Stand xPos={TUBE_START_X - 0.75} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />

      {/* Aperture holder cylinder */}
      <mesh
        position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
        {...(shadowsEnabled ? { castShadow: true } : {})}
      >
        <cylinderGeometry args={[1, 1, 1.5, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>

      {/* Visual aperture representation */}
      {mode === 'single-slit' && (
        <mesh position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[apertureVisualScale, 1.4]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={0.6} side={2} />
        </mesh>
      )}
      {(mode === 'circular-aperture' || mode === 'circular-obstacle') && (
        <mesh position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[apertureVisualScale / 2, geoDetail.circleSegments ?? 32]} />
          <meshBasicMaterial
            color={mode === 'circular-aperture' ? 0xffffff : 0x111111}
            transparent
            opacity={mode === 'circular-aperture' ? 0.6 : 0.85}
            side={2}
          />
        </mesh>
      )}
      {mode === 'diffraction-grating' && (
        <mesh position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.2, 1.2]} />
          <meshStandardMaterial
            color={0x88ccff}
            transparent
            opacity={0.5}
            metalness={0.3}
            roughness={0.2}
            side={2}
          />
        </mesh>
      )}

      <Label text={mode === 'circular-obstacle' ? '圆球' : mode === 'diffraction-grating' ? '光栅' : mode === 'circular-aperture' ? '圆孔' : '单缝'} position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y + 2, 0]} />

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

      {/* Screen holder */}
      <mesh position={[tailX + 1, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <cylinderGeometry args={[1.2, 1.2, 2, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial
          color={isLightOn ? lightColorHex : 0x1a1a1a}
          transparent
          opacity={isLightOn ? 0.35 : 0.9}
          roughness={0.92}
          metalness={0.05}
          emissive={isLightOn ? lightColorHex : 0x000000}
          emissiveIntensity={isLightOn ? 0.15 : 0}
        />
      </mesh>

      {/* Screen */}
      <mesh position={[tailX + 1, OPTICAL_AXIS_Y, 0]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial
          color={isLightOn ? lightColorHex : 0x1a1a1a}
          transparent
          opacity={isLightOn ? 0.6 : 0.9}
          side={2}
        />
      </mesh>

      <Label text="观察屏" position={[tailX + 1, OPTICAL_AXIS_Y + 2.5, 0]} />

      {/* Eyepiece */}
      <mesh position={[tailX + 3.5, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <cylinderGeometry args={[0.6, 0.6, 2.5, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...MAT_BLACK_PLASTIC} />
      </mesh>
      <Label text="目镜" position={[tailX + 3.5, OPTICAL_AXIS_Y + 1.5, 0]} />
    </group>
  )
})
