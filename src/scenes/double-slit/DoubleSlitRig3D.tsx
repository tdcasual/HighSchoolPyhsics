import { Html } from '@react-three/drei/web/Html'
import { useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { resolvePerformanceProfile, getGeometryDetail } from '../../scene3d/canvasQuality'

function readSceneBackgroundColor(): string {
  if (typeof window === 'undefined') return '#222222'
  const shell = document.querySelector('.app-shell')
  if (!shell) return '#222222'
  const computed = getComputedStyle(shell)
  return computed.getPropertyValue('--scene-optical-bg').trim() || '#222222'
}

const TUBE_START_X = -4
const OPTICAL_AXIS_Y = 4.5
const BASE_3D_LENGTH = 10

type DoubleSlitRig3DProps = {
  screenDistance: number
  lightColorHex: number
  isLightOn: boolean
}

/**
 * Stand — 精确还原原始 createStand() 的层级结构。
 * rod 在 (0, height/2+0.5, 0)，base 和 knob 是 rod 的子元素。
 */
function Stand({ xPos, height = 3.5, radialSegments = 16 }: { xPos: number; height?: number; radialSegments?: number }) {
  const metalMat = { color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 }
  const blackPlasticMat = { color: 0x151515, metalness: 0.3, roughness: 0.7 }

  return (
    <group position={[xPos, 0, 0]}>
      {/* rod — base 和 knob 是它的子元素 */}
      <mesh position={[0, height / 2 + 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, height, radialSegments]} />
        <meshStandardMaterial {...metalMat} />

        {/* base — 相对于 rod 的偏移 */}
        <mesh position={[0, -height / 2 + 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.4, 2]} />
          <meshStandardMaterial {...metalMat} />
        </mesh>

        {/* knob — 相对于 rod 的偏移 */}
        <mesh
          position={[0, -height / 2 + 0.5, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.2, 0.2, 0.4, radialSegments]} />
          <meshStandardMaterial {...blackPlasticMat} />
        </mesh>
      </mesh>
    </group>
  )
}

function Label({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center>
      <div className="double-slit-label">{text}</div>
    </Html>
  )
}

export function DoubleSlitRig3D({ screenDistance, lightColorHex, isLightOn }: DoubleSlitRig3DProps) {
  const current3DLength = BASE_3D_LENGTH * screenDistance
  const tailX = TUBE_START_X + current3DLength

  const perf = resolvePerformanceProfile()
  const shadowsEnabled = perf.shadowMapSize !== null

  const metalMat = { color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 }
  const darkMetalMat = { color: 0x333333, metalness: 0.6, roughness: 0.4 }
  const blackPlasticMat = { color: 0x151515, metalness: 0.3, roughness: 0.7 }
  const whiteTubeMat = { color: 0xe0e0e0, metalness: 0.1, roughness: 0.5 }
  const glassMat = {
    color: 0x88ccff,
    transparent: true,
    opacity: 0.4,
    metalness: 0.9,
    roughness: 0.1,
  }

  const shadowProps = shadowsEnabled
    ? { castShadow: true as const, receiveShadow: true as const }
    : {}

  // Tube geometry with translate(0, 0.5, 0) — 保持与原始一致
  const geoDetail = getGeometryDetail()

  const tubeGeo = useMemo(() => {
    const geo = new CylinderGeometry(0.8, 0.8, 1, geoDetail.cylinderRadialSegments)
    geo.translate(0, 0.5, 0)
    return geo
  }, [geoDetail.cylinderRadialSegments])

  return (
    <group data-rig-scene="double-slit">
      {/* Background & fog */}
      <color attach="background" args={[readSceneBackgroundColor()]} />
      <fog attach="fog" args={[readSceneBackgroundColor(), 20, 80]} />

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

      {/* ====== Rail ====== */}
      <mesh position={[0, 0, 0]} {...shadowProps}>
        <boxGeometry args={[32, 1, 3]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>

      {/* Scale on rail — 无 rotation，面朝 Z+ */}
      <mesh position={[0, 0, 1.51]}>
        <planeGeometry args={[31, 0.8]} />
        <meshBasicMaterial color="#dddddd" />
      </mesh>

      {/* Rail feet */}
      <mesh position={[-14, -1, 0]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <boxGeometry args={[2, 2, 4]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>
      <mesh position={[14, -1, 0]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <boxGeometry args={[2, 2, 4]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>

      {/* ====== Light source at x = -13 ====== */}
      <Stand xPos={-13} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />
      <mesh position={[-13, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <cylinderGeometry args={[1.2, 1.2, 2, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...blackPlasticMat} />
      </mesh>
      <mesh position={[-12.2, OPTICAL_AXIS_Y, 0]}>
        <sphereGeometry args={[0.5, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshBasicMaterial color={isLightOn ? lightColorHex : 0x111111} />
      </mesh>
      <Label text="光源" position={[-13, OPTICAL_AXIS_Y + 2, 0]} />

      {/* ====== Lens at x = -9.5 ====== */}
      <Stand xPos={-9.5} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />
      <mesh position={[-9.5, OPTICAL_AXIS_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1, 0.15, geoDetail.torusRadialSegments, geoDetail.torusTubularSegments]} />
        <meshStandardMaterial {...blackPlasticMat} />
      </mesh>
      <mesh position={[-9.5, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.95, 0.95, 0.1, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...glassMat} />
      </mesh>
      <Label text="透镜" position={[-9.5, OPTICAL_AXIS_Y + 2, 0]} />

      {/* ====== Head group components at tubeStartX ====== */}
      <Stand xPos={TUBE_START_X - 0.75} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />

      {/* Single slit cap */}
      <mesh
        position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
        {...(shadowsEnabled ? { castShadow: true } : {})}
      >
        <cylinderGeometry args={[1, 1, 1.5, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...blackPlasticMat} />
      </mesh>
      <Label text="单缝" position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y + 2, 0]} />

      {/* Double slit */}
      <mesh
        position={[TUBE_START_X + 0.5, OPTICAL_AXIS_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[1.1, 1.1, 0.8, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...darkMetalMat} />
      </mesh>

      {/* Rod (horizontal) */}
      <mesh
        position={[TUBE_START_X + 2, OPTICAL_AXIS_Y + 1.5, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.05, 0.05, 4, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>

      {/* Rod support (vertical) */}
      <mesh position={[TUBE_START_X + 0.5, OPTICAL_AXIS_Y + 0.75, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.5, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...metalMat} />
      </mesh>

      {/* Rod knob */}
      <mesh position={[TUBE_START_X + 4, OPTICAL_AXIS_Y + 1.5, 0]}>
        <sphereGeometry args={[0.3, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
        <meshStandardMaterial {...blackPlasticMat} />
      </mesh>
      <Label text="双缝" position={[TUBE_START_X + 0.5, OPTICAL_AXIS_Y + 2.5, 0]} />

      {/* ====== Main tube (dynamic length) ====== */}
      <mesh
        position={[TUBE_START_X, OPTICAL_AXIS_Y, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        scale={[1, current3DLength, 1]}
        {...(shadowsEnabled ? { castShadow: true } : {})}
        geometry={tubeGeo}
      >
        <meshStandardMaterial {...whiteTubeMat} />
      </mesh>
      <Label
        text="遮光筒"
        position={[TUBE_START_X + current3DLength / 2, OPTICAL_AXIS_Y + 1.3, 0]}
      />

      {/* ====== Tail group components (scene-level, world coords) ====== */}
      <Stand xPos={tailX - 1} height={3.5} radialSegments={geoDetail.cylinderRadialSegments} />

      {/* Ground glass holder */}
      <mesh position={[tailX + 1, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <cylinderGeometry args={[1.2, 1.2, 2, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...blackPlasticMat} />
      </mesh>
      <Label text="毛玻璃" position={[tailX + 1, OPTICAL_AXIS_Y + 2.5, 0]} />

      {/* Wheel */}
      <mesh position={[tailX + 2, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.5, 1.5, 0.4, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...blackPlasticMat} />
      </mesh>

      {/* Eyepiece */}
      <mesh position={[tailX + 3.5, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
        <cylinderGeometry args={[0.6, 0.6, 2.5, geoDetail.cylinderRadialSegments]} />
        <meshStandardMaterial {...blackPlasticMat} />
      </mesh>
      <Label text="目镜" position={[tailX + 3.5, OPTICAL_AXIS_Y + 1.5, 0]} />
    </group>
  )
}
