import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

import { CurrentIndicators } from './CurrentIndicators'

type RotorAssemblyProps = {
  angleRad: number
}

function IronCore() {
  const slices = 10
  const totalLength = 1.0
  const gap = 0.01
  const sliceThickness = (totalLength - gap * (slices - 1)) / slices

  return (
    <group name="iron-core">
      {Array.from({ length: slices }, (_, i) => {
        const z =
          -totalLength / 2 +
          sliceThickness / 2 +
          i * (sliceThickness + gap)
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.85, 0.85, sliceThickness, 24]} />
            <meshStandardMaterial
              color="#3a3a3a"
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Shaft() {
  return (
    <mesh name="shaft" rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.06, 0.06, 7.0, 12]} />
      <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

function buildCoilPath() {
  const hw = 1.09
  const hd = 0.53
  const pts: [number, number, number][] = [
    [-hd, -hw, 0],
    [-hd, hw, 0],
    [hd, hw, 0],
    [hd, -hw, 0],
    [-hd, -hw, 0],
  ]
  return new CatmullRomCurve3(
    pts.map(([x, y, z]) => new Vector3(x, y, z)),
    true,
    'catmullrom',
    0.15,
  )
}

function Coil() {
  const coilCurve = useMemo(() => buildCoilPath(), [])
  return (
    <group name="coil-loop">
      <mesh>
        <tubeGeometry args={[coilCurve, 80, 0.055, 12, true]} />
        <meshStandardMaterial
          color="#B87333"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      <Text
        position={[-0.53, -1.09, 0.15]}
        color="#fbfbfd"
        fontSize={0.12}
        anchorX="center"
        anchorY="middle"
        name="label-A"
      >
        A
      </Text>
      <Text
        position={[-0.53, 1.09, 0.15]}
        color="#fbfbfd"
        fontSize={0.12}
        anchorX="center"
        anchorY="middle"
        name="label-B"
      >
        B
      </Text>
      <Text
        position={[0.53, 1.09, 0.15]}
        color="#fbfbfd"
        fontSize={0.12}
        anchorX="center"
        anchorY="middle"
        name="label-C"
      >
        C
      </Text>
      <Text
        position={[0.53, -1.09, 0.15]}
        color="#fbfbfd"
        fontSize={0.12}
        anchorX="center"
        anchorY="middle"
        name="label-D"
      >
        D
      </Text>
    </group>
  )
}

function SlipRings() {
  return (
    <group name="slip-rings">
      <mesh position={[0, 0, 1.8]} name="slip-ring-front">
        <torusGeometry args={[0.17, 0.04, 14, 30]} />
        <meshStandardMaterial
          color="#C5A03F"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0, 2.1]} name="slip-ring-back">
        <torusGeometry args={[0.17, 0.04, 14, 30]} />
        <meshStandardMaterial
          color="#C5A03F"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}

export function RotorAssembly({ angleRad }: RotorAssemblyProps) {
  return (
    <group name="rotor-assembly" rotation={[0, 0, angleRad]}>
      <IronCore />
      <Coil />
      <Shaft />
      <SlipRings />
      <CurrentIndicators angleRad={angleRad} />
    </group>
  )
}
