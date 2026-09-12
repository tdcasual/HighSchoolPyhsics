import { Html } from "@react-three/drei/web/Html";
import { useMemo } from "react";
import { CatmullRomCurve3, DoubleSide, Vector3 } from "three";
import { EM_LAYOUT, SPARK_LAYOUT, TAPE, tapeWorldX } from "./layout";
import type { MotionMode, PrintQuality, TapeDot, TimerKind } from "./model";
import { TICKER_CANDY as C } from "./palette";

type TickerTimerRig3DProps = {
  kind: TimerKind;
  powered: boolean;
  released: boolean;
  phase01: number;
  printQuality: PrintQuality;
  displacementM: number;
  dots: TapeDot[];
  showLabels: boolean;
  motionMode: MotionMode;
};

function PartLabel({
  position,
  children,
  visible,
}: {
  position: [number, number, number];
  children: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <Html
      position={position}
      center
      style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
    >
      <span className="ticker-3d-label">{children}</span>
    </Html>
  );
}

function Wire({
  points,
  color,
}: {
  points: ReadonlyArray<readonly [number, number, number]>;
  color: string;
}) {
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((point) => new Vector3(...point))),
    [points],
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 40, 0.018, 8, false]} />
      <meshStandardMaterial color={color} metalness={0.22} roughness={0.46} />
    </mesh>
  );
}

function Frame({
  position,
  width,
  height,
  depth,
  bar,
  color,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  bar: number;
  color: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2 - bar / 2, 0]}>
        <boxGeometry args={[width, bar, depth]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </mesh>
      <mesh position={[0, -height / 2 + bar / 2, 0]}>
        <boxGeometry args={[width, bar, depth]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, depth / 2 - bar / 2]}>
        <boxGeometry args={[width, Math.max(0.01, height - bar * 2), bar]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, -depth / 2 + bar / 2]}>
        <boxGeometry args={[width, Math.max(0.01, height - bar * 2), bar]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.34} />
      </mesh>
    </group>
  );
}

function RectangularCoil() {
  return (
    <group>
      <mesh position={[-0.85, 0.31, 0]}>
        <boxGeometry args={[0.9, 0.18, 0.76]} />
        <meshStandardMaterial
          color={C.emBaseLip}
          metalness={0.72}
          roughness={0.42}
        />
      </mesh>
      {[-0.3, 0.3].map((z) => (
        <mesh key={z} position={[-0.85, 0.53, z]}>
          <boxGeometry args={[0.78, 0.26, 0.1]} />
          <meshStandardMaterial
            color={C.emBaseLip}
            metalness={0.72}
            roughness={0.42}
          />
        </mesh>
      ))}
      <Frame
        position={[-1.25, 1, 0]}
        width={0.08}
        height={0.78}
        depth={0.74}
        bar={0.11}
        color={C.coilBobbin}
      />
      <Frame
        position={[-0.45, 1, 0]}
        width={0.08}
        height={0.78}
        depth={0.74}
        bar={0.11}
        color={C.coilBobbin}
      />
      {Array.from({ length: 32 }, (_, index) => {
        const x = -1.2 + index * (0.7 / 31);
        return (
          <Frame
            key={x}
            position={[x, 1, 0]}
            width={0.012}
            height={0.68}
            depth={0.64}
            bar={0.025}
            color={C.windings}
          />
        );
      })}
    </group>
  );
}

function BindingTerminal({
  position,
  color,
}: {
  position: readonly [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.12, 0.14, 0.25, 20]} />
        <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.18, 20]} />
        <meshStandardMaterial color={color} metalness={0.18} roughness={0.35} />
      </mesh>
    </group>
  );
}

function GuideWindow({ z }: { z: number }) {
  return (
    <group position={[0.8, 0.39, z]}>
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.06, 0.34, 0.06]} />
          <meshStandardMaterial
            color={C.guide}
            metalness={0.7}
            roughness={0.38}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.56, 0.06, 0.06]} />
        <meshStandardMaterial
          color={C.guide}
          metalness={0.7}
          roughness={0.38}
        />
      </mesh>
    </group>
  );
}

function PaperTape({
  displacementM,
  dots,
  printQuality,
}: {
  displacementM: number;
  dots: TapeDot[];
  printQuality: PrintQuality;
}) {
  const tapeCenterX = 0.5;
  const tapeMinX = tapeCenterX - TAPE.visibleLength / 2 + 0.07;
  const tapeMaxX = tapeCenterX + TAPE.visibleLength / 2 - 0.15;

  return (
    <group position={[0.8, 0, -0.8]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0.5, TAPE.y, 0]} receiveShadow>
        <boxGeometry args={[TAPE.visibleLength, TAPE.thickness, TAPE.width]} />
        <meshStandardMaterial
          color={C.tape}
          roughness={0.82}
          side={DoubleSide}
        />
      </mesh>
      {dots.map((dot) => {
        const x = Math.max(
          tapeMinX,
          Math.min(tapeMaxX, tapeWorldX(dot.positionM, displacementM)),
        );
        return (
          <mesh
            key={`${dot.index}-${dot.timeS}`}
            position={[x, TAPE.y + 0.018, 0]}
          >
            <sphereGeometry
              args={[
                dot.smeared || printQuality === "smeared" ? 0.035 : 0.022,
                10,
                10,
              ]}
            />
            <meshBasicMaterial
              color={printQuality === "smeared" ? C.smeared : C.dot}
            />
          </mesh>
        );
      })}
      <mesh position={[tapeMaxX + 0.12, 0.48, 0]}>
        <boxGeometry args={[0.22, 0.08, 0.42]} />
        <meshStandardMaterial color={C.terminalPositive} roughness={0.4} />
      </mesh>
    </group>
  );
}

function ElectromagneticTimer({
  powered,
  phase01,
  showLabels,
}: {
  powered: boolean;
  phase01: number;
  showLabels: boolean;
}) {
  const strike = powered ? Math.sin(phase01 * Math.PI * 2) : 0;
  const reedAngle = strike * 0.025;

  return (
    <group>
      <mesh position={EM_LAYOUT.base.position} castShadow receiveShadow>
        <boxGeometry args={[...EM_LAYOUT.base.size]} />
        <meshStandardMaterial
          color={C.emBase}
          metalness={0.42}
          roughness={0.48}
        />
      </mesh>
      {[
        [-1.93, -1.04],
        [1.93, -1.04],
        [-1.93, 1.04],
        [1.93, 1.04],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.234, z]}>
          <cylinderGeometry args={[0.055, 0.055, 0.018, 24]} />
          <meshStandardMaterial
            color={C.emBaseLip}
            metalness={0.76}
            roughness={0.34}
          />
        </mesh>
      ))}

      <mesh position={EM_LAYOUT.fixBlock.position}>
        <boxGeometry args={[...EM_LAYOUT.fixBlock.size]} />
        <meshStandardMaterial
          color={C.emBase}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      <mesh position={EM_LAYOUT.fixScrew.position}>
        <cylinderGeometry args={[0.07, 0.07, 0.9, 18]} />
        <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[-1.6, 0.6, -1.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 16]} />
        <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
      </mesh>

      <BindingTerminal
        position={EM_LAYOUT.terminals[0].position}
        color={C.terminalPositive}
      />
      <BindingTerminal
        position={EM_LAYOUT.terminals[1].position}
        color={C.terminalNegative}
      />
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
        <meshStandardMaterial
          color={C.magnet}
          metalness={0.82}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0.15, 0.43, -0.4]}>
        <boxGeometry args={[0.24, 0.4, 0.24]} />
        <meshStandardMaterial
          color={C.emBaseLip}
          metalness={0.75}
          roughness={0.4}
        />
      </mesh>
      <mesh position={EM_LAYOUT.poleN.position} castShadow>
        <boxGeometry args={[...EM_LAYOUT.poleN.size]} />
        <meshStandardMaterial color={C.poleN} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={EM_LAYOUT.poleS.position} castShadow>
        <boxGeometry args={[...EM_LAYOUT.poleS.size]} />
        <meshStandardMaterial color={C.poleS} metalness={0.3} roughness={0.4} />
      </mesh>
      <Html
        position={[0.15, 1.25, 0.415]}
        center
        style={{ pointerEvents: "none" }}
      >
        <span className="ticker-pole-badge ticker-pole-n">N</span>
      </Html>
      <Html
        position={[0.15, 0.73, 0.415]}
        center
        style={{ pointerEvents: "none" }}
      >
        <span className="ticker-pole-badge ticker-pole-s">S</span>
      </Html>

      <mesh position={[-1.6, 0.59, -0.4]}>
        <boxGeometry args={[0.45, 0.74, 0.24]} />
        <meshStandardMaterial
          color={C.emBaseLip}
          metalness={0.78}
          roughness={0.38}
        />
      </mesh>
      <mesh position={[-1.6, 0.985, -0.2]}>
        <boxGeometry args={[0.48, 0.08, 0.76]} />
        <meshStandardMaterial color={C.nut} metalness={0.78} roughness={0.28} />
      </mesh>
      <group position={[-1.6, 1, 0]} rotation={[0, 0, reedAngle]}>
        <mesh position={[1.2, 0, 0]} castShadow>
          <boxGeometry args={[2.4, 0.024, 0.22, 16, 1, 1]} />
          <meshStandardMaterial
            color={C.reed}
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        <group position={[2.4, -0.21 + strike * 0.028, 0]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.005, 0.46, 16]} />
            <meshStandardMaterial
              color={C.needle}
              metalness={0.96}
              roughness={0.12}
            />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
            <meshStandardMaterial
              color={C.nut}
              metalness={0.82}
              roughness={0.28}
            />
          </mesh>
        </group>
      </group>

      <mesh position={[1.3, 0.35, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 20]} />
        <meshStandardMaterial color={C.nut} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={EM_LAYOUT.carbon.position} castShadow receiveShadow>
        <cylinderGeometry
          args={[EM_LAYOUT.carbon.radius, EM_LAYOUT.carbon.radius, 0.015, 48]}
        />
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
  );
}

function SparkTimer({
  powered,
  phase01,
  showLabels,
}: {
  powered: boolean;
  phase01: number;
  showLabels: boolean;
}) {
  const sparkOn = powered && phase01 < 0.12;
  return (
    <group>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.12, 2.6]} />
        <meshStandardMaterial
          color={C.emBase}
          metalness={0.4}
          roughness={0.48}
        />
      </mesh>
      <mesh position={SPARK_LAYOUT.box.position} castShadow>
        <boxGeometry args={[...SPARK_LAYOUT.box.size]} />
        <meshStandardMaterial
          color={C.sparkBox}
          metalness={0.25}
          roughness={0.38}
        />
      </mesh>
      <mesh position={[-1.4, 1.54, 0]}>
        <boxGeometry args={[1.64, 0.08, 2.64]} />
        <meshStandardMaterial
          color={C.sparkHead}
          metalness={0.28}
          roughness={0.4}
        />
      </mesh>
      <mesh position={SPARK_LAYOUT.head.position}>
        <boxGeometry args={[...SPARK_LAYOUT.head.size]} />
        <meshStandardMaterial
          color={C.sparkHead}
          metalness={0.34}
          roughness={0.4}
        />
      </mesh>
      <mesh position={SPARK_LAYOUT.disc.position} castShadow>
        <cylinderGeometry
          args={[
            SPARK_LAYOUT.disc.radius,
            SPARK_LAYOUT.disc.radius,
            SPARK_LAYOUT.disc.thickness,
            48,
          ]}
        />
        <meshStandardMaterial color={C.sparkDisc} roughness={0.86} />
      </mesh>
      <mesh position={SPARK_LAYOUT.discShaft.position}>
        <cylinderGeometry args={[0.035, 0.035, 0.42, 18]} />
        <meshStandardMaterial color={C.pin} metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={SPARK_LAYOUT.pressBar.position}>
        <boxGeometry args={[...SPARK_LAYOUT.pressBar.size]} />
        <meshStandardMaterial
          color={C.sparkPress}
          metalness={0.68}
          roughness={0.38}
        />
      </mesh>
      <mesh position={SPARK_LAYOUT.needle.position}>
        <coneGeometry args={[0.036, 0.16, 18]} />
        <meshStandardMaterial
          color={C.sparkNeedle}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {sparkOn ? (
        <mesh position={[0.8, 0.49, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial color={C.sparkFlash} />
        </mesh>
      ) : null}
      <mesh position={SPARK_LAYOUT.switch.position}>
        <boxGeometry args={[0.19, 0.08, 0.22]} />
        <meshStandardMaterial color={C.terminalPositive} />
      </mesh>
      <mesh position={SPARK_LAYOUT.lamp.position}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={powered ? C.lampOn : C.lampOff}
          emissive={powered ? C.lampOn : "#000000"}
          emissiveIntensity={powered ? 1.2 : 0}
        />
      </mesh>
      {SPARK_LAYOUT.sockets.map((socket) => (
        <mesh
          key={socket.polarity}
          position={socket.position}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.105, 0.105, 0.19, 20]} />
          <meshStandardMaterial
            color={
              socket.polarity === "positive"
                ? C.terminalPositive
                : C.terminalNegative
            }
          />
        </mesh>
      ))}
      <mesh position={SPARK_LAYOUT.pcb.position}>
        <boxGeometry args={[...SPARK_LAYOUT.pcb.size]} />
        <meshStandardMaterial color={C.pcb} roughness={0.52} />
      </mesh>
      <PartLabel visible={showLabels} position={[-1.4, 2.05, 0]}>
        脉冲电源盒 · 220 V
      </PartLabel>
      <PartLabel visible={showLabels} position={[0.8, 1.35, 0]}>
        墨粉纸盘与放电针
      </PartLabel>
    </group>
  );
}

export function TickerTimerRig3D({
  kind,
  powered,
  phase01,
  printQuality,
  displacementM,
  dots,
  showLabels,
}: TickerTimerRig3DProps) {
  return (
    <group data-rig-scene="ticker-timer">
      <color attach="background" args={[C.sky]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#ffffff", "#cbd4d4", 0.45]} />
      <directionalLight position={[6, 9, 7]} intensity={1.1} castShadow />
      <directionalLight
        position={[-5, 4, -4]}
        intensity={0.35}
        color={C.fillLight}
      />

      <mesh
        position={[0, -0.085, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 24]} />
        <shadowMaterial transparent opacity={0.14} />
      </mesh>

      {kind === "electromagnetic" ? (
        <ElectromagneticTimer
          powered={powered}
          phase01={phase01}
          showLabels={showLabels}
        />
      ) : (
        <SparkTimer
          powered={powered}
          phase01={phase01}
          showLabels={showLabels}
        />
      )}
      <PaperTape
        displacementM={displacementM}
        dots={dots}
        printQuality={printQuality}
      />
    </group>
  );
}
