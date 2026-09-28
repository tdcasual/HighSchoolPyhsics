import { Html } from '@react-three/drei/web/Html'
import type { BufferGeometry } from 'three'
import { MICROMETER_RANGE_MM } from './model'
import { createAxisDragHandlers } from './axisDrag'
import { MICROMETER_BOW, MICROMETER_INSULATOR, RATCHET_GEOMETRY, SLEEVE_SCALE_GEOMETRY, THIMBLE_BODY_GEOMETRY, THIMBLE_CAP_GEOMETRY } from './instrumentGeometry'
import type { MicrometerPose, ViewPreset } from './pose'
import { SLEEVE_TEXTURE, THIMBLE_TEXTURE, paintSleeveScale, paintThimbleScale } from './scalePaint'
import { usePaintedTexture } from './usePaintedTexture'

type MicrometerAssemblyProps = {
  pose: MicrometerPose
  gap: number
  showWork: boolean
  workSize: number
  showLabels: boolean
  viewPreset?: ViewPreset
  locked?: boolean
  onMicGapChange?: (value: number) => void
  onInstrumentDragChange?: (dragging: boolean) => void
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

export function MicrometerAssembly({
  pose,
  gap,
  showWork,
  workSize,
  showLabels,
  viewPreset = 'home',
  locked = false,
  onMicGapChange,
  onInstrumentDragChange,
}: MicrometerAssemblyProps) {
  const dragHandlers = onMicGapChange
    ? createAxisDragHandlers({
        value: gap,
        min: 0,
        max: MICROMETER_RANGE_MM,
        locked,
        onValueChange: onMicGapChange,
        onDraggingChange: onInstrumentDragChange,
        onLockedAttempt: () => onMicGapChange(gap),
      })
    : {}
  const labelPositions: Array<{ label: string; position: [number, number, number] }> = viewPreset === 'top'
    ? [
        { label: '测砧', position: [pose.anvilTipX - 12, 0, 18] },
        { label: '测微螺杆', position: [pose.spindleX - 18, 0, 31] },
        { label: '锁紧装置', position: [pose.lock[0] - 10, 0, -29] },
        { label: '固定刻度 / 基准线', position: [pose.sleeveScaleX + 46, 0, 18] },
        { label: '微分筒', position: [pose.thimbleX + 12, 0, -18] },
        { label: '棘轮', position: [pose.thimbleX + 34, 0, 31] },
        { label: '可动刻度', position: [pose.thimbleX + 4, 0, -31] },
      ]
    : viewPreset === 'focus'
      ? [
          { label: '测微螺杆', position: [pose.spindleX - 16, 12, 8] },
          { label: '固定刻度 / 基准线', position: [pose.sleeveScaleX + 45, 11, 8] },
          { label: '微分筒', position: [pose.thimbleX + 12, 11, -8] },
          { label: '可动刻度', position: [pose.thimbleX + 2, -10, 8] },
        ]
      : [
        { label: '测砧', position: [pose.anvilTipX - 12, 8, 8] },
        { label: '测微螺杆', position: [pose.spindleX - 14, 12, 8] },
        { label: '锁紧装置', position: [pose.lock[0] - 6, 17, -8] },
        { label: '固定刻度 / 基准线', position: [pose.sleeveScaleX + 52, 18, 8] },
        { label: '微分筒', position: [pose.thimbleX + 29, 18, -8] },
        { label: '棘轮', position: [pose.thimbleX + 39, 6, 8] },
        { label: '可动刻度', position: [pose.thimbleX + 4, -22, 8] },
      ]

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
      <group
        name="micrometer-thimble"
        position={[pose.thimbleX, pose.thimbleY, 0]}
        rotation={[pose.thimbleRotationX, 0, 0]}
        {...dragHandlers}
      >
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
      </group>
      {showLabels ? labelPositions.map(({ label, position }) => <PartLabel key={label} position={position}>{label}</PartLabel>) : null}
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
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[workSize / 2, workSize / 2, 24, 32]} />
            <meshStandardMaterial color="#dfbd72" metalness={0.35} roughness={0.52} />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}
