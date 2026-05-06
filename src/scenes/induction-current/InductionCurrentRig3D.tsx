import { useEffect, useMemo } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Euler,
  Quaternion,
  TubeGeometry,
  Vector3,
} from 'three'
import type { PoleSetting } from './model'

type InductionCurrentRig3DProps = {
  poleSetting: PoleSetting
  magnetY: number
  coilCurrent: number
  coilCurrentSign: -1 | 0 | 1
  needleAngleRad: number
}

type CoilArrowSample = {
  position: [number, number, number]
  tangent: [number, number, number]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildCoilCurve(): CatmullRomCurve3 {
  const points: Vector3[] = []
  const radius = 4
  const height = 12
  const turns = 10
  const segments = 500

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments
    const angle = t * Math.PI * 2 * turns
    points.push(
      new Vector3(
        Math.cos(angle) * radius,
        (t - 0.5) * height,
        -Math.sin(angle) * radius,
      ),
    )
  }

  return new CatmullRomCurve3(points)
}

const _v3Dir = new Vector3()
const _v3Up = new Vector3(0, 1, 0)
const _quat = new Quaternion()
const _euler = new Euler()

function resolveArrowRotation(
  tangent: [number, number, number],
  currentSign: -1 | 0 | 1,
): [number, number, number] {
  _v3Dir.set(tangent[0], tangent[1], tangent[2]).normalize()
  if (currentSign < 0) {
    _v3Dir.multiplyScalar(-1)
  }

  _quat.setFromUnitVectors(_v3Up, _v3Dir)
  _euler.setFromQuaternion(_quat)
  return [_euler.x, _euler.y, _euler.z]
}

function buildNeedleGeometry(): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([-0.1, 0, 0, 0.1, 0, 0, 0, 3.5, 0]), 3),
  )
  return geometry
}

export function InductionCurrentRig3D({
  poleSetting,
  magnetY,
  coilCurrent,
  coilCurrentSign,
  needleAngleRad,
}: InductionCurrentRig3DProps) {
  const coilCurve = useMemo(() => buildCoilCurve(), [])
  const coilGeometry = useMemo(() => new TubeGeometry(coilCurve, 400, 0.25, 8, false), [coilCurve])

  const coilArrowSamples = useMemo<CoilArrowSample[]>(() => {
    const samples: CoilArrowSample[] = []
    for (let index = 0; index < 24; index += 1) {
      const t = index / 24
      const point = coilCurve.getPointAt(t)
      const tangent = coilCurve.getTangentAt(t).normalize()
      const outward = new Vector3(point.x, 0, point.z).normalize().multiplyScalar(0.45)
      const anchor = point.clone().add(outward)

      samples.push({
        position: [anchor.x, anchor.y, anchor.z],
        tangent: [tangent.x, tangent.y, tangent.z],
      })
    }
    return samples
  }, [coilCurve])

  const [wireA, wireB] = useMemo(() => {
    const coilBottom = coilCurve.getPointAt(0)
    const coilTop = coilCurve.getPointAt(1)

    const pathA = new CatmullRomCurve3([
      coilTop,
      new Vector3(coilTop.x + 2, coilTop.y + 2, coilTop.z),
      new Vector3(10, 5, 0),
      new Vector3(13, -3, 0),
      new Vector3(13.2, -4.5, 0.5),
    ])
    const pathB = new CatmullRomCurve3([
      coilBottom,
      new Vector3(coilBottom.x + 2, coilBottom.y - 2, coilBottom.z),
      new Vector3(10, -10, 0),
      new Vector3(16, -10, 0),
      new Vector3(16.8, -4.5, -0.5),
    ])

    return [new TubeGeometry(pathA, 64, 0.1, 8, false), new TubeGeometry(pathB, 64, 0.1, 8, false)]
  }, [coilCurve])

  const needleGeometry = useMemo(() => buildNeedleGeometry(), [])

  useEffect(() => {
    return () => {
      coilGeometry.dispose()
      wireA.dispose()
      wireB.dispose()
      needleGeometry.dispose()
    }
  }, [coilGeometry, needleGeometry, wireA, wireB])

  const northOnBottom = poleSetting === 's-top-n-down'
  const topColor = northOnBottom ? '#1f3cff' : '#ff2f2f'
  const bottomColor = northOnBottom ? '#ff2f2f' : '#1f3cff'
  const arrowVisible = Math.abs(coilCurrent) > 0.01
  const arrowScale = clamp(Math.abs(coilCurrent) * 2.5, 0.5, 1.8)

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 30, 20]} intensity={1.2} />
      <color attach="background" args={['#151515']} />

      <gridHelper args={[80, 80, '#333333', '#1a1a1a']} position={[0, -12, 0]} />

      <mesh geometry={coilGeometry}>
        <meshStandardMaterial color="#b87333" metalness={0.6} roughness={0.3} />
      </mesh>

      {coilArrowSamples.map((sample, index) => (
        <mesh
          key={`coil-arrow-${index}`}
          visible={arrowVisible}
          position={sample.position}
          rotation={resolveArrowRotation(sample.tangent, coilCurrentSign)}
          scale={[arrowScale, arrowScale, arrowScale]}
        >
          <coneGeometry args={[0.25, 0.8, 10]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      ))}

      <group position={[0, magnetY, 0]}>
        <mesh position={[0, -3, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 6, 32]} />
          <meshStandardMaterial color={bottomColor} />
        </mesh>
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 6, 32]} />
          <meshStandardMaterial color={topColor} />
        </mesh>
      </group>

      <mesh geometry={wireA}>
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh geometry={wireB}>
        <meshStandardMaterial color="#222222" />
      </mesh>

      <group position={[15, -8, 0]} rotation={[0, -Math.PI / 8, 0]}>
        <mesh>
          <boxGeometry args={[8, 8, 4]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        <mesh position={[0, 0, 2.05]}>
          <circleGeometry args={[3.5, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {Array.from({ length: 11 }, (_, index) => index - 5).map((value) => {
          const angle = -value * (Math.PI / 12)
          return (
            <mesh
              key={`tick-${value}`}
              position={[Math.sin(angle) * 2.8, Math.cos(angle) * 2.8, 2.06]}
              rotation={[0, 0, -angle]}
            >
              <boxGeometry args={[0.1, 0.5, 0.01]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          )
        })}

        <group position={[0, -1, 2.1]} rotation={[0, 0, needleAngleRad]}>
          <mesh geometry={needleGeometry}>
            <meshBasicMaterial color="#ff0000" side={2} />
          </mesh>
        </group>

        <mesh position={[-2, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 1, 16]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
        <mesh position={[2, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 1, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
    </group>
  )
}
