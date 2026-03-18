import { useMemo } from 'react'
import { CurvePath, LineCurve3, Vector3 } from 'three'
import type { AlternatorPalette } from '../palette'

type ExternalCircuitProps = {
  meterNeedleAngleRad: number
  palette: AlternatorPalette
}

function buildTubePath(points: [number, number, number][]) {
  const curvePath = new CurvePath<Vector3>()
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]
    curvePath.add(
      new LineCurve3(
        new Vector3(start[0], start[1], start[2]),
        new Vector3(end[0], end[1], end[2]),
      ),
    )
  }
  return curvePath
}

function Ammeter({
  meterNeedleAngleRad,
  palette,
}: {
  meterNeedleAngleRad: number
  palette: AlternatorPalette
}) {
  return (
    <group name="ammeter" position={[-0.5, -4, 7]} rotation={[-Math.PI / 4, 0, 0]}>
      <mesh name="ammeter-casing" rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.3, 32]} />
        <meshStandardMaterial color={palette.meterCasing} />
      </mesh>

      <mesh name="ammeter-border">
        <torusGeometry args={[1.5, 0.1, 16, 32]} />
        <meshBasicMaterial color={palette.meterBorder} />
      </mesh>

      <mesh name="ammeter-center-dot" rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 16]} />
        <meshBasicMaterial color={palette.meterBorder} />
      </mesh>

      <group name="ammeter-needle" position={[0, 0, 0.2]} rotation={[0, 0, meterNeedleAngleRad]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.4, 10]} />
          <meshBasicMaterial color={palette.meterNeedle} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <coneGeometry args={[0.1, 0.3, 8]} />
          <meshBasicMaterial color={palette.meterNeedle} />
        </mesh>
      </group>
    </group>
  )
}

export function ExternalCircuit({ meterNeedleAngleRad, palette }: ExternalCircuitProps) {
  const orangeCircuit = useMemo(
    () =>
      buildTubePath([
        [0, -1.4, 2.5],
        [0, -4, 2.5],
        [4, -4, 2.5],
        [4, -4, 7],
      ]),
    [],
  )
  const blueCircuit = useMemo(
    () =>
      buildTubePath([
        [0, -1.4, 5.0],
        [0, -4, 5.0],
        [-4, -4, 5.0],
        [-4, -4, 7],
      ]),
    [],
  )
  const connectorRight = useMemo(
    () => buildTubePath([[2, -4, 7], [0.5, -4, 7]]),
    [],
  )
  const connectorLeft = useMemo(
    () => buildTubePath([[-4, -4, 7], [-1.5, -4, 7]]),
    [],
  )

  return (
    <group name="external-circuit">
      <mesh>
        <tubeGeometry args={[orangeCircuit, 64, 0.08, 8, false]} />
        <meshStandardMaterial color={palette.circuit} />
      </mesh>

      <mesh>
        <tubeGeometry args={[blueCircuit, 64, 0.08, 8, false]} />
        <meshStandardMaterial color={palette.circuit} />
      </mesh>

      <mesh position={[3, -4, 7]}>
        <boxGeometry args={[2, 0.6, 0.6]} />
        <meshStandardMaterial color={palette.resistor} />
      </mesh>

      <mesh>
        <tubeGeometry args={[connectorRight, 16, 0.08, 8, false]} />
        <meshStandardMaterial color={palette.circuit} />
      </mesh>
      <mesh>
        <tubeGeometry args={[connectorLeft, 16, 0.08, 8, false]} />
        <meshStandardMaterial color={palette.circuit} />
      </mesh>

      <Ammeter meterNeedleAngleRad={meterNeedleAngleRad} palette={palette} />
    </group>
  )
}
