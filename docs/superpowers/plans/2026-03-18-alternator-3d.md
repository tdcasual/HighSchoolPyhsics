# 交流发电机3D模型重构 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inaccurate alternator 3D rig with a structurally accurate, visually polished model featuring arc-shaped magnetic poles, rotor iron core, rectangular coil, slip rings, brushes, bearing mounts, and external circuit.

**Architecture:** Rewrite `AlternatorRig3D.tsx` as a thin assembly shell that composes 7 focused sub-components under `components/`. The `AlternatorRig3DProps` interface (`angleRad`, `meterNeedleAngleRad`) stays unchanged — all upstream files (Scene, Controls, Chart, model, state hook) are untouched. Rotation axis changes from X to Z to match the new spatial layout.

**Tech Stack:** React Three Fiber, Three.js (ExtrudeGeometry, TubeGeometry, TorusGeometry, CatmullRomCurve3), @react-three/drei (Text), Vitest, TypeScript

---

## File Structure

```
src/scenes/alternator/
  AlternatorRig3D.tsx              — REWRITE: thin shell composing sub-components
  components/
    ArcMagnet.tsx                  — CREATE: arc-shaped pole + yoke, polarity prop
    RotorAssembly.tsx              — CREATE: iron core + coil + shaft + slip rings, angleRad prop
    Brushes.tsx                    — CREATE: carbon brushes + springs (fixed)
    BearingMount.tsx               — CREATE: bearing support stands (fixed)
    ExternalCircuit.tsx            — CREATE: wires + output meter, meterNeedleAngleRad prop
    FieldArrows.tsx                — CREATE: magnetic field visualization arrows
    CurrentIndicators.tsx          — CREATE: current direction arrows on coil edges
  rig.test.tsx                     — UPDATE: match new element names
```

Unchanged files: `model.ts`, `useAlternatorSceneState.ts`, `AlternatorControls.tsx`, `AlternatorChart.tsx`, `AlternatorScene.tsx`, `alternator.css`, `model.test.ts`, `AlternatorChart.test.tsx`, `useAlternatorSceneState.test.tsx`, `__tests__/*`

---

### Task 1: Create `components/ArcMagnet.tsx` — Arc-shaped magnetic pole

**Files:**
- Create: `src/scenes/alternator/components/ArcMagnet.tsx`

- [ ] **Step 1: Create the components directory and ArcMagnet file with pole shape builder**

Create `src/scenes/alternator/components/ArcMagnet.tsx`. The component receives `polarity: 'N' | 'S'` and `position`.

Build the arc-shaped pole face using `ExtrudeGeometry`:
- Create a `Shape` tracing a 120° arc cross-section (inner concave face radius ~1.3, wall thickness ~0.4)
- Extrude along Z with `depth` matching the pole depth (~1.2 units)
- Behind the arc, add a rectangular `boxGeometry` yoke/backplate (~1.7 x 2.6 x 1.6)

Materials:
- N pole: `color: '#8B1A1A'` (deep red), `metalness: 0.3, roughness: 0.6`
- S pole: `color: '#1A3C8B'` (deep blue), same metalness/roughness
- Yoke: `color: '#6B6B6B'`, `metalness: 0.4, roughness: 0.5`

Add a `<Text>` label ("N" or "S") on the front face, white, fontSize 0.5.

Name the group: `name={polarity === 'N' ? 'right-pole' : 'left-pole'}` (N on +X side, S on -X side).

```typescript
import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { Shape } from 'three'

type ArcMagnetProps = {
  polarity: 'N' | 'S'
  position: [number, number, number]
}

function buildArcShape(side: 'left' | 'right') {
  const dir = side === 'left' ? 1 : -1
  const shape = new Shape()
  const innerR = 1.3
  const outerR = 1.7
  const arcHalf = (120 * Math.PI) / 360 // 60 degrees half-angle
  const steps = 24

  // Inner arc (concave face)
  for (let i = 0; i <= steps; i++) {
    const angle = -arcHalf + (2 * arcHalf * i) / steps
    const x = innerR * Math.sin(angle) * dir
    const y = innerR * Math.cos(angle)
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  // Outer arc (back face)
  for (let i = steps; i >= 0; i--) {
    const angle = -arcHalf + (2 * arcHalf * i) / steps
    const x = outerR * Math.sin(angle) * dir
    const y = outerR * Math.cos(angle)
    shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

export function ArcMagnet({ polarity, position }: ArcMagnetProps) {
  const side = polarity === 'S' ? 'left' : 'right'
  const arcShape = useMemo(() => buildArcShape(side), [side])
  const poleColor = polarity === 'N' ? '#8B1A1A' : '#1A3C8B'
  const yokeOffsetX = polarity === 'N' ? 0.85 : -0.85

  return (
    <group
      name={polarity === 'N' ? 'right-pole' : 'left-pole'}
      position={position}
    >
      {/* Yoke / backplate */}
      <mesh position={[yokeOffsetX, 0, 0]}>
        <boxGeometry args={[1.7, 2.6, 1.6]} />
        <meshStandardMaterial
          color="#6B6B6B"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      {/* Arc-shaped pole face */}
      <mesh position={[0, 0, -0.6]}>
        <extrudeGeometry
          args={[arcShape, { depth: 1.2, bevelEnabled: false }]}
        />
        <meshStandardMaterial
          color={poleColor}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0, 0.92]}
        color="#f7f8fa"
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
      >
        {polarity}
      </Text>
    </group>
  )
}
```

- [ ] **Step 2: Verify ArcMagnet renders without errors**

Temporarily import `ArcMagnet` in the existing `AlternatorRig3D.tsx` alongside the old code, render one instance, run `npm run dev` and visually confirm the arc shape appears. Then remove the temporary import.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/alternator/components/ArcMagnet.tsx
git commit -m "feat(alternator): add ArcMagnet component with arc-shaped pole face and yoke"
```

---

### Task 2: Create `components/RotorAssembly.tsx` — Iron core + coil + shaft + slip rings

**Files:**
- Create: `src/scenes/alternator/components/RotorAssembly.tsx`

- [ ] **Step 1: Create RotorAssembly with iron core and shaft**

The component receives `angleRad: number`. The entire group rotates around Z axis by `angleRad`.

Iron core: cylinder along Z axis, radius ~0.85, length ~1.0, dark gray iron material.
Add lamination effect with 10 thin discs (cylinder slices with slight gaps).

Shaft: thin cylinder along Z axis, radius 0.06, extending from z=-3.5 to z=3.5 (through core, out both ends to bearing mounts). Silver metallic material.

```typescript
import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

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
        const z = -totalLength / 2 + sliceThickness / 2 + i * (sliceThickness + gap)
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.85, 0.85, sliceThickness, 24]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4} />
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
```

- [ ] **Step 2: Add rectangular coil with TubeGeometry**

Build the coil path as a rounded rectangle in the X-Y plane using `CatmullRomCurve3`. Coil dimensions: width ~2.2 (Y), depth ~1.06 (X). Use `TubeGeometry` with tube radius 0.055.

Add A/B/C/D vertex labels with `<Text>`. Lead-out wires from coil ends extending along Z toward the slip rings.

```typescript
function buildCoilPath() {
  const hw = 1.09
  const hd = 0.53
  const pts: [number, number, number][] = [
    [-hd, -hw, 0], [-hd, hw, 0],
    [hd, hw, 0], [hd, -hw, 0],
    [-hd, -hw, 0],
  ]
  return new CatmullRomCurve3(
    pts.map(([x, y, z]) => new Vector3(x, y, z)),
    true, 'catmullrom', 0.15
  )
}

function Coil() {
  const coilCurve = useMemo(() => buildCoilPath(), [])
  return (
    <group name="coil-loop">
      <mesh>
        <tubeGeometry args={[coilCurve, 80, 0.055, 12, true]} />
        <meshStandardMaterial color="#B87333" metalness={0.7} roughness={0.3} />
      </mesh>
      <Text position={[-0.53, -1.09, 0.15]} color="#fbfbfd" fontSize={0.12}
        anchorX="center" anchorY="middle" name="label-A">A</Text>
      <Text position={[-0.53, 1.09, 0.15]} color="#fbfbfd" fontSize={0.12}
        anchorX="center" anchorY="middle" name="label-B">B</Text>
      <Text position={[0.53, 1.09, 0.15]} color="#fbfbfd" fontSize={0.12}
        anchorX="center" anchorY="middle" name="label-C">C</Text>
      <Text position={[0.53, -1.09, 0.15]} color="#fbfbfd" fontSize={0.12}
        anchorX="center" anchorY="middle" name="label-D">D</Text>
    </group>
  )
}
```

- [ ] **Step 3: Add slip rings and assemble**

Two torus geometries at z=1.8 and z=2.1. Brass color. Named `slip-ring-front` and `slip-ring-back`. Export the assembled component. Note: the `CurrentIndicators` import will be added later in Task 8 (rewrite Rig3D) after Task 7 creates the component. For now, omit the `<CurrentIndicators>` line and add a `// TODO: add CurrentIndicators here after Task 7` comment.

```typescript
function SlipRings() {
  return (
    <group name="slip-rings">
      <mesh position={[0, 0, 1.8]} name="slip-ring-front">
        <torusGeometry args={[0.17, 0.04, 14, 30]} />
        <meshStandardMaterial color="#C5A03F" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 2.1]} name="slip-ring-back">
        <torusGeometry args={[0.17, 0.04, 14, 30]} />
        <meshStandardMaterial color="#C5A03F" metalness={0.8} roughness={0.2} />
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
```

- [ ] **Step 4: Commit**

```bash
git add src/scenes/alternator/components/RotorAssembly.tsx
git commit -m "feat(alternator): add RotorAssembly with iron core, coil, shaft, and slip rings"
```

---

### Task 3: Create `components/Brushes.tsx` — Carbon brushes + springs

**Files:**
- Create: `src/scenes/alternator/components/Brushes.tsx`

- [ ] **Step 1: Create Brushes component**

Two carbon brushes, fixed (not rotating). Each brush is a small box pressing against a slip ring from above/below. Add a spring helix on top of each brush using TubeGeometry along a helical curve.

Brush positions match slip ring Z positions (z=1.8 and z=2.1). One brush presses from +Y, the other from -Y.

```typescript
import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

function SpringHelix({ position, direction }: {
  position: [number, number, number]
  direction: 1 | -1
}) {
  const curve = useMemo(() => {
    const pts: Vector3[] = []
    const coils = 4
    const height = 0.3
    const radius = 0.05
    for (let i = 0; i <= coils * 20; i++) {
      const t = i / (coils * 20)
      const angle = t * coils * Math.PI * 2
      pts.push(new Vector3(
        radius * Math.cos(angle),
        t * height * direction,
        radius * Math.sin(angle)
      ))
    }
    return new CatmullRomCurve3(pts)
  }, [direction])

  return (
    <mesh position={position}>
      <tubeGeometry args={[curve, 64, 0.012, 6, false]} />
      <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
    </mesh>
  )
}

export function Brushes() {
  return (
    <group name="brushes">
      <group position={[0, 0.28, 1.8]}>
        <mesh name="brush-left">
          <boxGeometry args={[0.1, 0.3, 0.08]} />
          <meshStandardMaterial color="#333" metalness={0.1} roughness={0.8} />
        </mesh>
        <SpringHelix position={[0, 0.22, 0]} direction={1} />
      </group>
      <group position={[0, -0.28, 2.1]}>
        <mesh name="brush-right">
          <boxGeometry args={[0.1, 0.3, 0.08]} />
          <meshStandardMaterial color="#333" metalness={0.1} roughness={0.8} />
        </mesh>
        <SpringHelix position={[0, -0.22, 0]} direction={-1} />
      </group>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/alternator/components/Brushes.tsx
git commit -m "feat(alternator): add Brushes component with carbon brushes and springs"
```

---

### Task 4: Create `components/BearingMount.tsx` — Bearing support stands

**Files:**
- Create: `src/scenes/alternator/components/BearingMount.tsx`

- [ ] **Step 1: Create BearingMount component**

A simplified bearing stand: rectangular base + two uprights forming a U-bracket + top crossbar with a torus bearing ring.

```typescript
type BearingMountProps = {
  position: [number, number, number]
}

export function BearingMount({ position }: BearingMountProps) {
  return (
    <group name="bearing-mount" position={position}>
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.8]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[-0.25, -0.4, 0]}>
        <boxGeometry args={[0.12, 1.5, 0.5]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0.25, -0.4, 0]}>
        <boxGeometry args={[0.12, 1.5, 0.5]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.62, 0.2, 0.5]} />
        <meshStandardMaterial color="#555" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <torusGeometry args={[0.1, 0.03, 12, 24]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/alternator/components/BearingMount.tsx
git commit -m "feat(alternator): add BearingMount component"
```

---

### Task 5: Create `components/ExternalCircuit.tsx` — Wires + output meter

**Files:**
- Create: `src/scenes/alternator/components/ExternalCircuit.tsx`

- [ ] **Step 1: Create ExternalCircuit with lead wires and output meter**

Lead wires from brushes to the output meter using `CatmullRomCurve3` + `TubeGeometry`. Red wire from upper brush, blue wire from lower brush. Both converge at the output meter.

The output meter is migrated from the existing `SmallOutputMeter` internal component — a box with a dial face and rotating needle driven by `meterNeedleAngleRad`.

```typescript
import { Text } from '@react-three/drei/core/Text'
import { useMemo } from 'react'
import { CatmullRomCurve3, Vector3 } from 'three'

type ExternalCircuitProps = {
  meterNeedleAngleRad: number
}

function OutputMeter({ needleAngleRad }: { needleAngleRad: number }) {
  return (
    <group position={[0, 0, 4.2]} name="output-meter">
      <mesh>
        <boxGeometry args={[0.96, 1.24, 0.34]} />
        <meshStandardMaterial color="#a9521d" roughness={0.52} />
      </mesh>
      <mesh position={[0, 0.1, 0.18]}>
        <planeGeometry args={[0.62, 0.72]} />
        <meshBasicMaterial color="#f9eee2" />
      </mesh>
      <Text position={[0, -0.24, 0.19]} color="#61311a" fontSize={0.18}
        anchorX="center" anchorY="middle">A</Text>
      <group position={[0, 0.12, 0.19]} rotation={[0, 0, needleAngleRad * 0.9]}>
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

export function ExternalCircuit({ meterNeedleAngleRad }: ExternalCircuitProps) {
  const upperWire = useMemo(() => new CatmullRomCurve3([
    new Vector3(0, 0.28, 1.8),
    new Vector3(0, 0.6, 2.5),
    new Vector3(0, 0.6, 3.5),
    new Vector3(0, 0.4, 4.2),
  ]), [])

  const lowerWire = useMemo(() => new CatmullRomCurve3([
    new Vector3(0, -0.28, 2.1),
    new Vector3(0, -0.6, 2.8),
    new Vector3(0, -0.6, 3.5),
    new Vector3(0, -0.4, 4.2),
  ]), [])

  return (
    <group name="external-circuit">
      <mesh>
        <tubeGeometry args={[upperWire, 40, 0.028, 10, false]} />
        <meshStandardMaterial color="#cc3333" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh>
        <tubeGeometry args={[lowerWire, 40, 0.028, 10, false]} />
        <meshStandardMaterial color="#3355cc" metalness={0.5} roughness={0.3} />
      </mesh>
      <OutputMeter needleAngleRad={meterNeedleAngleRad} />
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/alternator/components/ExternalCircuit.tsx
git commit -m "feat(alternator): add ExternalCircuit with lead wires and output meter"
```

---

### Task 6: Create `components/FieldArrows.tsx` — Magnetic field visualization

**Files:**
- Create: `src/scenes/alternator/components/FieldArrows.tsx`

- [ ] **Step 1: Create FieldArrows component**

Array of arrows in the gap between magnetic poles, pointing from N (+X) to S (-X). Each arrow is a cylinder shaft + cone head. Semi-transparent cyan color.

Arrows arranged in a grid pattern in the Y-Z plane (e.g., 3 rows x 3 columns).

```typescript
function FieldArrow({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 2.0, 10]} />
        <meshBasicMaterial color="#7cd8ff" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, -1.1, 0]}>
        <coneGeometry args={[0.07, 0.2, 10]} />
        <meshBasicMaterial color="#7cd8ff" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export function FieldArrows() {
  const positions: [number, number, number][] = []
  for (const y of [-0.6, 0, 0.6]) {
    for (const z of [-0.3, 0, 0.3]) {
      positions.push([0, y, z])
    }
  }

  return (
    <group name="field-arrows">
      {positions.map((pos, i) => (
        <FieldArrow key={i} position={pos} />
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/alternator/components/FieldArrows.tsx
git commit -m "feat(alternator): add FieldArrows component for magnetic field visualization"
```

---

### Task 7: Create `components/CurrentIndicators.tsx` — Current direction arrows

**Files:**
- Create: `src/scenes/alternator/components/CurrentIndicators.tsx`

- [ ] **Step 1: Create CurrentIndicators component**

Small cone arrows on the AB and CD edges of the coil indicating instantaneous current direction. The direction flips based on `angleRad` — when `sin(angleRad) >= 0`, current flows A→B on the front edge; when negative, it reverses.

This component receives `angleRad` and renders inside the rotor-assembly group (so it rotates with the coil).

```typescript
type CurrentIndicatorsProps = {
  angleRad: number
}

export function CurrentIndicators({ angleRad }: CurrentIndicatorsProps) {
  const sinAngle = Math.sin(angleRad)
  const direction = sinAngle >= 0 ? 1 : -1
  const opacity = Math.min(Math.abs(sinAngle) * 2, 1)

  return (
    <group name="current-indicators">
      {/* Arrow on AB edge (front, -X side) */}
      <group position={[-0.53, 0, 0]} rotation={[0, 0, direction > 0 ? 0 : Math.PI]}>
        <mesh>
          <coneGeometry args={[0.06, 0.18, 8]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={opacity} />
        </mesh>
      </group>
      {/* Arrow on CD edge (back, +X side) */}
      <group position={[0.53, 0, 0]} rotation={[0, 0, direction > 0 ? Math.PI : 0]}>
        <mesh>
          <coneGeometry args={[0.06, 0.18, 8]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={opacity} />
        </mesh>
      </group>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/alternator/components/CurrentIndicators.tsx
git commit -m "feat(alternator): add CurrentIndicators for current direction visualization"
```

---

### Task 8: Rewrite `AlternatorRig3D.tsx` — Assemble all components

**Files:**
- Modify: `src/scenes/alternator/AlternatorRig3D.tsx` (full rewrite)

- [ ] **Step 1: Update RotorAssembly to import CurrentIndicators**

Now that Task 7 has created `CurrentIndicators.tsx`, update `RotorAssembly.tsx` to replace the TODO comment with the actual import and usage:

```typescript
// Add to imports in RotorAssembly.tsx:
import { CurrentIndicators } from './CurrentIndicators'
```

The `<CurrentIndicators angleRad={angleRad} />` line should already be in the JSX from Task 2's code template.

- [ ] **Step 2: Rewrite AlternatorRig3D as thin assembly shell**

Replace the entire file content. Import all 7 sub-components and compose them. Keep the same `AlternatorRig3DProps` interface. Set up lighting, background, and position all components according to the Z-axis layout.

```typescript
import { ArcMagnet } from './components/ArcMagnet'
import { BearingMount } from './components/BearingMount'
import { Brushes } from './components/Brushes'
import { ExternalCircuit } from './components/ExternalCircuit'
import { FieldArrows } from './components/FieldArrows'
import { RotorAssembly } from './components/RotorAssembly'

type AlternatorRig3DProps = {
  angleRad: number
  meterNeedleAngleRad: number
}

export function AlternatorRig3D({ angleRad, meterNeedleAngleRad }: AlternatorRig3DProps) {
  return (
    <group data-rig-scene="alternator">
      <ambientLight intensity={0.58} />
      <directionalLight position={[-3, 5, 6]} intensity={1.28} />
      <pointLight position={[2, 2.2, 4]} intensity={0.3} color="#ffffff" />
      <color attach="background" args={['#101317']} />

      {/* Fixed stator components */}
      <ArcMagnet polarity="S" position={[-2.5, 0, 0]} />
      <ArcMagnet polarity="N" position={[2.5, 0, 0]} />
      <BearingMount position={[0, 0, -2.5]} />
      <BearingMount position={[0, 0, 2.8]} />
      <FieldArrows />
      <Brushes />
      <ExternalCircuit meterNeedleAngleRad={meterNeedleAngleRad} />

      {/* Rotating rotor */}
      <RotorAssembly angleRad={angleRad} />
    </group>
  )
}
```

- [ ] **Step 3: Run dev server and visually verify**

Run `npm run dev`, navigate to the alternator scene, and verify:
- Two arc-shaped poles visible on left/right with N/S labels
- Rotor with iron core, coil, shaft rotates smoothly
- Slip rings rotate with rotor
- Brushes and springs are fixed
- Bearing mounts visible at both ends
- External circuit wires connect to output meter
- Field arrows visible between poles
- Current indicators on coil edges

- [ ] **Step 4: Commit**

```bash
git add src/scenes/alternator/AlternatorRig3D.tsx src/scenes/alternator/components/RotorAssembly.tsx
git commit -m "feat(alternator): rewrite Rig3D as assembly of accurate 3D sub-components"
```

---

### Task 9: Update `rig.test.tsx` — Match new element names

**Files:**
- Modify: `src/scenes/alternator/rig.test.tsx`

- [ ] **Step 1: Update test assertions to match new structure**

The existing tests check for named elements. Update to match the new component names while preserving the same test intent.

Key name mappings:
- `left-pole` / `right-pole` — same names, still present
- `coil-loop` — same name, inside RotorAssembly
- `rotor-assembly` — same name
- `rotor-axle-right` → `shaft` (now a single continuous shaft)
- `brush-left` / `brush-right` — same names
- `slip-ring-front` / `slip-ring-back` — same names
- `label-A/B/C/D` — same names
- Remove check for `center-shaft-through-loop` (no longer relevant — shaft runs along Z, not through the coil plane)

```typescript
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@react-three/drei/core/Text', () => ({
  Text: ({
    children,
    anchorX,
    anchorY,
    ...props
  }: {
    children: ReactNode
    anchorX?: unknown
    anchorY?: unknown
  }) => {
    void anchorX
    void anchorY
    return <group {...props}>{children}</group>
  },
}))

import { AlternatorRig3D } from './AlternatorRig3D'

describe('AlternatorRig3D', () => {
  it('renders poles, coil labels, brushes, and shaft', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} />
      </svg>,
    )

    expect(container.querySelector('[name="left-pole"]')).toBeInTheDocument()
    expect(container.querySelector('[name="right-pole"]')).toBeInTheDocument()
    expect(container.querySelector('[name="coil-loop"]')).toBeInTheDocument()
    expect(container.querySelector('[name="shaft"]')).toBeInTheDocument()
    expect(container.querySelector('[name="brush-left"]')).toBeInTheDocument()
    expect(container.querySelector('[name="brush-right"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-A"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-B"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-C"]')).toBeInTheDocument()
    expect(container.querySelector('[name="label-D"]')).toBeInTheDocument()
  })

  it('keeps the coil, slip rings, and shaft inside one rotating rotor assembly', () => {
    const { container } = render(
      <svg>
        <AlternatorRig3D angleRad={0} meterNeedleAngleRad={0} />
      </svg>,
    )

    const rotorAssembly = container.querySelector('[name="rotor-assembly"]')
    expect(rotorAssembly).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="coil-loop"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="slip-ring-front"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="slip-ring-back"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="shaft"]')).toBeInTheDocument()
    expect(rotorAssembly?.querySelector('[name="iron-core"]')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npm test -- src/scenes/alternator/rig.test.tsx`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/alternator/rig.test.tsx
git commit -m "test(alternator): update rig tests for new 3D component structure"
```

---

### Task 10: Run full test suite and visual polish

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass. Fix any failures.

- [ ] **Step 2: Visual polish pass**

Run `npm run dev` and review the scene carefully:
- Adjust component positions if parts overlap or have gaps
- Tune material colors/metalness/roughness for visual consistency
- Verify camera angle in `AlternatorScene.tsx` — may need to adjust `position` and `target` to frame the new layout well
- Ensure the scene looks good in both default and classroom/presentation modes

- [ ] **Step 3: Commit any adjustments**

```bash
git add -A
git commit -m "fix(alternator): visual polish and position adjustments for 3D rig"
```
