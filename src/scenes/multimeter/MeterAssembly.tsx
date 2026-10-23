import { useMemo } from 'react'
import { Line } from '../../scene3d/ClassroomLine'
import { CanvasTexture, CatmullRomCurve3, Euler, SRGBColorSpace, Vector3 } from 'three'
import { ohmFraction } from './model'
import { NEEDLE_LENGTH, NEEDLE_PIVOT_Y, NEEDLE_SPAN, type MeterPose } from './pose'
import type { MeterStage } from './state'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { SceneLabel } from '../../scene3d/SceneLabel'

type Point3 = [number, number, number]

function paintDial(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = '#fbfbf5'
  context.fillRect(0, 0, width, height)
  const cx = width / 2
  const cy = height * 1.18
  const radius = height * 0.76
  const angle = (fraction: number) => -Math.PI / 2 + (fraction - 0.5) * 2 * NEEDLE_SPAN
  context.strokeStyle = '#1b2427'
  context.lineWidth = 3
  context.beginPath()
  context.arc(cx, cy, radius, angle(0), angle(1))
  context.stroke()
  for (let mark = 0; mark <= 50; mark += 1) {
    const theta = angle(mark / 50)
    const inner = radius - (mark % 5 === 0 ? 18 : 9)
    context.strokeStyle = mark % 5 === 0 ? '#27343a' : '#68777a'
    context.lineWidth = mark % 5 === 0 ? 2 : 1
    context.beginPath()
    context.moveTo(cx + Math.cos(theta) * radius, cy + Math.sin(theta) * radius)
    context.lineTo(cx + Math.cos(theta) * inner, cy + Math.sin(theta) * inner)
    context.stroke()
  }
  const numericScales = [
    { max: 10, color: '#245b8f', radius: radius + 18 },
    { max: 50, color: '#a14137', radius: radius + 43 },
    { max: 250, color: '#454d50', radius: radius + 68 },
  ]
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  for (const scale of numericScales) {
    context.fillStyle = scale.color
    context.font = '600 21px Arial'
    for (let index = 0; index <= 5; index += 1) {
      const theta = angle(index / 5)
      context.fillText(
        String((scale.max * index) / 5),
        cx + Math.cos(theta) * scale.radius,
        cy + Math.sin(theta) * scale.radius,
      )
    }
  }
  context.fillStyle = '#245b8f'
  context.font = '600 19px Arial'
  context.fillText('V / A', cx, cy - radius * 0.5)
  context.fillStyle = '#2f7a4f'
  context.font = '600 18px Arial'
  for (const resistance of [0, 15, 50, 200, 1000]) {
    const fraction = resistance === 0 ? 1 : ohmFraction(resistance, 1)
    const theta = angle(fraction)
    context.fillText(
      resistance >= 1000 ? '1k' : String(resistance),
      cx + Math.cos(theta) * (radius + 94),
      cy + Math.sin(theta) * (radius + 94),
    )
  }
  const infinity = angle(0)
  context.fillText('∞', cx + Math.cos(infinity) * (radius + 94), cy + Math.sin(infinity) * (radius + 94))
  context.fillText('Ω', cx, cy - radius * 0.28)
}

function DialFace() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 620
    const context = canvas.getContext('2d')
    if (context) paintDial(context, canvas.width, canvas.height)
    const next = new CanvasTexture(canvas)
    next.colorSpace = SRGBColorSpace
    next.needsUpdate = true
    return next
  }, [])
  return (
    <mesh position={[0, 12.2, 2]}>
      <planeGeometry args={[9.2, 5.57]} />
      <meshStandardMaterial map={texture} roughness={0.45} />
    </mesh>
  )
}

function meterWorld(x: number, y: number, z: number) {
  const point = new Vector3(x, y, z)
  point.applyAxisAngle(new Vector3(1, 0, 0), -0.34)
  return point.add(new Vector3(0, 0.2, -4))
}

function ProbeCable({ tip, color, side, jack }: { tip: Point3; color: string; side: number; jack: Point3 }) {
  const curve = useMemo(() => {
    const tipAt = new Vector3(...tip)
    const tail = new Vector3(0, 6.2, 0).applyEuler(new Euler(0.95, 0, side < 0 ? 0.28 : -0.28)).add(tipAt)
    const jackAt = meterWorld(...jack)
    return new CatmullRomCurve3([
      jackAt,
      jackAt.clone().add(new Vector3(0, -0.6, 1.5)),
      new Vector3(jackAt.x + side * 6, 1.4, jackAt.z + 5),
      new Vector3(tail.x + side * 7, 2.2, tail.z + 5),
      tail.clone().add(new Vector3(side * 2, 1, 3)),
      tail,
    ])
  }, [tip, side, jack])
  return (
    <mesh>
      <tubeGeometry args={[curve, 48, 0.16, 6, false]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}

function Pen({ name, position, color }: { name: string; position: Point3; color: string }) {
  return (
    <group name={name} position={position} rotation={[0.95, 0, color === '#b8423a' ? -0.28 : 0.28]}>
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 4.5, 12]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
        <meshStandardMaterial color="#d3dadd" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

function TerminalPost({ position, color = '#c18b43' }: { position: Point3; color?: string }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.25, 0.32, 0.24, 12]} />
        <meshStandardMaterial color="#9c7445" metalness={0.56} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.17, 12, 8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  )
}

function BoardWire({ points, color, lineWidth = 3 }: { points: Point3[]; color: string; lineWidth?: number }) {
  return <Line points={points} color={color} lineWidth={lineWidth} />
}

function AxialCell({ position }: { position: Point3 }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.1, 1.1, 6, 20]} />
        <meshStandardMaterial color="#d6873e" roughness={0.45} metalness={0.12} />
      </mesh>
      <mesh position={[3.15, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.34, 12]} />
        <meshStandardMaterial color="#cbd0ce" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[-3.15, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.34, 12]} />
        <meshStandardMaterial color="#cbd0ce" metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  )
}

function AxialResistor({
  position,
  length = 3.2,
  color = '#d8c39a',
}: {
  position: Point3
  length?: number
  color?: string
}) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, length, 16]} />
        <meshStandardMaterial color={color} roughness={0.46} />
      </mesh>
      <mesh position={[-length / 2 - 0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 1.3, 8]} />
        <meshStandardMaterial color="#c5c9c5" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[length / 2 + 0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 1.3, 8]} />
        <meshStandardMaterial color="#c5c9c5" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  )
}

function Diode({ position }: { position: Point3 }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.48, 0.48, 2.4, 16]} />
        <meshStandardMaterial color="#22272a" roughness={0.34} />
      </mesh>
      <mesh position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.49, 0.49, 0.18, 16]} />
        <meshStandardMaterial color="#d5d7d3" metalness={0.65} roughness={0.3} />
      </mesh>
      <BoardWire
        points={[
          [-2.4, 0, 0],
          [-1.2, 0, 0],
        ]}
        color="#c5c9c5"
        lineWidth={2.4}
      />
      <BoardWire
        points={[
          [1.2, 0, 0],
          [2.4, 0, 0],
        ]}
        color="#c5c9c5"
        lineWidth={2.4}
      />
    </group>
  )
}

function MiniAmmeter({ position, fraction }: { position: Point3; fraction: number }) {
  const angle = -(Math.max(0, Math.min(1, fraction)) - 0.5) * Math.PI * 0.72
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[4.6, 3.7, 1.1]} />
        <meshStandardMaterial color="#59646a" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.22, 0.59]}>
        <circleGeometry args={[1.45, 32]} />
        <meshStandardMaterial color="#f7f7ef" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.22, 0.62]} rotation={[0, 0, angle]}>
        <boxGeometry args={[0.07, 1.12, 0.04]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
      <SceneLabel position={[0, -1.2, 0.65]} variant="text" color="#25333a" weight={800} distanceFactor={26}>
        A
      </SceneLabel>
    </group>
  )
}

function Rheostat({ position, slider }: { position: Point3; slider: number }) {
  const x = -7 + 14 * Math.max(0, Math.min(1, slider))
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.56, 0.56, 15.5, 16]} />
        <meshStandardMaterial color="#454c4d" roughness={0.65} />
      </mesh>
      {Array.from({ length: 15 }, (_, index) => (
        <mesh key={index} position={[-7 + index, 0.53, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.54, 0.055, 8, 16]} />
          <meshStandardMaterial color="#bd8051" metalness={0.62} roughness={0.38} />
        </mesh>
      ))}
      <mesh position={[0, -0.78, 0]}>
        <boxGeometry args={[17, 0.28, 2.3]} />
        <meshStandardMaterial color="#c5bdad" roughness={0.7} />
      </mesh>
      <group name="rheostat-slider" position={[x, 1.05, 0]}>
        <mesh>
          <boxGeometry args={[0.72, 1.05, 1.15]} />
          <meshStandardMaterial color="#d5d9d4" metalness={0.45} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
      </group>
    </group>
  )
}

function UseCircuit({ target }: { target: MeterPose['target'] }) {
  if (target === 'cell') {
    return (
      <>
        <AxialCell position={[-10, 2.8, 9]} />
        <TerminalPost position={[-5.6, 2.7, 9]} color="#b8423a" />
        <TerminalPost position={[-14.4, 2.7, 9]} color="#1d2327" />
      </>
    )
  }
  if (target === 'loopI') {
    return (
      <>
        <AxialCell position={[-10, 2.8, 15.2]} />
        <AxialResistor position={[10, 2.9, 15.2]} length={3.2} />
        <TerminalPost position={[-2.2, 2.7, 15.2]} color="#b8423a" />
        <TerminalPost position={[7.8, 2.7, 15.2]} color="#1d2327" />
        <BoardWire
          points={[
            [-5.6, 2.8, 15.2],
            [-2.2, 2.8, 15.2],
          ]}
          color="#b8423a"
        />
        <BoardWire
          points={[
            [7.8, 2.8, 15.2],
            [8.4, 2.8, 15.2],
          ]}
          color="#b8423a"
        />
        <BoardWire
          points={[
            [11.6, 2.8, 15.2],
            [11.6, 2.8, 19],
            [-14.4, 2.8, 19],
            [-14.4, 2.8, 15.2],
          ]}
          color="#1d2327"
        />
      </>
    )
  }
  if (target === 'resistor') {
    return (
      <>
        <AxialResistor position={[0, 2.9, 9]} length={3.2} />
        <TerminalPost position={[-2.6, 2.7, 9]} color="#b8423a" />
        <TerminalPost position={[2.6, 2.7, 9]} color="#1d2327" />
      </>
    )
  }
  if (target === 'diode') {
    return (
      <>
        <Diode position={[9, 2.9, 9]} />
        <TerminalPost position={[6.6, 2.7, 9]} color="#b8423a" />
        <TerminalPost position={[11.4, 2.7, 9]} color="#1d2327" />
      </>
    )
  }
  if (target === 'short') {
    return (
      <>
        <mesh position={[0, 3.2, 4.4]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.6, 12]} />
          <meshStandardMaterial color="#d1d7d5" metalness={0.85} roughness={0.24} />
        </mesh>
        <TerminalPost position={[-0.3, 3.2, 4.4]} color="#b8423a" />
        <TerminalPost position={[0.3, 3.2, 4.4]} color="#1d2327" />
      </>
    )
  }
  return null
}

function VaCircuit({ fraction }: { fraction: number }) {
  return (
    <>
      <AxialCell position={[-10, 2.8, 15.2]} />
      <MiniAmmeter position={[0, 2.8, 15.2]} fraction={fraction} />
      <AxialResistor position={[9, 2.9, 15.2]} length={2.4} />
      <TerminalPost position={[7.4, 2.7, 15.2]} color="#b8423a" />
      <TerminalPost position={[10.6, 2.7, 15.2]} color="#1d2327" />
      <TerminalPost position={[-2.2, 2.7, 15.2]} color="#b8423a" />
      <BoardWire
        points={[
          [-5.6, 2.8, 15.2],
          [-2.2, 2.8, 15.2],
        ]}
        color="#b8423a"
      />
      <BoardWire
        points={[
          [2.2, 2.8, 15.2],
          [7.4, 2.8, 15.2],
        ]}
        color="#b8423a"
      />
      <BoardWire
        points={[
          [10.6, 2.8, 15.2],
          [10.6, 2.8, 19],
          [-14.4, 2.8, 19],
          [-14.4, 2.8, 15.2],
        ]}
        color="#1d2327"
      />
    </>
  )
}

function RheostatCircuit({
  slider,
  mode,
  closed,
  currentFraction,
}: {
  slider: number
  mode: 'limit' | 'divider'
  closed: boolean
  currentFraction: number
}) {
  const sliderX = -7 + 14 * Math.max(0, Math.min(1, slider))
  const pointA = [-8, 2.7, 15.2] as Point3
  const pointB = [8, 2.7, 15.2] as Point3
  const loadRed = [7.4, 2.7, 15.2] as Point3
  const loadBlack = [10.6, 2.7, 15.2] as Point3
  const ammeterLeft = [1.8, 2.8, 11.7] as Point3
  const ammeterRight = [6.2, 2.8, 11.7] as Point3
  const wiper = [sliderX, 4.25, 15.2] as Point3
  return (
    <>
      <AxialCell position={[-10, 2.8, 15.2]} />
      <Rheostat position={[0, 3.2, 15.2]} slider={slider} />
      <AxialResistor position={[9, 2.9, 15.2]} length={2.4} />
      <MiniAmmeter position={[4, 2.8, 11.7]} fraction={currentFraction} />
      <TerminalPost position={loadRed} color="#b8423a" />
      <TerminalPost position={loadBlack} color="#1d2327" />
      <TerminalPost position={pointA} color="#b8423a" />
      <TerminalPost position={pointB} color="#1d2327" />
      <SceneLabel position={[-8, 4.1, 15.2]} variant="text" color="#34464d" size={11} weight={800} distanceFactor={25}>
        a
      </SceneLabel>
      <SceneLabel position={[8, 4.1, 15.2]} variant="text" color="#34464d" size={11} weight={800} distanceFactor={25}>
        b
      </SceneLabel>
      <TerminalPost position={[-7.85, 2.8, 15.2]} color="#b8423a" />
      <TerminalPost position={[-6.75, 2.8, 15.2]} color="#b8423a" />
      <BoardWire
        points={[
          [-5.6, 2.8, 15.2],
          [-6.75, 2.8, 15.2],
        ]}
        color="#b8423a"
      />
      <BoardWire points={[[-7.85, 2.8, 15.2], pointA]} color="#b8423a" />
      <group position={[-6.75, 2.8, 15.2]} rotation={[0, 0, closed ? 0 : -0.7]}>
        <mesh position={[-0.55, 0, 0]}>
          <boxGeometry args={[1.15, 0.13, 0.13]} />
          <meshStandardMaterial color="#b8423a" metalness={0.72} roughness={0.26} />
        </mesh>
      </group>
      {mode === 'divider' && (
        <>
          <BoardWire points={[pointB, [8, 2.8, 18.8], [-14.4, 2.8, 18.8], [-13.15, 2.8, 15.2]]} color="#1d2327" />
          <BoardWire points={[pointA, loadRed]} color="#b8423a" />
          <BoardWire points={[loadBlack, [10.6, 2.8, 11.7], ammeterRight]} color="#315d88" />
          <BoardWire points={[ammeterLeft, [1.8, 2.8, 13.2], [sliderX, 2.8, 13.2], wiper]} color="#315d88" />
        </>
      )}
      {mode === 'limit' && (
        <>
          <BoardWire points={[wiper, [sliderX, 2.8, 13.2], [ammeterLeft[0], 2.8, 13.2], ammeterLeft]} color="#d99531" />
          <BoardWire points={[ammeterRight, [6.2, 2.8, 15.2], loadRed]} color="#d99531" />
          <BoardWire points={[loadBlack, [10.6, 2.8, 18.8], [-14.4, 2.8, 18.8], [-13.15, 2.8, 15.2]]} color="#1d2327" />
        </>
      )}
    </>
  )
}

function ConversionModule({ connected, kind }: { connected: boolean; kind: 'V' | 'A' }) {
  const redJack = meterWorld(3, 1.9, 2).toArray() as Point3
  const blackJack = meterWorld(-3, 1.9, 2).toArray() as Point3
  return (
    <>
      <AxialResistor position={[10, 2.9, 15.2]} length={4.4} color={connected ? '#d8c39a' : '#aaa89c'} />
      <TerminalPost position={kind === 'A' ? [7.2, 2.7, 15.2] : [12.8, 2.7, 15.2]} color="#b8423a" />
      <TerminalPost position={kind === 'A' ? [12.8, 2.7, 15.2] : [14.2, 2.7, 15.2]} color="#1d2327" />
      <TerminalPost position={redJack} color="#b8423a" />
      <BoardWire
        points={[redJack, [5, 2.8, 9], [7.2, 2.8, 15.2]]}
        color={connected ? '#b8423a' : '#9a9a91'}
        lineWidth={connected ? 3 : 1.2}
      />
      {kind === 'A' ? (
        <>
          <TerminalPost position={blackJack} color="#1d2327" />
          <BoardWire
            points={[blackJack, [-5, 2.8, 9], [12.8, 2.8, 15.2]]}
            color={connected ? '#315d88' : '#9a9a91'}
            lineWidth={connected ? 3 : 1.2}
          />
        </>
      ) : (
        <>
          <TerminalPost position={blackJack} color="#1d2327" />
          <BoardWire
            points={[blackJack, [-5, 2.8, 3], [-5, 2.8, 18.5], [14.2, 2.8, 18.5], [14.2, 2.8, 15.2]]}
            color={connected ? '#315d88' : '#9a9a91'}
            lineWidth={connected ? 3 : 1.2}
          />
        </>
      )}
      <SceneLabel
        position={[kind === 'A' ? 7.2 : 12.8, 5.8, 15.2]}
        variant="text"
        color={connected ? '#354a52' : '#6b6f70'}
        size={11}
        weight={800}
        distanceFactor={26}
      >
        {kind === 'V' ? 'V+ 输入' : 'I+ 输入'}
      </SceneLabel>
      {kind === 'V' && (
        <SceneLabel
          position={[14.2, 3.3, 15.2]}
          variant="text"
          color="#6b6f70"
          size={11}
          weight={800}
          distanceFactor={26}
        >
          COM
        </SceneLabel>
      )}
      {kind === 'A' && (
        <SceneLabel
          position={[12.8, 3.3, 15.2]}
          variant="text"
          color="#6b6f70"
          size={11}
          weight={800}
          distanceFactor={26}
        >
          I−
        </SceneLabel>
      )}
      <SceneLabel
        position={[10, 4.2, 15.2]}
        variant="text"
        color={connected ? '#354a52' : '#6b6f70'}
        size={11}
        weight={800}
        distanceFactor={26}
      >
        {kind === 'V' ? '串联电阻 Rs' : '分流电阻 Rsh'}
      </SceneLabel>
    </>
  )
}

export function MeterAssembly({
  pose,
  stage = 'use',
  rheostatSlider = 0.3,
  rheostatMode = 'divider',
  rheostatClosed = false,
  rheostatCurrentFraction = 0,
  rangeLabel = '直流 2.5 V',
  convKind = 'V',
  conversionConnected = false,
  secondaryFraction = 0.5,
}: {
  pose: MeterPose
  stage?: MeterStage
  rheostatSlider?: number
  rheostatMode?: 'limit' | 'divider'
  rheostatClosed?: boolean
  rheostatCurrentFraction?: number
  rangeLabel?: string
  convKind?: 'V' | 'A'
  conversionConnected?: boolean
  secondaryFraction?: number
}) {
  return (
    <>
      <SceneBackdrop day="#e7eef0" />
      <hemisphereLight args={['#ffffff', '#8b9a98', 0.85]} />
      <directionalLight position={[-30, 90, 60]} intensity={2.2} color="#fff6e8" castShadow />
      <directionalLight position={[30, 54, -60]} intensity={0.65} color="#e6f1ff" />
      <mesh position={[0, 0, 3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 44]} />
        <meshStandardMaterial color="#e6dfcf" roughness={0.85} />
      </mesh>
      <group name="meter-body" position={[0, 0.2, -4]} rotation={[-0.34, 0, 0]}>
        <mesh position={[0, 8, 0]} castShadow receiveShadow>
          <boxGeometry args={[11, 16, 3.6]} />
          <meshStandardMaterial color="#2f3b40" roughness={0.5} />
        </mesh>
        <mesh position={[0, 8, 1.85]}>
          <boxGeometry args={[10.2, 15.2, 0.2]} />
          <meshStandardMaterial color="#e9ece6" roughness={0.6} />
        </mesh>
        <DialFace />
        <group name="meter-needle" position={[0, NEEDLE_PIVOT_Y, 2.06]} rotation={[0, 0, pose.needle]}>
          <mesh position={[0, NEEDLE_LENGTH / 2, 0]}>
            <boxGeometry args={[0.08, NEEDLE_LENGTH, 0.04]} />
            <meshStandardMaterial color="#1d2327" />
          </mesh>
        </group>
        <group name="meter-screw" position={[0, 8.7, 2]} rotation={[0, 0, pose.screw]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.25, 16]} />
            <meshStandardMaterial color="#8e999e" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
        <group name="meter-knob" position={[0, 4.4, 2]} rotation={[0, 0, pose.knob]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[2.1, 2.1, 0.5, 24]} />
            <meshStandardMaterial color="#3a474d" roughness={0.45} />
          </mesh>
          <mesh position={[0, 1.6, 0.7]}>
            <boxGeometry args={[0.22, 0.7, 0.5]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
        </group>
        <SceneLabel position={[0, 7.25, 2.08]} size={10} weight={800} distanceFactor={28}>
          {rangeLabel}
        </SceneLabel>
        <group name="meter-ohm" position={[3.9, 7.1, 2]} rotation={[0, 0, pose.ohmKnob]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.75, 0.75, 0.6, 16]} />
            <meshStandardMaterial color="#3a474d" />
          </mesh>
        </group>
      </group>
      <mesh position={[0, 0.5, 12]} receiveShadow>
        <boxGeometry args={[30, 1, 13]} />
        <meshStandardMaterial color="#e2d2b0" roughness={0.7} />
      </mesh>
      {stage === 'use' ? <UseCircuit target={pose.target} /> : null}
      {stage === 'convert' ? <ConversionModule connected={conversionConnected} kind={convKind} /> : null}
      {stage === 'va' ? <VaCircuit fraction={secondaryFraction} /> : null}
      {stage === 'rheostat' ? (
        <RheostatCircuit
          slider={rheostatSlider}
          mode={rheostatMode}
          closed={rheostatClosed}
          currentFraction={rheostatCurrentFraction}
        />
      ) : null}
      {stage === 'use' || stage === 'va' || stage === 'rheostat' ? (
        <>
          <Pen name="probe-red" position={pose.red} color="#b8423a" />
          <Pen name="probe-black" position={pose.black} color="#1d2327" />
          <ProbeCable tip={pose.red} color="#b8423a" side={1} jack={[3, 1.9, 2]} />
          <ProbeCable tip={pose.black} color="#1d2327" side={-1} jack={[-3, 1.9, 2]} />
        </>
      ) : null}
    </>
  )
}
