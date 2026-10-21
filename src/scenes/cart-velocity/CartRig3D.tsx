import { CatmullRomCurve3, DoubleSide, Quaternion, Vector3 } from 'three'
import type { CartSkin } from './pose'
import { HOOK, PULLEY_RADIUS, PULLEY_X, TIMER_STRIKER_X, TIMER_X, type CartPose } from './pose'
import { SceneBackdrop } from '../../scene3d/SceneBackdrop'
import { NO_FIT } from '../../scene3d/FitBounds'
import { SceneLabel } from '../../scene3d/SceneLabel'

function stringSegment(a: [number, number, number], b: [number, number, number], color: string) {
  const direction = new Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const length = Math.max(direction.length(), 1e-3)
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize())
  return (
    <mesh
      position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]}
      quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}
      castShadow
    >
      <cylinderGeometry args={[0.01, 0.01, length, 8]} />
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  )
}

function box({
  name,
  size,
  position,
  color,
  metalness = 0,
  roughness = 0.62,
  visible = true,
}: {
  name?: string
  size: [number, number, number]
  position: [number, number, number]
  color: string
  metalness?: number
  roughness?: number
  visible?: boolean
}) {
  return (
    <mesh name={name} position={position} visible={visible} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

function wheel(position: [number, number, number], rotation: number) {
  return (
    <group name="cart-wheel" position={position} rotation={[0, 0, rotation]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 20]} />
        <meshStandardMaterial color="#354d49" metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.088, 0.088, 0.115, 16]} />
        <meshStandardMaterial color="#a1b5aa" metalness={0.45} roughness={0.38} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh key={index} rotation={[0, 0, (index * Math.PI) / 3]}>
          <boxGeometry args={[0.14, 0.017, 0.13]} />
          <meshStandardMaterial color="#d9e2d2" metalness={0.5} roughness={0.62} />
        </mesh>
      ))}
    </group>
  )
}

export function CartRig3D({ pose, skin, night = false }: { pose: CartPose; skin: CartSkin; night?: boolean }) {
  const hook: [number, number, number] = [pose.cartX + HOOK.x, 0.14 + HOOK.y, 0]
  const pulleyTop: [number, number, number] = [PULLEY_X, pose.pulleyY + PULLEY_RADIUS, 0]
  const weight: [number, number, number] = [PULLEY_X + PULLEY_RADIUS, pose.weightY, 0]
  const pulleyArc = new CatmullRomCurve3([
    new Vector3(PULLEY_X, pose.pulleyY + PULLEY_RADIUS, 0),
    new Vector3(PULLEY_X + PULLEY_RADIUS * Math.SQRT1_2, pose.pulleyY + PULLEY_RADIUS * Math.SQRT1_2, 0),
    new Vector3(PULLEY_X + PULLEY_RADIUS, pose.pulleyY, 0),
  ])
  const body = skin === 'panda' ? '#e4e6d7' : skin === 'rocket' ? '#7a99ac' : '#43816d'
  const postDelta = pose.pulleyY - 0.116
  const postHeight = Math.max(0.05, Math.abs(postDelta))
  const postCenterY = 0.116 + postDelta / 2
  return (
    <>
      <SceneBackdrop day="#edf1ed" fog={[23, 55]} />
      <hemisphereLight args={['#ffffff', '#8f9c85', 2.3]} />
      <directionalLight
        position={[-4, 10, 7]}
        intensity={3.4}
        color="#fff8e8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[6, 5, -5]} intensity={1.3} color="#e9f5ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]} receiveShadow userData={NO_FIT}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={night ? '#262d34' : '#e9eee8'} />
      </mesh>
      {box({ size: [10.55, 0.08, 4.5], position: [-0.375, -0.345, 0.24], color: '#f3f2e8' })}
      {[[-3.95, -0.45], [-3.95, 0.45], [3.95, -0.45], [3.95, 0.45]].map(([x, z]) => (
        <group key={`${x}-${z}`} visible={pose.trackVisible}>
          {box({ size: [0.34, 0.66, 0.37], position: [x, 0.03, z], color: '#9cae9a', metalness: 0.4 })}
        </group>
      ))}
      <group position={[0, 0.47, 0]}>
        {box({ size: [9.7, 0.22, 1.25], position: [0, 0, 0], color: '#b99b72', visible: pose.trackVisible })}
        {box({ size: [9.5, 0.045, 0.055], position: [0, 0.152, -0.52], color: '#a7bab4', metalness: 0.8, visible: pose.trackVisible })}
        {box({ size: [9.5, 0.045, 0.055], position: [0, 0.152, 0.52], color: '#a7bab4', metalness: 0.8, visible: pose.trackVisible })}
        {pose.cartVisible ? (
          <group name="cart" position={[pose.cartX, 0.14, 0]}>
            {box({ size: [1.08, 0.12, 0.66], position: [0, 0.26, 0], color: '#c0c9bd', metalness: 0.5 })}
            {box({ name: 'cart-body', size: [0.99, 0.24, 0.66], position: [0, 0.42, 0], color: body, metalness: 0.3 })}
            {wheel([-0.35, 0.15, -0.41], pose.wheelRotation)}
            {wheel([0.35, 0.15, -0.41], pose.wheelRotation)}
            {wheel([-0.35, 0.15, 0.41], pose.wheelRotation)}
            {wheel([0.35, 0.15, 0.41], pose.wheelRotation)}
            {box({ size: [0.13, 0.13, 0.72], position: [0.53, 0.29, 0], color: '#a4b6ac', metalness: 0.4 })}
            {box({ size: [0.12, 0.12, 0.72], position: [-0.53, 0.29, 0], color: '#a4b6ac', metalness: 0.4 })}
            <SceneLabel position={[0, 1.27, 0]} className="cart-rig-label--cart">实验小车</SceneLabel>
            {skin === 'classic' ? (
              <group name="skin-classic">
                {box({ size: [0.58, 0.22, 0.42], position: [0, 0.65, 0], color: '#a7bbb1', metalness: 0.7 })}
                {box({ size: [0.44, 0.025, 0.28], position: [0, 0.775, 0], color: '#e1e7d4', metalness: 0.5 })}
              </group>
            ) : null}
            {skin === 'panda' ? (
              <group name="skin-panda">
                <mesh position={[0.02, 0.79, 0]}>
                  <sphereGeometry args={[0.3, 20, 16]} />
                  <meshStandardMaterial color="#faf8ea" />
                </mesh>
                {[-0.23, 0.23].map((z) => (
                  <mesh key={`ear-${z}`} position={[-0.04, 1.01, z]}>
                    <sphereGeometry args={[0.11, 16, 12]} />
                    <meshStandardMaterial color="#30403d" />
                  </mesh>
                ))}
                {[-0.115, 0.115].map((z) => (
                  <group key={`eye-${z}`}>
                    <mesh position={[0.277, 0.83, z]} scale={[1, 1.25, 1]}>
                      <sphereGeometry args={[0.075, 14, 12]} />
                      <meshStandardMaterial color="#30403d" />
                    </mesh>
                    <mesh position={[0.337, 0.852, z + 0.011]}>
                      <sphereGeometry args={[0.022, 10, 10]} />
                      <meshStandardMaterial color="#ffffff" />
                    </mesh>
                  </group>
                ))}
                <mesh position={[0.324, 0.74, 0]}>
                  <sphereGeometry args={[0.045, 12, 12]} />
                  <meshStandardMaterial color="#30403d" />
                </mesh>
              </group>
            ) : null}
            {skin === 'rocket' ? (
              <group name="skin-rocket">
                <mesh position={[0, 0.72, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <cylinderGeometry args={[0.16, 0.16, 0.67, 16]} />
                  <meshStandardMaterial color="#edf1df" />
                </mesh>
                <mesh position={[0.45, 0.72, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <cylinderGeometry args={[0, 0.16, 0.24, 16]} />
                  <meshStandardMaterial color="#c8794d" />
                </mesh>
                <mesh position={[-0.42, 0.72, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <cylinderGeometry args={[0.1, 0.12, 0.15, 12]} />
                  <meshStandardMaterial color="#718c88" />
                </mesh>
                {[-0.19, 0.19].map((z) => (
                  <mesh key={`fin-${z}`} position={[-0.21, 0.58, z]} rotation={[0, 0, -0.3]}>
                    <boxGeometry args={[0.29, 0.06, 0.19]} />
                    <meshStandardMaterial color="#c8794d" />
                  </mesh>
                ))}
              </group>
            ) : null}
          </group>
        ) : null}
        {pose.timerVisible ? (
          <group name="timer" position={[TIMER_X, 0.13, 0]}>
            {box({ size: [0.9, 0.19, 0.83], position: [0, 0.11, 0], color: '#77958f', metalness: 0.25 })}
            <group name="timer-coil" position={[0.02, 0.29, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.36, 16]} />
                <meshStandardMaterial color="#b97848" metalness={0.48} roughness={0.5} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.39, 12]} />
                <meshStandardMaterial color="#8d9c97" metalness={0.7} roughness={0.35} />
              </mesh>
            </group>
            <SceneLabel position={[0, 0.9, -0.2]} className="cart-rig-label--timer">电磁打点计时器</SceneLabel>
            <mesh name="striker" position={[TIMER_STRIKER_X - TIMER_X, pose.strikerY, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.24, 10]} />
              <meshStandardMaterial color="#566c64" metalness={0.45} roughness={0.38} />
            </mesh>
          </group>
        ) : null}
        {pose.tapeVisible ? (
          <group name="tape-strip">
            <mesh name="tape" position={[pose.tapeX, 0.45, 0]} scale={[Math.max(pose.tapeLength, 0.02), 1, 1]}>
              <boxGeometry args={[1, 0.014, 0.15]} />
              <meshStandardMaterial color="#f5edd0" />
            </mesh>
            <SceneLabel position={[pose.tapeX, 0.62, -0.18]} className="cart-rig-label--tape">运动纸带</SceneLabel>
            {box({ size: [0.9, 0.014, 0.15], position: [TIMER_X - 0.45, 0.45, 0], color: '#eee4bd' })}
            {pose.dots.map((dot, index) => (
              <mesh key={index} name="tape-dot" position={[dot.x, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={dot.count ? 1.4 : 1}>
                <circleGeometry args={[0.012, 12]} />
                <meshBasicMaterial color={dot.count ? '#c17a48' : '#516450'} side={DoubleSide} />
              </mesh>
            ))}
          </group>
        ) : null}
        {pose.pulleyVisible ? (
          <group name="pulley">
            {box({ size: [0.22, 0.34, 1.05], position: [4.9, -0.03, 0], color: '#8fa39b', metalness: 0.35 })}
            <mesh name="pulley-post" position={[PULLEY_X - 0.1, postCenterY, -0.16]} scale={[1, postHeight, 1]}>
              <cylinderGeometry args={[0.03, 0.03, 1, 12]} />
              <meshStandardMaterial color="#aebdb8" metalness={0.45} roughness={0.38} />
            </mesh>
            <group name="pulley-wheel" position={[PULLEY_X, pose.pulleyY, 0]} rotation={[0, 0, pose.pulleyRotation]}>
              <mesh castShadow>
                <torusGeometry args={[PULLEY_RADIUS - 0.012, 0.018, 10, 24]} />
                <meshStandardMaterial color="#c9a15e" metalness={0.6} roughness={0.35} />
              </mesh>
              {[0, 1, 2].map((index) => (
                <mesh key={index} name="pulley-spoke" position={[0, 0, 0.004]} rotation={[0, 0, index * Math.PI / 3]}>
                  <boxGeometry args={[PULLEY_RADIUS * 1.7, 0.014, 0.012]} />
                  <meshStandardMaterial color="#899a91" metalness={0.6} roughness={0.42} />
                </mesh>
              ))}
              <mesh name="pulley-hub" rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.12, 12]} />
                <meshStandardMaterial color="#71827b" metalness={0.72} roughness={0.36} />
              </mesh>
            </group>
            <SceneLabel position={[PULLEY_X, pose.pulleyY + 0.45, 0]} className="cart-rig-label--pulley">
              {pose.discCount > 0 ? '定滑轮与钩码' : '定滑轮'}
            </SceneLabel>
            {pose.ropeVisible ? (
              <>
                <group name="hook-weight" position={weight}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <mesh key={index} name="hook-disc" visible={index < pose.discCount} position={[0, -0.29 - index * 0.055, 0]}>
                      <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
                      <meshStandardMaterial color="#98a4aa" metalness={0.75} roughness={0.35} />
                    </mesh>
                  ))}
                </group>
                {stringSegment(hook, pulleyTop, '#7a5a33')}
                <mesh name="pulley-wrap-rope">
                  <tubeGeometry args={[pulleyArc, 12, 0.01, 6, false]} />
                  <meshStandardMaterial color="#7a5a33" roughness={0.75} />
                </mesh>
                {stringSegment([PULLEY_X + PULLEY_RADIUS, pose.pulleyY, 0], weight, '#7a5a33')}
                {pose.guideVisible ? (
                  <mesh name="string-guide" position={[(hook[0] + PULLEY_X) / 2, hook[1], 0]}>
                    <boxGeometry args={[Math.max(0.01, PULLEY_X - hook[0]), 0.008, 0.008]} />
                    <meshBasicMaterial color="#d0543a" />
                  </mesh>
                ) : null}
              </>
            ) : null}
          </group>
        ) : null}
        {pose.arrowVisible ? (
          <group name="velocity-arrow" position={[pose.cartX, 1.35, 0]}>
            <mesh position={[(pose.arrowLength - 0.18) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, Math.max(pose.arrowLength - 0.18, 0.02), 6]} />
              <meshBasicMaterial color="#bb7845" />
            </mesh>
            <mesh position={[pose.arrowLength - 0.09, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.05, 0.18, 8]} />
              <meshBasicMaterial color="#bb7845" />
            </mesh>
          </group>
        ) : null}
      </group>
      {pose.powerVisible ? (
        <group name="power" position={[-3.25, -0.03, 1.58]}>
          {box({ size: [1.5, 0.55, 1.02], position: [0, 0, 0], color: '#94a995', metalness: 0.15 })}
          <SceneLabel position={[0, 0.6, 0]} className="cart-rig-label--power">低压交流电源</SceneLabel>
        </group>
      ) : null}
      {pose.powerVisible && pose.timerVisible ? [-1, 1].map((side) => {
        const curve = new CatmullRomCurve3([
          new Vector3(-3.25 + side * 0.3, 0.01, 1.98),
          new Vector3(-4.4 + side * 0.35, -0.27, 2.13),
          new Vector3(-4.87 + side * 0.2, -0.28, 0.88),
          new Vector3(-3.95 + side * 0.25, 0.82, 0.42),
        ])
        return (
          <mesh key={side} name="supply-wire">
            <tubeGeometry args={[curve, 40, 0.017, 8, false]} />
            <meshStandardMaterial color={side === 1 ? '#b96e52' : '#516f84'} roughness={0.55} />
          </mesh>
        )
      }) : null}
    </>
  )
}
