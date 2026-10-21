import { SPARK_LAYOUT, sparkDiscRotationRad } from "./layout";
import { TICKER_CANDY as C } from "./palette";
import { PartLabel } from "./TickerTimerParts";

export function SparkTimer({
  powered,
  phase01,
  displacementM,
  showLabels,
}: {
  powered: boolean;
  phase01: number;
  displacementM: number;
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
      <mesh position={SPARK_LAYOUT.head.position} castShadow receiveShadow>
        <boxGeometry args={[...SPARK_LAYOUT.head.size]} />
        <meshStandardMaterial
          color={C.sparkHead}
          metalness={0.34}
          roughness={0.4}
        />
      </mesh>
      {SPARK_LAYOUT.framePosts.map((post, index) => (
        <mesh key={`spark-post-${index}`} position={post.position} castShadow>
          <boxGeometry args={[...post.size]} />
          <meshStandardMaterial
            color={C.sparkHead}
            metalness={0.48}
            roughness={0.36}
          />
        </mesh>
      ))}
      {SPARK_LAYOUT.frameRails.map((rail, index) => (
        <mesh key={`spark-rail-${index}`} position={rail.position} castShadow>
          <boxGeometry args={[...rail.size]} />
          <meshStandardMaterial
            color={C.sparkHead}
            metalness={0.48}
            roughness={0.36}
          />
        </mesh>
      ))}
      <group
        position={SPARK_LAYOUT.disc.position}
        rotation={[0, sparkDiscRotationRad(displacementM), 0]}
      >
        <mesh castShadow>
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
        <mesh position={[0, SPARK_LAYOUT.disc.thickness / 2 + 0.004, 0.24]}>
          <boxGeometry args={[0.07, 0.006, 0.12]} />
          <meshStandardMaterial color="#aaa4ad" roughness={0.7} />
        </mesh>
      </group>
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
      <PartLabel visible={showLabels} position={[1.7, 1.48, 0.45]}>
        墨粉纸盘（随纸带转动）
      </PartLabel>
    </group>
  );
}
