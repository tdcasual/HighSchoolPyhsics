import { Html } from '@react-three/drei/web/Html'
import { EM_LAYOUT } from './layout'
import { TICKER_CANDY as C } from './palette'
import { BindingTerminal, Frame, GuideWindow, PartLabel, Wire } from './TickerTimerParts'

function RectangularCoil() {
  return (
    <group>
      <mesh position={[-0.85, 0.31, 0]}>
        <boxGeometry args={[0.9, 0.18, 0.76]} />
        <meshStandardMaterial color={C.emBaseLip} metalness={0.72} roughness={0.42} />
      </mesh>
      {[-0.3, 0.3].map((z) => (
        <mesh key={z} position={[-0.85, 0.53, z]}>
          <boxGeometry args={[0.78, 0.26, 0.1]} />
          <meshStandardMaterial color={C.emBaseLip} metalness={0.72} roughness={0.42} />
        </mesh>
      ))}
      <Frame position={[-1.25, 1, 0]} width={0.08} height={0.78} depth={0.74} bar={0.11} color={C.coilBobbin} />
      <Frame position={[-0.45, 1, 0]} width={0.08} height={0.78} depth={0.74} bar={0.11} color={C.coilBobbin} />
      {Array.from({ length: 32 }, (_, index) => {
        const x = -1.2 + index * (0.7 / 31)
        return (
          <Frame key={x} position={[x, 1, 0]} width={0.012} height={0.68} depth={0.64} bar={0.025} color={C.windings} />
        )
      })}
    </group>
  )
}

export function ElectromagneticTimer({
  powered,
  phase01,
  showLabels,
}: {
  powered: boolean
  phase01: number
  showLabels: boolean
}) {
  const strike = powered ? Math.sin(phase01 * Math.PI * 2) : 0
  const reedAngle = strike * 0.025

  return (
    <group>
      <mesh position={EM_LAYOUT.base.position} castShadow receiveShadow>
        <boxGeometry args={[...EM_LAYOUT.base.size]} />
        <meshStandardMaterial color={C.emBase} metalness={0.42} roughness={0.48} />
      </mesh>
      {[
        [-1.93, -1.04],
        [1.93, -1.04],
        [-1.93, 1.04],
        [1.93, 1.04],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.234, z]}>
          <cylinderGeometry args={[0.055, 0.055, 0.018, 24]} />
          <meshStandardMaterial color={C.emBaseLip} metalness={0.76} roughness={0.34} />
        </mesh>
      ))}

      <mesh position={EM_LAYOUT.fixBlock.position}>
        <boxGeometry args={[...EM_LAYOUT.fixBlock.size]} />
        <meshStandardMaterial color={C.emBase} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={EM_LAYOUT.fixScrew.position}>
        <cylinderGeometry args={[0.07, 0.07, 0.9, 18]} />
        <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[-1.6, 0.6, -1.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 16]} />
        <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
      </mesh>

      <BindingTerminal position={EM_LAYOUT.terminals[0].position} color={C.terminalPositive} />
      <BindingTerminal position={EM_LAYOUT.terminals[1].position} color={C.terminalNegative} />
      <Wire
        points={[
          [-1.2, 0.44, -0.95],
          [-1.38, 0.28, -0.65],
          [-1.15, 0.3, -0.35],
          [-0.82, 0.65, -0.32],
        ]}
        color={C.terminalPositive}
      />
      <Wire
        points={[
          [-0.5, 0.44, -0.95],
          [-0.3, 0.28, -0.65],
          [-0.48, 0.3, 0.3],
          [-0.8, 0.65, 0.32],
        ]}
        color={C.terminalNegative}
      />

      <RectangularCoil />

      <mesh position={[0.15, 0.99, -0.46]}>
        <boxGeometry args={[0.44, 0.72, 0.16]} />
        <meshStandardMaterial color={C.magnet} metalness={0.82} roughness={0.32} />
      </mesh>
      <mesh position={[0.15, 0.43, -0.4]}>
        <boxGeometry args={[0.24, 0.4, 0.24]} />
        <meshStandardMaterial color={C.emBaseLip} metalness={0.75} roughness={0.4} />
      </mesh>
      <mesh position={EM_LAYOUT.poleN.position} castShadow>
        <boxGeometry args={[...EM_LAYOUT.poleN.size]} />
        <meshStandardMaterial color={C.poleN} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={EM_LAYOUT.poleS.position} castShadow>
        <boxGeometry args={[...EM_LAYOUT.poleS.size]} />
        <meshStandardMaterial color={C.poleS} metalness={0.3} roughness={0.4} />
      </mesh>
      <Html position={[0.15, 1.25, 0.415]} center style={{ pointerEvents: 'none' }}>
        <span className="ticker-pole-badge ticker-pole-n">N</span>
      </Html>
      <Html position={[0.15, 0.73, 0.415]} center style={{ pointerEvents: 'none' }}>
        <span className="ticker-pole-badge ticker-pole-s">S</span>
      </Html>

      <mesh position={[-1.6, 0.59, -0.4]}>
        <boxGeometry args={[0.45, 0.74, 0.24]} />
        <meshStandardMaterial color={C.emBaseLip} metalness={0.78} roughness={0.38} />
      </mesh>
      <mesh position={[-1.6, 0.985, -0.2]}>
        <boxGeometry args={[0.48, 0.08, 0.76]} />
        <meshStandardMaterial color={C.nut} metalness={0.78} roughness={0.28} />
      </mesh>
      <group position={[-1.6, 1, 0]} rotation={[0, 0, reedAngle]}>
        <mesh position={[1.2, 0, 0]} castShadow>
          <boxGeometry args={[2.4, 0.024, 0.22, 16, 1, 1]} />
          <meshStandardMaterial color={C.reed} metalness={0.9} roughness={0.3} />
        </mesh>
        <group position={[2.4, -0.21 + strike * 0.028, 0]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.005, 0.46, 16]} />
            <meshStandardMaterial color={C.needle} metalness={0.96} roughness={0.12} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
            <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
          </mesh>
        </group>
      </group>

      <mesh position={[1.3, 0.35, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 20]} />
        <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={EM_LAYOUT.carbon.position} castShadow receiveShadow>
        <cylinderGeometry args={[EM_LAYOUT.carbon.radius, EM_LAYOUT.carbon.radius, 0.015, 48]} />
        <meshStandardMaterial color={C.carbon} roughness={0.86} />
      </mesh>
      <mesh position={EM_LAYOUT.carbonPin.position}>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 18]} />
        <meshStandardMaterial color={C.pin} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[1.3, 0.51, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 18]} />
        <meshStandardMaterial color={C.pin} metalness={0.82} roughness={0.28} />
      </mesh>

      <GuideWindow z={-0.78} />
      <GuideWindow z={0.78} />
      <mesh position={EM_LAYOUT.pad.position}>
        <boxGeometry args={[...EM_LAYOUT.pad.size]} />
        <meshStandardMaterial color={C.pad} metalness={0.65} roughness={0.4} />
      </mesh>

      <PartLabel visible={showLabels} position={[-1.15, 1.72, 0]}>
        中空线圈
      </PartLabel>
      <PartLabel visible={showLabels} position={[-0.25, 1.62, 0.72]}>
        弹性振片
      </PartLabel>
      <PartLabel visible={showLabels} position={[0.35, 1.58, -0.55]}>
        永久磁铁
      </PartLabel>
      <PartLabel visible={showLabels} position={[0.8, 1.28, 0.38]}>
        振针
      </PartLabel>
      <PartLabel visible={showLabels} position={[1.65, 1.15, 0]}>
        复写纸盘
      </PartLabel>
    </group>
  )
}
