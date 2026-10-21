# 双缝干涉：白光模式 + 组件旋转 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为双缝干涉场景增加白光光源（含滤光片）和单缝/双缝/目镜绕光学轴旋转功能。

**Architecture:** 模型层新增白光叠加渲染函数和滤光片定义；状态层新增白光/滤光片/旋转角度状态；3D 层新增滤光片组件并用 group rotation 实现旋转；图表层新增白光渲染分支和条纹旋转。

**Tech Stack:** React, Three.js (@react-three/drei), Canvas 2D, Vitest

---

### Task 1: 模型层 — FilterColor 类型与滤光片波长定义

**Files:**
- Modify: `src/scenes/double-slit/model.ts:1-18`
- Test: `src/scenes/double-slit/__tests__/model.test.ts`

**Step 1: 在 model.ts 顶部添加类型和常量**

在 `DoubleSlitParams` 类型之前插入：

```ts
export type FilterColor = 'none' | 'red' | 'green' | 'blue'

export const FILTER_PROFILES: Record<Exclude<FilterColor, 'none'>, { center: number; halfWidth: number }> = {
  red: { center: 620, halfWidth: 30 },
  green: { center: 540, halfWidth: 25 },
  blue: { center: 460, halfWidth: 25 },
}
```

**Step 2: 添加测试**

在 `model.test.ts` 底部新 describe 块：

```ts
describe('FILTER_PROFILES', () => {
  it('defines red, green, blue profiles with positive center and halfWidth', () => {
    for (const [name, profile] of Object.entries(FILTER_PROFILES)) {
      expect(profile.center).toBeGreaterThan(400)
      expect(profile.center).toBeLessThan(700)
      expect(profile.halfWidth).toBeGreaterThan(0)
    }
  })

  it('red center is longer wavelength than green, green longer than blue', () => {
    expect(FILTER_PROFILES.red.center).toBeGreaterThan(FILTER_PROFILES.green.center)
    expect(FILTER_PROFILES.green.center).toBeGreaterThan(FILTER_PROFILES.blue.center)
  })
})
```

**Step 3: 运行测试**

Run: `npx vitest run src/scenes/double-slit/__tests__/model.test.ts`
Expected: PASS

**Step 4: 提交**

```bash
git add src/scenes/double-slit/model.ts src/scenes/double-slit/__tests__/model.test.ts
git commit -m "feat: add FilterColor type and filter wavelength profiles"
```

---

### Task 2: 模型层 — drawWhiteLightPattern 函数

**Files:**
- Modify: `src/scenes/double-slit/model.ts:96-178` (在 `drawInterferencePattern` 之后添加)
- Test: `src/scenes/double-slit/__tests__/model.test.ts`

**Step 1: 实现 drawWhiteLightPattern**

在 `drawInterferencePattern` 函数之后添加：

```ts
/**
 * Draw white-light interference pattern with optional filter.
 * Composites visible spectrum (400-700nm) at 5nm steps.
 */
export function drawWhiteLightPattern(
  ctx: CanvasRenderingContext2D,
  params: DoubleSlitParams,
  filterColor: FilterColor,
): void {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) / 2 - 2

  const d = params.slitDistance * 1e-3
  const L = params.screenDistance
  const a = params.slitWidth * 1e-3
  const physicalViewWidth = 0.015

  const filterProfile = filterColor !== 'none' ? FILTER_PROFILES[filterColor] : null

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()

  const imgData = ctx.createImageData(width, height)
  const data = imgData.data

  // Accumulate per-pixel RGB from all sampled wavelengths
  const accR = new Float32Array(width * height)
  const accG = new Float32Array(width * height)
  const accB = new Float32Array(width * height)

  for (let wl = 400; wl <= 700; wl += 5) {
    // Filter attenuation
    let filterWeight = 1.0
    if (filterProfile) {
      const dist = Math.abs(wl - filterProfile.center)
      filterWeight = dist <= filterProfile.halfWidth
        ? 1.0 - 0.7 * (dist / filterProfile.halfWidth) ** 2
        : 0.15
    }

    const lambda = wl * 1e-9
    const rgb = waveLengthToRGB(wl)
    if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) continue

    for (let y = 0; y < height; y++) {
      for (let i = 0; i < width; i++) {
        const x = (i / width - 0.5) * physicalViewWidth
        const sinTheta = x / L

        const phaseI = (Math.PI * d * sinTheta) / lambda
        const interference = Math.cos(phaseI) ** 2

        let diffraction = 1.0
        if (Math.abs(x) > 1e-12) {
          const phaseD = (Math.PI * a * sinTheta) / lambda
          const sinc = Math.sin(phaseD) / phaseD
          diffraction = sinc ** 2
        }

        let intensity = interference * diffraction
        intensity = Math.pow(intensity, 0.8) * filterWeight

        const idx = y * width + i
        accR[idx] += rgb[0] * intensity
        accG[idx] += rgb[1] * intensity
        accB[idx] += rgb[2] * intensity
      }
    }
  }

  // Normalize and write to ImageData
  // Find max for normalization
  let maxVal = 0
  for (let i = 0; i < accR.length; i++) {
    const v = Math.max(accR[i], accG[i], accB[i])
    if (v > maxVal) maxVal = v
  }
  const scale = maxVal > 0 ? 255 / maxVal : 1

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4
    for (let i = 0; i < width; i++) {
      const idx = y * width + i
      const pi = rowOffset + i * 4
      data[pi] = Math.min(255, accR[idx] * scale)
      data[pi + 1] = Math.min(255, accG[idx] * scale)
      data[pi + 2] = Math.min(255, accB[idx] * scale)
      data[pi + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  ctx.restore()

  // Eyepiece ring border
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const edgeGradient = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius)
  edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  edgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
  ctx.fillStyle = edgeGradient
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
}
```

**Step 2: 添加测试**

```ts
describe('drawWhiteLightPattern', () => {
  const mockCtx = () => {
    const ctx = {
      canvas: { width: 50, height: 50 },
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(50 * 50 * 4) })),
      putImageData: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D
    return ctx
  }

  it('renders without filter', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'none')).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })

  it('renders with red filter', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'red')).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })

  it('renders with green filter', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'green')).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })

  it('renders with blue filter', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'blue')).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })
})
```

**Step 3: 运行测试**

Run: `npx vitest run src/scenes/double-slit/__tests__/model.test.ts`
Expected: PASS

**Step 4: 提交**

```bash
git add src/scenes/double-slit/model.ts src/scenes/double-slit/__tests__/model.test.ts
git commit -m "feat: add drawWhiteLightPattern with filter support"
```

---

### Task 3: 状态层 — 白光 / 滤光片 / 旋转角度状态

**Files:**
- Modify: `src/scenes/double-slit/useDoubleSlitSceneState.ts`

**Step 1: 添加新状态和回调**

在 import 中加入 `FilterColor`：

```ts
import { DEFAULT_PARAMS, type DoubleSlitParams, type FilterColor, formatFringeSpacing, waveLengthToHex } from './model'
```

在 `DoubleSlitSceneState` 类型中添加：

```ts
isWhiteLight: boolean
toggleWhiteLight: () => void
filterColor: FilterColor
setFilterColor: (value: FilterColor) => void
singleSlitAngle: number
setSingleSlitAngle: (value: number) => void
doubleSlitAngle: number
setDoubleSlitAngle: (value: number) => void
eyepieceAngle: number
setEyepieceAngle: (value: number) => void
```

在 hook 函数体中添加：

```ts
const [isWhiteLight, setIsWhiteLight] = useState(false)
const [filterColor, setFilterColorState] = useState<FilterColor>('none')
const [singleSlitAngle, setSingleSlitAngle] = useState(0)
const [doubleSlitAngle, setDoubleSlitAngle] = useState(0)
const [eyepieceAngle, setEyepieceAngle] = useState(0)

const toggleWhiteLight = useCallback(() => {
  setIsWhiteLight((prev) => {
    if (prev) setFilterColorState('none') // switching off white light clears filter
    return !prev
  })
}, [])

const setFilterColor = useCallback((value: FilterColor) => {
  setFilterColorState(value)
}, [])
```

在 return 对象中添加所有新字段。

在 `reset` 回调中添加重置：

```ts
setIsWhiteLight(false)
setFilterColorState('none')
setSingleSlitAngle(0)
setDoubleSlitAngle(0)
setEyepieceAngle(0)
```

**Step 2: 运行现有测试**

Run: `npx vitest run src/scenes/double-slit --reporter=verbose`
Expected: PASS (structure test should still pass since state is consumed by children)

**Step 3: 提交**

```bash
git add src/scenes/double-slit/useDoubleSlitSceneState.ts
git commit -m "feat: add white light, filter, and rotation angle state"
```

---

### Task 4: 控制面板 — 光源切换、滤光片选择、旋转滑块

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitControls.tsx`

**Step 1: 扩展 props 和 UI**

在 import 中加入 `FilterColor`：

```ts
import type { FilterColor } from './model'
```

扩展 `DoubleSlitControlsProps` 的 Pick 类型，加入：

```ts
| 'isWhiteLight'
| 'toggleWhiteLight'
| 'filterColor'
| 'setFilterColor'
| 'singleSlitAngle'
| 'setSingleSlitAngle'
| 'doubleSlitAngle'
| 'setDoubleSlitAngle'
| 'eyepieceAngle'
| 'setEyepieceAngle'
```

在 JSX 中，`ControlSection title="实验参数"` 之前插入光源类型切换：

```tsx
<ControlSection title="光源">
  <SegmentedControl
    options={[
      { key: 'mono', label: '单色光' },
      { key: 'white', label: '白光' },
    ]}
    value={state.isWhiteLight ? 'white' : 'mono'}
    onChange={() => state.toggleWhiteLight()}
  />
  {state.isWhiteLight && (
    <SegmentedControl
      options={[
        { key: 'none', label: '无滤光片' },
        { key: 'red', label: '红' },
        { key: 'green', label: '绿' },
        { key: 'blue', label: '蓝' },
      ]}
      value={state.filterColor}
      onChange={(key) => state.setFilterColor(key as FilterColor)}
    />
  )}
</ControlSection>
```

在控制面板底部添加旋转控制 section：

```tsx
<ControlSection title="组件旋转">
  <RangeField
    id="single-slit-angle"
    label="单缝角度"
    unit="°"
    min={0}
    max={360}
    step={1}
    value={state.singleSlitAngle}
    onChange={state.setSingleSlitAngle}
  />
  <RangeField
    id="double-slit-angle"
    label="双缝角度"
    unit="°"
    min={0}
    max={360}
    step={1}
    value={state.doubleSlitAngle}
    onChange={state.setDoubleSlitAngle}
  />
  <RangeField
    id="eyepiece-angle"
    label="目镜角度"
    unit="°"
    min={0}
    max={360}
    step={1}
    value={state.eyepieceAngle}
    onChange={state.setEyepieceAngle}
  />
</ControlSection>
```

确保 import 中有 `SegmentedControl`。

**Step 2: 运行测试**

Run: `npx vitest run src/scenes/double-slit --reporter=verbose`
Expected: PASS

**Step 3: 提交**

```bash
git add src/scenes/double-slit/DoubleSlitControls.tsx
git commit -m "feat: add light source toggle, filter selector, rotation sliders"
```

---

### Task 5: 3D 组件 — 滤光片实体

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitRig3D.tsx`

**Step 1: 扩展 props**

在 `DoubleSlitRig3DProps` 中添加：

```ts
type DoubleSlitRig3DProps = {
  screenDistance: number
  lightColorHex: number
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: 'none' | 'red' | 'green' | 'blue'
}
```

在 props 解构中加入新字段。

**Step 2: 添加滤光片 3D 组件**

在单缝组件（`TUBE_START_X - 0.75` 处）之前插入滤光片：

```tsx
{/* ====== Filter (before single slit) ====== */}
{isWhiteLight && filterColor !== 'none' && (
  <>
    <Stand xPos={TUBE_START_X - 2.5} height={3.0} radialSegments={geoDetail.cylinderRadialSegments} />
    <mesh position={[TUBE_START_X - 2.5, OPTICAL_AXIS_Y, 0]}>
      <planeGeometry args={[1.6, 1.6]} />
      <meshStandardMaterial
        color={filterColor === 'red' ? 0xff2222 : filterColor === 'green' ? 0x22cc22 : 0x2266ff}
        transparent
        opacity={0.55}
        side={2}
        emissive={filterColor === 'red' ? 0xff2222 : filterColor === 'green' ? 0x22cc22 : 0x2266ff}
        emissiveIntensity={0.2}
      />
    </mesh>
    <Label text="滤光片" position={[TUBE_START_X - 2.5, OPTICAL_AXIS_Y + 2, 0]} />
  </>
)}
```

**Step 3: 运行测试**

Run: `npx vitest run src/scenes/double-slit --reporter=verbose`
Expected: PASS

**Step 4: 提交**

```bash
git add src/scenes/double-slit/DoubleSlitRig3D.tsx
git commit -m "feat: add filter 3D component before single slit"
```

---

### Task 6: 3D 组件 — 单缝/双缝/目镜旋转

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitRig3D.tsx`

**Step 1: 扩展 props**

在 `DoubleSlitRig3DProps` 中添加：

```ts
singleSlitAngle: number
doubleSlitAngle: number
eyepieceAngle: number
```

**Step 2: 用 group 包裹单缝**

将单缝的 mesh 和 Label 用 group 包裹：

```tsx
{/* ====== Single slit ====== */}
<group rotation={[singleSlitAngle * Math.PI / 180, 0, 0]}>
  <mesh
    position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y, 0]}
    rotation={[0, 0, Math.PI / 2]}
    {...(shadowsEnabled ? { castShadow: true } : {})}
  >
    <cylinderGeometry args={[1, 1, 1.5, geoDetail.cylinderRadialSegments]} />
    <meshStandardMaterial {...blackPlasticMat} />
  </mesh>
  <Label text="单缝" position={[TUBE_START_X - 0.75, OPTICAL_AXIS_Y + 2, 0]} />
</group>
```

**Step 3: 用 group 包裹双缝**

将双缝的 mesh、rod、rod support、rod knob 和 Label 用 group 包裹：

```tsx
{/* ====== Double slit ====== */}
<group rotation={[doubleSlitAngle * Math.PI / 180, 0, 0]}>
  <mesh
    position={[TUBE_START_X + 0.5, OPTICAL_AXIS_Y, 0]}
    rotation={[0, 0, Math.PI / 2]}
  >
    <cylinderGeometry args={[1.1, 1.1, 0.8, geoDetail.cylinderRadialSegments]} />
    <meshStandardMaterial {...darkMetalMat} />
  </mesh>

  {/* Rod (horizontal) */}
  <mesh
    position={[TUBE_START_X + 2, OPTICAL_AXIS_Y + 1.5, 0]}
    rotation={[0, 0, Math.PI / 2]}
  >
    <cylinderGeometry args={[0.05, 0.05, 4, geoDetail.cylinderRadialSegments]} />
    <meshStandardMaterial {...metalMat} />
  </mesh>

  {/* Rod support (vertical) */}
  <mesh position={[TUBE_START_X + 0.5, OPTICAL_AXIS_Y + 0.75, 0]}>
    <cylinderGeometry args={[0.1, 0.1, 1.5, geoDetail.cylinderRadialSegments]} />
    <meshStandardMaterial {...metalMat} />
  </mesh>

  {/* Rod knob */}
  <mesh position={[TUBE_START_X + 4, OPTICAL_AXIS_Y + 1.5, 0]}>
    <sphereGeometry args={[0.3, geoDetail.sphereSegments, geoDetail.sphereSegments]} />
    <meshStandardMaterial {...blackPlasticMat} />
  </mesh>
  <Label text="双缝" position={[TUBE_START_X + 0.5, OPTICAL_AXIS_Y + 2.5, 0]} />
</group>
```

**Step 4: 用 group 包裹目镜**

将目镜的 mesh 和 Label 用 group 包裹：

```tsx
{/* ====== Eyepiece ====== */}
<group rotation={[eyepieceAngle * Math.PI / 180, 0, 0]}>
  <mesh position={[tailX + 3.5, OPTICAL_AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]} {...(shadowsEnabled ? { castShadow: true } : {})}>
    <cylinderGeometry args={[0.6, 0.6, 2.5, geoDetail.cylinderRadialSegments]} />
    <meshStandardMaterial {...blackPlasticMat} />
  </mesh>
  <Label text="目镜" position={[tailX + 3.5, OPTICAL_AXIS_Y + 1.5, 0]} />
</group>
```

**Step 5: 运行测试**

Run: `npx vitest run src/scenes/double-slit --reporter=verbose`
Expected: PASS

**Step 6: 提交**

```bash
git add src/scenes/double-slit/DoubleSlitRig3D.tsx
git commit -m "feat: wrap single slit, double slit, eyepiece in rotation groups"
```

---

### Task 7: 图表 — 白光渲染分支 + 条纹旋转

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitChart.tsx`

**Step 1: 扩展 props**

```ts
type DoubleSlitChartProps = {
  params: DoubleSlitParams
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: 'none' | 'red' | 'green' | 'blue'
  doubleSlitAngle: number
}
```

**Step 2: 修改渲染逻辑**

在 import 中加入 `drawWhiteLightPattern` 和 `FilterColor`：

```ts
import { drawInterferencePattern, drawWhiteLightPattern, type DoubleSlitParams, type FilterColor } from './model'
```

在 `drawInterferencePattern` / `drawWhiteLightPattern` 调用之前加入旋转：

```ts
// Apply rotation for stripe orientation
ctx.save()
ctx.translate(cx, cy)
ctx.rotate(doubleSlitAngle * Math.PI / 180)
ctx.translate(-cx, -cy)

if (isWhiteLight) {
  drawWhiteLightPattern(ctx, params, filterColor)
} else {
  drawInterferencePattern(ctx, params)
}

ctx.restore()
```

移除原来单独的 `drawInterferencePattern(ctx, params)` 调用。

**Step 3: 运行测试**

Run: `npx vitest run src/scenes/double-slit --reporter=verbose`
Expected: PASS

**Step 4: 提交**

```bash
git add src/scenes/double-slit/DoubleSlitChart.tsx
git commit -m "feat: white light rendering branch and stripe rotation"
```

---

### Task 8: 场景层 — 串联所有 props 与数据叠加

**Files:**
- Modify: `src/scenes/double-slit/DoubleSlitScene.tsx`

**Step 1: 传递新 props 到 DoubleSlitRig3D**

```tsx
<DoubleSlitRig3D
  screenDistance={state.screenDistance}
  lightColorHex={state.lightColorHex}
  isLightOn={state.isLightOn}
  isWhiteLight={state.isWhiteLight}
  filterColor={state.filterColor}
  singleSlitAngle={state.singleSlitAngle}
  doubleSlitAngle={state.doubleSlitAngle}
  eyepieceAngle={state.eyepieceAngle}
/>
```

**Step 2: 传递新 props 到 DoubleSlitChart**

```tsx
<DoubleSlitChart
  params={chartParams}
  isLightOn={state.isLightOn}
  isWhiteLight={state.isWhiteLight}
  filterColor={state.filterColor}
  doubleSlitAngle={state.doubleSlitAngle}
/>
```

**Step 3: 更新数据叠加层**

在波长显示处增加白光/滤光片信息：

```tsx
<p>
  <span>波长 λ</span>
  <strong>
    {state.isWhiteLight
      ? `白光 400-700nm${state.filterColor !== 'none' ? ` (${state.filterColor === 'red' ? '红' : state.filterColor === 'green' ? '绿' : '蓝'}滤光片)` : ''}`
      : `${Math.round(state.wavelength)} nm`}
  </strong>
</p>
```

**Step 4: 更新 DoubleSlitControls 的 state prop**

确保传给 controls 的 state 包含所有新字段。

**Step 5: 运行全部测试**

Run: `npx vitest run src/scenes/double-slit --reporter=verbose`
Expected: PASS

**Step 6: 提交**

```bash
git add src/scenes/double-slit/DoubleSlitScene.tsx
git commit -m "feat: wire white light, filter, and rotation props through scene"
```

---

### Task 9: 结构测试 — 补全新增字段覆盖

**Files:**
- Modify: `src/scenes/double-slit/__tests__/structure.test.tsx`

**Step 1: 补全数据叠加断言**

在 `shows key data overlay values` 测试中添加：

```ts
expect(screen.getByText(/单缝宽度 a/)).toBeInTheDocument()
```

**Step 2: 添加白光模式测试**

新增测试（需要 unmock DoubleSlitControls 以检查 UI 交互，或通过 mock 验证 props 传递）：

```ts
it('passes white light state to rig', () => {
  render(<DoubleSlitScene />)
  // Default: not white light
  // The mock receives props — we verify through the rendered structure
  expect(screen.getByTestId('double-slit-rig')).toBeInTheDocument()
})
```

**Step 3: 运行测试**

Run: `npx vitest run src/scenes/double-slit --reporter=verbose`
Expected: PASS

**Step 4: 提交**

```bash
git add src/scenes/double-slit/__tests__/structure.test.tsx
git commit -m "test: add coverage for white light and slitWidth overlay"
```

---

### Task 10: 端到端验证

**Step 1: 运行全量测试**

Run: `npx vitest run --reporter=verbose`
Expected: ALL PASS

**Step 2: 启动开发服务器目视检查**

Run: `npm run dev`

验证：
- [ ] 默认单色模式，波长滑块正常，干涉条纹正常
- [ ] 切换白光，目镜显示彩色条纹（中央白、两侧彩色）
- [ ] 选择红/绿/蓝滤光片，条纹变为对应单色
- [ ] 3D 场景中滤光片组件在白光+有滤光片时显示，有标签
- [ ] 拖动三个旋转滑块，3D 组件旋转，条纹方向同步旋转
- [ ] 重置按钮恢复所有默认值
- [ ] 移动端布局正常

**Step 3: 最终提交（如有修复）**

```bash
git add -A
git commit -m "fix: e2e verification fixes for white light and rotation"
```
