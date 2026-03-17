import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

type ExternalCircuitProps = {
  meterNeedleAngleRad: number
}

function OutputMeter({ needleAngleRad }: { needleAngleRad: number }) {
  return (
    <group position={[0, 0, 4.2]} name="output-meter">
      {/* Meter body */}
      <mesh>
        <boxGeometry args={[0.96, 1.24, 0.34]} />
        <meshStandardMaterial color="#a9521d" roughness={0.52} />
      </mesh>
      {/* Dial face */}
      <mesh position={[0, 0.1, 0.18]}>
        <planeGeometry args={[0.62, 0.72]} />
        <meshBasicMaterial color="#f9eee2" />
      </mesh>
      {/* Label */}
      <Text
        position={[0, -0.24, 0.19]}
        color="#61311a"
        fontSize={0.18}
        anchorX="center"
        anchorY="middle"
      >
        A
      </Text>
      {/* Needle */}
      <group
        position={[0, 0.12, 0.19]}
        rotation={[0, 0, needleAngleRad * 0.9]}
      >
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.032, 0.36, 0.02]} />
          <meshBasicMaterial color="#f04d43" />
        </mesh>
        <mesh>
          <circleGeometry args={[0.04, 18]} />
          <meshBasicMaterial color="#fff7ef" />
        </mesh>
      </group>
    </group>
  )
}

export function ExternalCircuit({
  meterNeedleAngleRad,
}: ExternalCircuitProps) {
  const upperWire = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, 0.28, 1.8),
        new Vector3(0, 0.6, 2.5),
        new Vector3(0, 0.6, 3.5),
        new Vector3(0, 0.4, 4.2),
      ]),
    [],
  )

  const lowerWire = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, -0.28, 2.1),
        new Vector3(0, -0.6, 2.8),
        new Vector3(0, -0.6, 3.5),
        new Vector3(0, -0.4, 4.2),
      ]),
    [],
  )

  return (
    <group name="external-circuit">
      {/* Upper wire (red) */}
      <mesh>
        <tubeGeometry args={[upperWire, 40, 0.028, 10, false]} />
        <meshStandardMaterial color="#cc3333" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Lower wire (blue) */}
      <mesh>
        <tubeGeometry args={[lowerWire, 40, 0.028, 10, false]} />
        <meshStandardMaterial color="#3355cc" metalness={0.5} roughness={0.3} />
      </mesh>
      <OutputMeter needleAngleRad={meterNeedleAngleRad} />
    </group>
  )
}
