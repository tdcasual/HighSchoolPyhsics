import { useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { TERMINALS, type CircuitPose, type WireLink } from './circuitPose'

const WIRE_COLOR = { red: '#bb3f33', black: '#2c3336', orange: '#d68a2c', blue: '#2e6592' }

function endpoint(key: string, pose: CircuitPose): Vector3 | null {
  if (key === 'wP') return new Vector3(...pose.wireEnd)
  const fixed = TERMINALS[key]
  return fixed ? new Vector3(...fixed) : null
}

export function CircuitWires({ pose, wires }: { pose: CircuitPose; wires: WireLink[] }) {
  const geometry = useMemo(() => {
    return wires.flatMap(([from, to, color, lift]) => {
      const start = endpoint(from, pose)
      const end = endpoint(to, pose)
      if (!start || !end) return []
      const distance = start.distanceTo(end)
      const rise = lift ?? 2.5 + distance * 0.14
      const mid = start.clone().lerp(end, 0.5)
      mid.y = Math.max(start.y, end.y) + rise
      const curve = new CatmullRomCurve3([
        start,
        start.clone().add(new Vector3(0, 1.4, 0)),
        mid,
        end.clone().add(new Vector3(0, 1.4, 0)),
        end,
      ])
      return [{ color, geometry: new TubeGeometry(curve, 28, 0.26, 6, false) }]
    })
  }, [pose, wires])

  return (
    <group name="circuit-wires">
      {geometry.map((wire, index) => (
        <mesh key={`${wire.color}-${index}`} geometry={wire.geometry} castShadow>
          <meshStandardMaterial color={WIRE_COLOR[wire.color]} roughness={0.5} metalness={0.05} />
        </mesh>
      ))}
    </group>
  )
}

function Meter({ name, position, rotation }: { name: string; position: [number, number, number]; rotation: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 3.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, 7.2, 6.6]} />
        <meshStandardMaterial color="#f1f2ee" roughness={0.55} />
      </mesh>
      <mesh position={[0, 3.9, 3.32]}>
        <planeGeometry args={[8.4, 5.2]} />
        <meshStandardMaterial color="#fbfbf6" />
      </mesh>
      <group name={name} position={[0, 1.35, 3.4]} rotation={[0, 0, rotation]}>
        <mesh position={[0, 2.25, 0]}>
          <boxGeometry args={[0.09, 4.5, 0.08]} />
          <meshStandardMaterial color="#1d2327" />
        </mesh>
      </group>
      <mesh position={[0, 7.4, 0]}>
        <boxGeometry args={[9, 0.4, 1.2]} />
        <meshStandardMaterial color="#29363b" />
      </mesh>
    </group>
  )
}

export function CircuitAssembly({ pose, wires }: { pose: CircuitPose; wires: WireLink[] }) {
  return (
    <>
      <color attach="background" args={['#e7eef0']} />
      <hemisphereLight args={['#ffffff', '#8b9a98', 0.85]} />
      <directionalLight position={[-40, 120, 70]} intensity={2.2} color="#fff6e8" castShadow />
      <directionalLight position={[48, 70, -60]} intensity={0.7} color="#e6f1ff" />
    <group name="circuit-root">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 70]} />
        <meshStandardMaterial color="#e4dccb" roughness={0.85} />
      </mesh>
      <group position={[-31, 0, -14]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[15, 2.2, 7.4]} />
          <meshStandardMaterial color="#2f4a48" />
        </mesh>
        <mesh position={[-3.6, 3.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[1.55, 1.55, 6, 20]} />
          <meshStandardMaterial color="#d6873e" />
        </mesh>
        <mesh position={[3.6, 3.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[1.55, 1.55, 6, 20]} />
          <meshStandardMaterial color="#d6873e" />
        </mesh>
      </group>
      <group position={[-17, 0, -12.5]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[9, 0.8, 4.6]} />
          <meshStandardMaterial color="#e6e0d2" />
        </mesh>
        <group name="circuit-blade" position={[-3, 2.7, 0]} rotation={[0, 0, pose.bladeRotation]}>
          <mesh position={[3.15, 0, 0]} castShadow>
            <boxGeometry args={[6.3, 0.35, 0.7]} />
            <meshStandardMaterial color="#c8a15a" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      </group>
      <group>
        <mesh position={[2, 4.4, -14]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[2.3, 2.3, 26, 28]} />
          <meshStandardMaterial color="#c8a15a" metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[2, 8.4, -14]} castShadow>
          <boxGeometry args={[27.6, 0.7, 0.7]} />
          <meshStandardMaterial color="#d3dadd" metalness={0.8} roughness={0.3} />
        </mesh>
        <group name="circuit-slider" position={[pose.sliderX, 0, 0]}>
          <mesh position={[0, 8.4, -14]} castShadow>
            <boxGeometry args={[2.2, 1.6, 1.8]} />
            <meshStandardMaterial color="#3a5b6c" />
          </mesh>
        </group>
      </group>
      {Meter({ name: 'ammeter-needle', position: [25, 0, -12.5], rotation: pose.ammeterRotation })}
      {Meter({ name: 'voltmeter-needle', position: [8, 0, -1.5], rotation: pose.voltmeterRotation })}
      <mesh position={[0, 0.7, 9.4]} receiveShadow>
        <boxGeometry args={[66, 1.4, 9.2]} />
        <meshStandardMaterial color="#e2d2b0" roughness={0.7} />
      </mesh>
      <mesh name="metal-wire" position={[0, 3.25, 11.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 50, 8]} />
        <meshStandardMaterial color="#b9c0c2" metalness={0.9} roughness={0.3} emissive="#e07020" emissiveIntensity={pose.hot} />
      </mesh>
      <group name="circuit-clip" position={[pose.clipX, 0, 0]}>
        <mesh position={[0, 3.6, 11.2]} castShadow>
          <boxGeometry args={[1.3, 1.1, 1.8]} />
          <meshStandardMaterial color="#c3483a" />
        </mesh>
      </group>
      <CircuitWires pose={pose} wires={wires} />
    </group>
    </>
  )
}
