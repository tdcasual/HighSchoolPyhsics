import { useMemo } from 'react'
import { CanvasTexture, CatmullRomCurve3, Euler, SRGBColorSpace, Vector3 } from 'three'
import { ohmFraction } from './model'
import { NEEDLE_LENGTH, NEEDLE_PIVOT_Y, NEEDLE_SPAN, type MeterPose } from './pose'

function paintDial(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = '#fbfbf5'
  context.fillRect(0, 0, width, height)
  const cx = width / 2
  const cy = height * 1.18
  const radius = height * 0.84
  const angle = (fraction: number) => -Math.PI / 2 + (fraction - 0.5) * 2 * NEEDLE_SPAN
  context.strokeStyle = '#1b2427'
  context.lineWidth = 2
  context.beginPath()
  context.arc(cx, cy, radius, angle(0), angle(1))
  context.stroke()
  for (let mark = 0; mark <= 50; mark += 1) {
    const theta = angle(mark / 50)
    const inner = radius - (mark % 10 === 0 ? 18 : 10)
    context.beginPath()
    context.moveTo(cx + Math.cos(theta) * radius, cy + Math.sin(theta) * radius)
    context.lineTo(cx + Math.cos(theta) * inner, cy + Math.sin(theta) * inner)
    context.stroke()
  }
  context.fillStyle = '#2f7a4f'
  context.font = '600 28px Arial'
  context.textAlign = 'center'
  for (const resistance of [0, 5, 15, 50, 200, 1000]) {
    const fraction = resistance === 0 ? 1 : ohmFraction(resistance, 1)
    const theta = angle(fraction)
    context.fillText(resistance >= 1000 ? '1k' : String(resistance), cx + Math.cos(theta) * (radius + 28), cy + Math.sin(theta) * (radius + 28))
  }
  const infinity = angle(0)
  context.fillText('∞', cx + Math.cos(infinity) * (radius + 28), cy + Math.sin(infinity) * (radius + 28))
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

function ProbeCable({ tip, color, side, jack }: { tip: [number, number, number]; color: string; side: number; jack: [number, number, number] }) {
  const curve = useMemo(() => {
    const tipAt = new Vector3(tip[0], tip[1], tip[2])
    const tail = new Vector3(0, 6.2, 0).applyEuler(new Euler(0.95, 0, side < 0 ? 0.28 : -0.28)).add(tipAt)
    const jackAt = meterWorld(jack[0], jack[1], jack[2])
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

function Pen({ name, position, color }: { name: string; position: [number, number, number]; color: string }) {
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

export function MeterAssembly({ pose }: { pose: MeterPose }) {
  return (
    <>
      <color attach="background" args={['#e7eef0']} />
      <hemisphereLight args={['#ffffff', '#8b9a98', 0.85]} />
      <directionalLight position={[-30, 90, 60]} intensity={2.2} color="#fff6e8" castShadow />
      <directionalLight position={[30, 54, -60]} intensity={0.65} color="#e6f1ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
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
      <mesh position={[-10, 2.8, 9]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.1, 1.1, 6, 16]} />
        <meshStandardMaterial color="#d6873e" />
      </mesh>
      <mesh position={[0, 2.9, 9]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 3.2, 16]} />
        <meshStandardMaterial color="#d8c39a" />
      </mesh>
      <mesh position={[9, 2.9, 9]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 2.4, 12]} />
        <meshStandardMaterial color="#1f2427" />
      </mesh>
      <Pen name="probe-red" position={pose.red} color="#b8423a" />
      <Pen name="probe-black" position={pose.black} color="#1d2327" />
      <ProbeCable tip={pose.red} color="#b8423a" side={1} jack={[3, 1.9, 2]} />
      <ProbeCable tip={pose.black} color="#1d2327" side={-1} jack={[-3, 1.9, 2]} />
    </>
  )
}
