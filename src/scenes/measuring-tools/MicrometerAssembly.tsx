import { Html } from '@react-three/drei/web/Html'
import type { BufferGeometry } from 'three'
import { MICROMETER_BOW, MICROMETER_INSULATOR, RATCHET_GEOMETRY, SLEEVE_SCALE_GEOMETRY, THIMBLE_BODY_GEOMETRY, THIMBLE_CAP_GEOMETRY } from './instrumentGeometry'
import type { MicrometerPose } from './pose'
import { SLEEVE_TEXTURE, THIMBLE_TEXTURE, paintSleeveScale, paintThimbleScale } from './scalePaint'
import { usePaintedTexture } from './usePaintedTexture'

type MicrometerAssemblyProps = {
  pose: MicrometerPose
  showWork: boolean
  workSize: number
  showLabels: boolean
}

function Metal({ color, metalness = 0.85, roughness = 0.27 }: { color: string; metalness?: number; roughness?: number }) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
}

function CylX({
  name,
  radius,
  length,
  centerX,
  color,
  metalness = 0.8,
  roughness = 0.32,
}: {
  name?: string
  radius: number
  length: number
  centerX: number
  color: string
  metalness?: number
  roughness?: number
}) {
  return (
    <mesh name={name} position={[centerX, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 40]} />
      <Metal color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

function TexturedRevolve({
  geometry,
  width,
  height,
  paint,
  wrapT,
  color,
  metalness,
  roughness,
}: {
  geometry: BufferGeometry
  width: number
  height: number
  paint: typeof paintSleeveScale
  wrapT?: boolean
  color: string
  metalness: number
  roughness: number
}) {
  const texture = usePaintedTexture(width, height, paint, wrapT)
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial map={texture} color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

function PartLabel({ position, children }: { position: [number, number, number]; children: string }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
      <span className="measure-3d-label">{children}</span>
    </Html>
  )
}

export function MicrometerAssembly({ pose, showWork, workSize, showLabels }: MicrometerAssemblyProps) {
  return (
    <group name="micrometer-root">
      <mesh geometry={MICROMETER_BOW} castShadow receiveShadow>
        <meshStandardMaterial color="#415865" metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh geometry={MICROMETER_INSULATOR} castShadow receiveShadow>
        <meshStandardMaterial color="#b8543e" metalness={0} roughness={0.7} />
      </mesh>
      {CylX({ radius: 6.2, length: 14, centerX: pose.bossLX, color: '#415865', metalness: 0.25, roughness: 0.5 })}
      {CylX({ radius: 6.4, length: 12, centerX: 32, color: '#415865', metalness: 0.25, roughness: 0.5 })}
      {CylX({ name: 'micrometer-anvil', radius: 3.2, length: 9, centerX: pose.anvilX, color: '#d3dadd' })}
      {CylX({ radius: 3.22, length: 0.8, centerX: pose.anvilTipX, color: '#5c666b', metalness: 0.7, roughness: 0.35 })}
      {CylX({ name: 'micrometer-sleeve', radius: 4.6, length: 39, centerX: pose.sleeveX, color: '#cfd6d8', metalness: 0.78, roughness: 0.3 })}
      <group name="micrometer-sleeve-scale" position={[pose.sleeveScaleX, 0, 0]}>
        <TexturedRevolve
          geometry={SLEEVE_SCALE_GEOMETRY}
          width={SLEEVE_TEXTURE.width}
          height={SLEEVE_TEXTURE.height}
          paint={paintSleeveScale}
          color="#ffffff"
          metalness={0.1}
          roughness={0.6}
        />
      </group>
      {CylX({ name: 'micrometer-spindle', radius: 3.2, length: 44, centerX: pose.spindleX, color: '#d3dadd' })}
      {CylX({ radius: 3.22, length: 0.8, centerX: pose.spindleTipX, color: '#5c666b', metalness: 0.7, roughness: 0.35 })}
      <group name="micrometer-thimble" position={[pose.thimbleX, pose.thimbleY, 0]} rotation={[pose.thimbleRotationX, 0, 0]}>
        <TexturedRevolve
          geometry={THIMBLE_BODY_GEOMETRY}
          width={THIMBLE_TEXTURE.width}
          height={THIMBLE_TEXTURE.height}
          paint={paintThimbleScale}
          wrapT
          color="#ffffff"
          metalness={0.62}
          roughness={0.34}
        />
        <mesh geometry={THIMBLE_CAP_GEOMETRY} castShadow receiveShadow>
          <meshStandardMaterial color="#c3ccd0" metalness={0.7} roughness={0.38} />
        </mesh>
        <mesh position={[27.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[3, 3, 1.5, 24]} />
          <meshStandardMaterial color="#8e999e" metalness={0.8} roughness={0.34} />
        </mesh>
        <mesh geometry={RATCHET_GEOMETRY} castShadow receiveShadow>
          <meshStandardMaterial color="#b9c3c7" metalness={0.7} roughness={0.38} />
        </mesh>
        {showLabels ? <PartLabel position={[8, -9, 2]}>可动刻度</PartLabel> : null}
      </group>
      <group name="micrometer-lock" position={pose.lock}>
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.8, 1.8, 3.2, 20]} />
          <meshStandardMaterial color="#8e999e" metalness={0.8} roughness={0.34} />
        </mesh>
        <mesh position={[0, 3.6, 3.2]} rotation={[0, pose.leverRotationY, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 1.2, 9]} />
          <meshStandardMaterial color="#2f3c43" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
      {showWork ? (
        <group name="micrometer-work" position={[workSize / 2, 0, pose.objectZ]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[workSize / 2, workSize / 2, 24, 32]} />
            <meshStandardMaterial color="#c8a15a" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ) : null}
      {showLabels ? <PartLabel position={[-8, 6, 0]}>测砧</PartLabel> : null}
    </group>
  )
}
