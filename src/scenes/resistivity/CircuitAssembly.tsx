import { useEffect, useMemo } from 'react'
import { Html } from '@react-three/drei/web/Html'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { meterIntervals, terminalPosition, type CircuitPose, type WireLink } from './circuitPose'
import type { ElementKind } from './model'

const WIRE_COLOR = { red: '#bb3f33', black: '#2c3336', orange: '#d68a2c', blue: '#2e6592' }

function endpoint(key: string, pose: CircuitPose): Vector3 | null {
  const position = terminalPosition(key, pose)
  return position ? new Vector3(...position) : null
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

  useEffect(() => () => geometry.forEach((wire) => wire.geometry.dispose()), [geometry])

  return (
    <group name="circuit-wires">
      {geometry.map((wire, index) => (
        <mesh key={wire.color + '-' + index} geometry={wire.geometry} castShadow>
          <meshStandardMaterial color={WIRE_COLOR[wire.color]} roughness={0.5} metalness={0.05} />
        </mesh>
      ))}
    </group>
  )
}

function TerminalPost({
  name,
  position,
  height = 1,
  color = '#b74738',
}: {
  name: string
  position: [number, number, number]
  height?: number
  color?: string
}) {
  return (
    <group name={name} position={position}>
      <mesh position={[0, -height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, height, 12]} />
        <meshStandardMaterial color='#9da6a3' metalness={0.78} roughness={0.28} />
      </mesh>
      <mesh position={[0, -height + 0.12, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.2, 14]} />
        <meshStandardMaterial color='#243239' roughness={0.45} />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[0.25, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
    </group>
  )
}

function RheostatCoil() {
  const geometry = useMemo(() => {
    const turns = 32
    const segments = turns * 20
    const points = Array.from({ length: segments + 1 }, (_, index) => {
      const t = index / segments
      const angle = t * turns * Math.PI * 2
      return new Vector3(-11 + t * 26, 4.4 + Math.sin(angle) * 2.08, -14 + Math.cos(angle) * 2.08)
    })
    return new TubeGeometry(new CatmullRomCurve3(points), segments, 0.105, 6, false)
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh name='rheostat-coil' geometry={geometry} castShadow>
      <meshStandardMaterial color='#b99355' metalness={0.72} roughness={0.34} />
    </mesh>
  )
}

function Meter({
  name,
  position,
  rotation,
  unit,
  range,
  division,
  centered = false,
}: {
  name: string
  position: [number, number, number]
  rotation: number
  unit: 'A' | 'V'
  range: number
  division: number
  centered?: boolean
}) {
  const intervals = meterIntervals(range, division, centered)
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
      {Array.from({ length: intervals + 1 }, (_, index) => {
        const fraction = index / intervals
        const angle = (0.5 - fraction) * Math.PI / 2
        const x = Math.sin(angle) * 3.75
        const y = 1.35 + Math.cos(angle) * 3.75
        const value = centered ? (fraction * 2 - 1) * range : fraction * range
        const label = range < 1 ? Number(value.toFixed(1)).toFixed(1) : Math.round(value).toString()
        const major = index % 5 === 0
        const labeled = index % 10 === 0 || index === intervals
        return (
          <group key={index}>
            <mesh position={[x, y, 3.39]} rotation={[0, 0, -angle]}>
              <boxGeometry args={[0.07, major ? 0.42 : 0.19, 0.06]} />
              <meshBasicMaterial color="#223238" />
            </mesh>
            {labeled ? (
              <Html position={[x * 0.73, 1.35 + Math.cos(angle) * 2.75, 3.44]} center distanceFactor={90}>
                <span style={{ color: '#293b40', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
              </Html>
            ) : null}
          </group>
        )
      })}
      <Html position={[0, 5.15, 3.48]} center distanceFactor={90}>
        <span style={{ color: '#18343a', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', background: 'rgba(255,255,255,.75)', padding: '1px 4px', borderRadius: '4px' }}>
          {unit} · {centered ? '±' : '0–'}{range} {unit}
        </span>
      </Html>
      <group name={name} position={[0, 1.35, 3.48]} rotation={[0, 0, rotation]}>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.09, 3.6, 0.08]} />
          <meshStandardMaterial color="#1d2327" />
        </mesh>
      </group>
      <mesh position={[0, 7.4, 0]}>
        <boxGeometry args={[9, 0.4, 1.2]} />
        <meshStandardMaterial color="#29363b" />
      </mesh>
      {unit === 'A' ? (
        <>
          <TerminalPost name='terminal-ammeter-common' position={[-3.2, 8.45, 1.4]} height={1.25} color='#242a2d' />
          <TerminalPost name='terminal-ammeter-06' position={[0, 8.45, 1.4]} height={1.25} color='#b74738' />
          <TerminalPost name='terminal-ammeter-3' position={[3.2, 8.45, 1.4]} height={1.25} color='#b74738' />
        </>
      ) : (
        <>
          <TerminalPost name='terminal-voltmeter-common' position={[-3.2, 8.45, 1.4]} height={1.25} color='#242a2d' />
          <TerminalPost name='terminal-voltmeter-3' position={[0, 8.45, 1.4]} height={1.25} color='#b74738' />
          <TerminalPost name='terminal-voltmeter-15' position={[3.2, 8.45, 1.4]} height={1.25} color='#b74738' />
        </>
      )}
    </group>
  )
}

function ElementModel({ kind, power, start, end }: { kind: ElementKind; power: number; start: number; end: number }) {
  const center = (start + end) / 2
  const span = Math.max(5, end - start)
  const leadSpan = Math.max(0.4, (span - 4) / 2)
  if (kind === 'lamp') {
    const glow = Math.min(2.2, Math.max(0.08, power / 0.34))
    return (
      <group name="iv-lamp" position={[center, 3.25, 11.2]}>
        <mesh castShadow>
          <sphereGeometry args={[1.8, 24, 18]} />
          <meshStandardMaterial color="#fff0bb" emissive="#ffad32" emissiveIntensity={glow} roughness={0.28} />
        </mesh>
        <mesh position={[0, -1.25, 0]}>
          <cylinderGeometry args={[0.68, 0.82, 0.85, 16]} />
          <meshStandardMaterial color="#69777a" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[-(span / 2 - 1.8) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, Math.max(0.4, span / 2 - 1.8), 8]} />
          <meshStandardMaterial color="#bb3f33" metalness={0.55} />
        </mesh>
        <mesh position={[(span / 2 - 1.8) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, Math.max(0.4, span / 2 - 1.8), 8]} />
          <meshStandardMaterial color="#bb3f33" metalness={0.55} />
        </mesh>
      </group>
    )
  }
  if (kind === 'diode') {
    return (
      <group name="iv-diode" position={[center, 3.25, 11.2]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.82, 0.82, 3.6, 18]} />
          <meshStandardMaterial color="#293b40" roughness={0.32} />
        </mesh>
        <mesh position={[1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.85, 0.85, 0.36, 18]} />
          <meshStandardMaterial color="#e6e2d6" metalness={0.3} roughness={0.42} />
        </mesh>
        <mesh position={[-(span / 2 - 1.8) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, Math.max(0.4, span / 2 - 1.8), 8]} />
          <meshStandardMaterial color="#bb3f33" metalness={0.55} />
        </mesh>
        <mesh position={[(span / 2 - 1.8) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, Math.max(0.4, span / 2 - 1.8), 8]} />
          <meshStandardMaterial color="#2c3336" metalness={0.55} />
        </mesh>
      </group>
    )
  }
  return (
    <group name="iv-resistor" position={[center, 3.25, 11.2]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.82, 0.82, Math.max(2, span - 3), 16]} />
        <meshStandardMaterial color="#c8864a" roughness={0.48} metalness={0.2} />
      </mesh>
      <mesh position={[-span / 2 + leadSpan / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, leadSpan, 8]} />
        <meshStandardMaterial color="#bb3f33" metalness={0.55} />
      </mesh>
      <mesh position={[span / 2 - leadSpan / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, leadSpan, 8]} />
        <meshStandardMaterial color="#bb3f33" metalness={0.55} />
      </mesh>
    </group>
  )
}

function SceneLabel({ children, position }: { children: string; position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={90}>
      <span style={{ color: '#23393e', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', textShadow: '0 1px 3px white' }}>{children}</span>
    </Html>
  )
}

export function CircuitAssembly({
  pose,
  wires,
  elementKind = 'resistor',
  elementPower = 0,
  elementVoltage = 0,
  ivMode = false,
  ammeterRange = 0.6,
  voltmeterRange = 3,
  ammeterDivision = 0.02,
  voltmeterDivision = 0.1,
}: {
  pose: CircuitPose
  wires: WireLink[]
  elementKind?: ElementKind
  elementPower?: number
  elementVoltage?: number
  ivMode?: boolean
  ammeterRange?: number
  voltmeterRange?: number
  ammeterDivision?: number
  voltmeterDivision?: number
}) {
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
          <TerminalPost name='terminal-battery-positive' position={[-4, 3.1, 4.1]} height={0.9} color='#b74738' />
          <TerminalPost name='terminal-battery-negative' position={[4, 3.1, 4.1]} height={0.9} color='#242a2d' />
          {ivMode ? (
            <>
              <mesh position={[0, 2.3, 0]}>
                <boxGeometry args={[8.6, 0.18, 1.5]} />
                <meshStandardMaterial color='#18292c' roughness={0.32} />
              </mesh>
              <Html position={[0, 2.43, 0]} center distanceFactor={90}>
                <span style={{ color: '#baf3ce', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  U = {elementVoltage < 0 ? '−' : '+'}{Math.abs(elementVoltage).toFixed(2)} V
                </span>
              </Html>
            </>
          ) : (
            <>
              <mesh position={[-3.6, 3.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[1.55, 1.55, 6, 20]} />
                <meshStandardMaterial color="#d6873e" />
              </mesh>
              <mesh position={[3.6, 3.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[1.55, 1.55, 6, 20]} />
                <meshStandardMaterial color="#d6873e" />
              </mesh>
            </>
          )}
        </group>
        <group position={[-17, 0, -12.5]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[9, 0.8, 4.6]} />
            <meshStandardMaterial color="#e6e0d2" />
          </mesh>
          <TerminalPost name='terminal-switch-input' position={[-4, 2.48, 1.3]} height={1.68} color='#b74738' />
          <TerminalPost name='terminal-switch-output' position={[4, 2.48, 1.3]} height={1.68} color='#b74738' />
          <group name="circuit-blade" position={[-4, 2.7, 0]} rotation={[0, 0, pose.bladeRotation]}>
            <mesh position={[4, 0, 0]} castShadow>
              <boxGeometry args={[8, 0.35, 0.7]} />
              <meshStandardMaterial color="#c8a15a" metalness={0.7} roughness={0.35} />
            </mesh>
          </group>
        </group>
        {!ivMode ? (
        <group>
          <mesh position={[2, 4.4, -14]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[1.88, 1.88, 26, 28]} />
            <meshStandardMaterial color="#d9c6a0" metalness={0.2} roughness={0.55} />
          </mesh>
          <RheostatCoil />
          <TerminalPost name='terminal-rheostat-a' position={[-13.2, 2.2, -11.2]} height={2.2} color='#d1ad65' />
          <TerminalPost name='terminal-rheostat-b' position={[17.2, 2.2, -11.2]} height={2.2} color='#d1ad65' />
          <mesh position={[2, 8.4, -14]} castShadow>
            <boxGeometry args={[27.6, 0.7, 0.7]} />
            <meshStandardMaterial color="#d3dadd" metalness={0.8} roughness={0.3} />
          </mesh>
          <group name="circuit-slider" position={[pose.sliderX, 0, 0]}>
            <mesh position={[0, 8.4, -14]} castShadow>
              <boxGeometry args={[2.2, 1.6, 1.8]} />
              <meshStandardMaterial color="#3a5b6c" />
            </mesh>
            <mesh position={[0, 7.05, -14]} castShadow>
              <boxGeometry args={[0.34, 1.15, 0.34]} />
              <meshStandardMaterial color="#c8a15a" metalness={0.72} roughness={0.3} />
            </mesh>
            <mesh position={[0, 6.48, -14]} castShadow>
              <boxGeometry args={[1.4, 0.16, 0.56]} />
              <meshStandardMaterial color="#d3ad62" metalness={0.75} roughness={0.28} />
            </mesh>
            <TerminalPost name='terminal-rheostat-wiper' position={[0, 9.9, -14]} height={0.8} color='#b74738' />
          </group>
        </group>
        ) : null}
        {Meter({ name: 'ammeter-needle', position: [25, 0, -12.5], rotation: pose.ammeterRotation, unit: 'A', range: ammeterRange, division: ammeterDivision, centered: ivMode })}
        {Meter({ name: 'voltmeter-needle', position: [8, 0, -1.5], rotation: pose.voltmeterRotation, unit: 'V', range: voltmeterRange, division: voltmeterDivision, centered: ivMode })}
        <SceneLabel position={ivMode ? [-29, 8, -14] : [-31, 8, -14]}>{ivMode ? '可调电源' : '电源'}</SceneLabel>
        <SceneLabel position={[-5, 4.3, -12.5]}>开关</SceneLabel>
        {!ivMode ? <SceneLabel position={[2, 11.5, -14]}>滑动变阻器</SceneLabel> : null}
        <mesh position={[0, 0.7, 9.4]} receiveShadow>
          <boxGeometry args={[66, 1.4, 9.2]} />
          <meshStandardMaterial color="#e2d2b0" roughness={0.7} />
        </mesh>
        {ivMode ? (
          <ElementModel kind={elementKind} power={elementPower} start={-25} end={pose.clipX} />
        ) : (
          <mesh name="metal-wire" position={[0, 3.25, 11.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 50, 8]} />
            <meshStandardMaterial color="#b9c0c2" metalness={0.9} roughness={0.3} emissive="#e07020" emissiveIntensity={pose.hot} />
          </mesh>
        )}
        <SceneLabel position={[0, 6, 11.2]}>{ivMode ? elementKind === 'lamp' ? '小灯泡' : elementKind === 'diode' ? '硅二极管' : '定值电阻' : '待测金属丝'}</SceneLabel>
        <group name='circuit-fixed-clip' position={[-25, 0, 0]}>
          <mesh position={[0, 3.6, 11.2]} castShadow>
            <boxGeometry args={[1.3, 1.1, 1.8]} />
            <meshStandardMaterial color='#59666a' />
          </mesh>
          <TerminalPost name='terminal-sample-fixed' position={[0, 4.85, 11.2]} height={0.7} color='#b74738' />
        </group>
        <group name="circuit-clip" position={[pose.clipX, 0, 0]}>
          <mesh position={[0, 3.6, 11.2]} castShadow>
            <boxGeometry args={[1.3, 1.1, 1.8]} />
            <meshStandardMaterial color="#c3483a" />
          </mesh>
          <TerminalPost name='terminal-sample-moving' position={[0, 4.85, 11.2]} height={0.7} color='#242a2d' />
        </group>
        <group name='length-ruler'>
          {Array.from({ length: 51 }, (_, centimetre) => {
            const major = centimetre % 10 === 0
            const middle = centimetre % 5 === 0
            return (
              <mesh key={centimetre} position={[-25 + centimetre, 1.47, 12.72]} castShadow={false}>
                <boxGeometry args={[0.055, 0.055, major ? 1 : middle ? 0.68 : 0.34]} />
                <meshBasicMaterial color='#665e52' />
              </mesh>
            )
          })}
          {[0, 10, 20, 30, 40, 50].map((centimetre) => (
            <Html key={centimetre} position={[-25 + centimetre, 1.58, 13.48]} center distanceFactor={90}>
              <span style={{ color: '#554f46', fontSize: '9px', fontWeight: 700, whiteSpace: 'nowrap' }}>{centimetre}</span>
            </Html>
          ))}
          <Html position={[2, 1.58, 13.8]} center distanceFactor={90}>
            <span style={{ color: '#554f46', fontSize: '9px', fontWeight: 700, whiteSpace: 'nowrap' }}>cm</span>
          </Html>
        </group>
        <CircuitWires pose={pose} wires={wires} />
      </group>
    </>
  )
}
