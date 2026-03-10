# Motional EMF Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增 `motional-emf` 场景，用 3D 实验台 + 三矢量讲解 + 中零式电压表演示导体棒切割磁感线，并满足课堂模式摘要与 1080P 可读性要求。

**Architecture:** 先把物理计算收敛到纯函数 `U_signed = (v × B) · L`，再用状态 hook 把参数、动画相位和展示文本组织起来，最后组装控制区、3D 视图和课堂模式摘要。3D 几何布局保持“可讲清”的固定坐标系，电压表外观复用 `induction-current` 场景的表头语言，但改成中零式双向偏转。

**Tech Stack:** TypeScript, React, Vite, Vitest, Testing Library, React Three Fiber, Three.js

---

## 执行规则

- 全程遵循 `@test-driven-development`：先写失败测试，再做最小实现。
- 完成前遵循 `@verification-before-completion`：只基于真实命令输出宣称成功。
- 不引入自由 3D 方向控制；速度方向严格限制为预设常见方向/夹角。
- `SceneLayout`、`presentationSignals`、`coreSummary`、`data-presentation-signal` 必须与课堂模式契约保持一致。
- 电压表的盒体、白盘、刻度、红针、红黑接线柱视觉语言参考 `src/scenes/induction-current/InductionCurrentRig3D.tsx`，不要重新发明一套完全不同的仪表风格。

## 0. 执行前准备（一次性）

### Task 0: 建立隔离工作区与基线

**Files:**
- None

**Step 1: 新建 worktree 与分支**

Run:
```bash
git worktree add ../HighSchoolPyhsics-motional-emf -b codex/motional-emf
```
Expected: 新目录 `../HighSchoolPyhsics-motional-emf` 创建成功，分支带 `codex/` 前缀。

**Step 2: 安装依赖**

Run:
```bash
cd ../HighSchoolPyhsics-motional-emf
npm ci
```
Expected: 依赖安装成功，无 lockfile 改动。

**Step 3: 记录基线**

Run:
```bash
npm test -- src/app/__tests__/demoRouteConformance.test.ts
npm run lint
```
Expected: PASS；作为后续注册新场景前的对照基线。

**Step 4: Commit（可选空提交）**

```bash
git commit --allow-empty -m "chore(plan): start motional emf implementation"
```

---

## 1. 纯物理模型

### Task 1: 实现 `model.ts` 的向量与感应电压计算

**Files:**
- Create: `src/scenes/motional-emf/model.ts`
- Create: `src/scenes/motional-emf/model.test.ts`

**Step 1: 写失败测试（默认正交态与常见夹角）**

在 `src/scenes/motional-emf/model.test.ts` 覆盖以下行为：

```ts
import { describe, expect, it } from 'vitest'
import { deriveMotionalEmfReadings } from './model'

describe('motional-emf model', () => {
  it('returns B*v*L for the default orthogonal arrangement', () => {
    const result = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'forward',
    })

    expect(result.signedVoltageV).toBeCloseTo(1)
  })

  it('returns zero when velocity is parallel to magnetic field', () => {
    const result = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 90,
      velocityPreset: 'up',
    })

    expect(result.signedVoltageV).toBeCloseTo(0)
  })

  it('reduces magnitude for 30/45/60 degree velocity presets', () => {
    const thirty = deriveMotionalEmfReadings({ magneticFieldT: 1, rodLengthM: 1, speedMps: 1, rodAngleDeg: 90, velocityPreset: 'angle-30' })
    const fortyFive = deriveMotionalEmfReadings({ magneticFieldT: 1, rodLengthM: 1, speedMps: 1, rodAngleDeg: 90, velocityPreset: 'angle-45' })
    const sixty = deriveMotionalEmfReadings({ magneticFieldT: 1, rodLengthM: 1, speedMps: 1, rodAngleDeg: 90, velocityPreset: 'angle-60' })

    expect(Math.abs(thirty.signedVoltageV)).toBeLessThan(Math.abs(fortyFive.signedVoltageV))
    expect(Math.abs(fortyFive.signedVoltageV)).toBeLessThan(Math.abs(sixty.signedVoltageV))
  })

  it('flips sign when motion reverses along the rail', () => {
    const forward = deriveMotionalEmfReadings({ magneticFieldT: 1, rodLengthM: 0.5, speedMps: 2, rodAngleDeg: 90, velocityPreset: 'forward' })
    const backward = deriveMotionalEmfReadings({ magneticFieldT: 1, rodLengthM: 0.5, speedMps: 2, rodAngleDeg: 90, velocityPreset: 'backward' })

    expect(forward.signedVoltageV).toBeCloseTo(-backward.signedVoltageV)
  })

  it('returns zero when the rod is perpendicular to v cross B', () => {
    const result = deriveMotionalEmfReadings({
      magneticFieldT: 1,
      rodLengthM: 0.5,
      speedMps: 2,
      rodAngleDeg: 0,
      velocityPreset: 'forward',
    })

    expect(result.signedVoltageV).toBeCloseTo(0)
  })
})
```

**Step 2: 运行测试确认失败**

Run:
```bash
npm test -- src/scenes/motional-emf/model.test.ts
```
Expected: FAIL，提示模块或导出尚不存在。

**Step 3: 写最小实现**

在 `src/scenes/motional-emf/model.ts` 实现：

```ts
export type VelocityPreset = 'forward' | 'backward' | 'up' | 'down' | 'angle-30' | 'angle-45' | 'angle-60'

export function deriveMotionalEmfReadings(config: MotionalEmfConfig): MotionalEmfReadings {
  const magneticField = resolveMagneticFieldVector(config.magneticFieldT)
  const velocity = scale(resolveVelocityDirection(config.velocityPreset), config.speedMps)
  const rod = scale(resolveRodDirection(config.rodAngleDeg), config.rodLengthM)
  const signedVoltageV = dot(cross(velocity, magneticField), rod)

  return {
    signedVoltageV,
    voltageMagnitudeV: Math.abs(signedVoltageV),
    effectiveCuttingRatio: config.magneticFieldT * config.rodLengthM * config.speedMps === 0
      ? 0
      : Math.abs(signedVoltageV) / (config.magneticFieldT * config.rodLengthM * config.speedMps),
  }
}
```

实现范围保持纯函数化，不要引入 React 或 `three` 依赖。使用本地 `Vec3` 工具函数即可，可参考 `src/scenes/oersted/vectorMath.ts` 的风格但不要提取共享 util，避免过度抽象。

**Step 4: 运行测试确认通过**

Run:
```bash
npm test -- src/scenes/motional-emf/model.test.ts
```
Expected: PASS。

**Step 5: Commit**

```bash
git add src/scenes/motional-emf/model.ts src/scenes/motional-emf/model.test.ts
git commit -m "feat(motional-emf): add motional emf vector model"
```

---

## 2. 场景状态 hook

### Task 2: 实现 `useMotionalEmfSceneState.ts`

**Files:**
- Create: `src/scenes/motional-emf/useMotionalEmfSceneState.ts`
- Create: `src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx`
- Modify: `src/scenes/motional-emf/model.ts`

**Step 1: 写失败测试（默认值、极性、重置）**

在 `src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx` 覆盖：

```ts
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMotionalEmfSceneState } from './useMotionalEmfSceneState'

describe('useMotionalEmfSceneState', () => {
  it('starts in the classroom default orthogonal state', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    expect(result.current.magneticFieldT).toBe(1)
    expect(result.current.rodLengthM).toBe(0.5)
    expect(result.current.speedMps).toBe(2)
    expect(result.current.rodAngleDeg).toBe(90)
    expect(result.current.velocityPreset).toBe('forward')
    expect(result.current.signedVoltageV).toBeCloseTo(1)
  })

  it('updates polarity when velocity preset reverses', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    act(() => {
      result.current.setVelocityPreset('backward')
    })

    expect(result.current.signedVoltageV).toBeLessThan(0)
    expect(result.current.polarityText).toMatch(/B 端高电势|A 端高电势/)
  })

  it('resets animation and parameters to defaults', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    act(() => {
      result.current.setMagneticFieldT(1.8)
      result.current.setRodAngleDeg(45)
      result.current.toggleRunning()
      result.current.reset()
    })

    expect(result.current.running).toBe(false)
    expect(result.current.magneticFieldT).toBe(1)
    expect(result.current.rodAngleDeg).toBe(90)
    expect(result.current.velocityPreset).toBe('forward')
  })
})
```

**Step 2: 运行测试确认失败**

Run:
```bash
npm test -- src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx
```
Expected: FAIL。

**Step 3: 写最小实现**

在 `src/scenes/motional-emf/useMotionalEmfSceneState.ts` 实现：

```ts
export function useMotionalEmfSceneState(): MotionalEmfSceneState {
  const [magneticFieldT, setMagneticFieldT] = useState(1)
  const [rodLengthM, setRodLengthM] = useState(0.5)
  const [speedMps, setSpeedMps] = useState(2)
  const [rodAngleDeg, setRodAngleDeg] = useState(90)
  const [velocityPreset, setVelocityPreset] = useState<VelocityPreset>('forward')
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)

  const readings = useMemo(() => deriveMotionalEmfReadings({ magneticFieldT, rodLengthM, speedMps, rodAngleDeg, velocityPreset }), [magneticFieldT, rodLengthM, speedMps, rodAngleDeg, velocityPreset])
  const needleAngleRad = clamp(readings.signedVoltageV / MAX_DISPLAY_VOLTAGE, -1, 1) * (Math.PI / 3)
  const polarityText = formatPolarityText(readings.signedVoltageV)
  const relationText = formatRelationText({ rodAngleDeg, velocityPreset })

  // running 时驱动导体棒往返相位；暂停时保持 demand 渲染
}
```

确保 hook 暴露：
- 所有滑块/按钮的值与 setter
- `running`、`toggleRunning()`、`reset()`
- `phase`
- `signedVoltageV`、`voltageMagnitudeV`
- `needleAngleRad`
- `polarityText`、`relationText`
- `velocityPresetLabel`

**Step 4: 运行测试确认通过**

Run:
```bash
npm test -- src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx src/scenes/motional-emf/model.test.ts
```
Expected: PASS。

**Step 5: Commit**

```bash
git add src/scenes/motional-emf/useMotionalEmfSceneState.ts src/scenes/motional-emf/useMotionalEmfSceneState.test.tsx src/scenes/motional-emf/model.ts
git commit -m "feat(motional-emf): add scene state hook and derived readouts"
```

---

## 3. 控制区与数值读数

### Task 3: 实现 `MotionalEmfControls.tsx`

**Files:**
- Create: `src/scenes/motional-emf/MotionalEmfControls.tsx`
- Create: `src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx`
- Create: `src/scenes/motional-emf/motional-emf.css`

**Step 1: 写失败测试（控件与读数卡）**

在 `src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx` 覆盖：

```ts
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MotionalEmfControls } from '../MotionalEmfControls'

describe('MotionalEmfControls', () => {
  it('renders sliders, preset buttons, and the voltage readout card', () => {
    render(
      <MotionalEmfControls
        magneticFieldT={1}
        onMagneticFieldChange={() => undefined}
        rodLengthM={0.5}
        onRodLengthChange={() => undefined}
        speedMps={2}
        onSpeedChange={() => undefined}
        rodAngleDeg={90}
        onRodAngleChange={() => undefined}
        velocityPreset="forward"
        onVelocityPresetChange={() => undefined}
        running={false}
        onToggleRunning={() => undefined}
        onReset={() => undefined}
        signedVoltageV={1}
        polarityText="A 端高电势"
        relationText="B ⟂ v，L ∥ (v × B)"
      />,
    )

    expect(screen.getByRole('heading', { name: '切割磁感线实验控制' })).toBeInTheDocument()
    expect(screen.getByLabelText('磁场 B (T)')).toHaveValue('1')
    expect(screen.getByLabelText('导体棒长度 L (m)')).toHaveValue('0.5')
    expect(screen.getByText('两端电压 U_AB')).toBeInTheDocument()
    expect(screen.getByTestId('motional-emf-voltage-display')).toHaveTextContent('1.00 V')
    expect(screen.getByRole('button', { name: '前进（标准切割）' })).toBeInTheDocument()
  })

  it('emits callbacks for sliders, presets, and actions', () => {
    const onSpeedChange = vi.fn()
    const onVelocityPresetChange = vi.fn()
    const onToggleRunning = vi.fn()

    render(/* 同上，替换回调为 spy */)

    fireEvent.change(screen.getByLabelText('速度 v (m/s)'), { target: { value: '3.5' } })
    fireEvent.click(screen.getByRole('button', { name: '与 B 成 45°' }))
    fireEvent.click(screen.getByRole('button', { name: '播放' }))

    expect(onSpeedChange).toHaveBeenCalledWith(3.5)
    expect(onVelocityPresetChange).toHaveBeenCalledWith('angle-45')
    expect(onToggleRunning).toHaveBeenCalled()
  })
})
```

**Step 2: 运行测试确认失败**

Run:
```bash
npm test -- src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx
```
Expected: FAIL。

**Step 3: 写最小实现**

在 `src/scenes/motional-emf/MotionalEmfControls.tsx`：
- 复用 `RangeField` 和 `SceneActions`
- 提供 4 个滑块：`B`、`L`、`v`、`导体棒与磁场夹角`
- 提供预设按钮组：`前进（标准切割）`、`后退（反向切割）`、`向上（∥B）`、`向下（反向∥B）`、`与 B 成 30°`、`与 B 成 45°`、`与 B 成 60°`
- 增加读数卡：`两端电压 U_AB`、极性、关系文本
- 给关键读数块添加 `data-presentation-signal="live-metric interactive-readout"`
- 给电压数值节点加 `data-testid="motional-emf-voltage-display"`

在 `src/scenes/motional-emf/motional-emf.css` 最小实现：
- 电压卡片 `.motional-emf-voltage-card`
- 预设按钮组 `.motional-emf-preset-grid`
- 课堂可读字号和高对比配色

**Step 4: 运行测试确认通过**

Run:
```bash
npm test -- src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx
```
Expected: PASS。

**Step 5: Commit**

```bash
git add src/scenes/motional-emf/MotionalEmfControls.tsx src/scenes/motional-emf/__tests__/MotionalEmfControls.test.tsx src/scenes/motional-emf/motional-emf.css
git commit -m "feat(motional-emf): add controls and classroom readout card"
```

---

## 4. 场景注册与基本壳层

### Task 4: 注册新场景并搭建 `MotionalEmfScene.tsx`

**Files:**
- Create: `src/scenes/motional-emf/MotionalEmfScene.tsx`
- Create: `src/scenes/motional-emf/MotionalEmfRig3D.tsx`
- Create: `src/scenes/motional-emf/__tests__/structure.test.tsx`
- Modify: `config/demo-scenes.json`

**Step 1: 写失败测试（页面可渲染并接线状态）**

在 `src/scenes/motional-emf/__tests__/structure.test.tsx` 覆盖：

```ts
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MotionalEmfScene } from '../MotionalEmfScene'

describe('motional-emf structure', () => {
  it('renders core controls and updates voltage when presets change', async () => {
    render(<MotionalEmfScene />)

    expect(await screen.findByText('切割磁感线实验控制')).toBeInTheDocument()
    const display = await screen.findByTestId('motional-emf-voltage-display')
    expect(display).toHaveTextContent('1.00 V')

    fireEvent.click(screen.getByRole('button', { name: '向上（∥B）' }))
    expect(await screen.findByTestId('motional-emf-voltage-display')).toHaveTextContent('0.00 V')
  })
})
```

**Step 2: 运行测试确认失败**

Run:
```bash
npm test -- src/scenes/motional-emf/__tests__/structure.test.tsx
```
Expected: FAIL。

**Step 3: 注册路由与最小场景实现**

1. 在 `config/demo-scenes.json` 添加条目：

```json
{
  "pageId": "motional-emf",
  "label": "导体棒切割磁感线",
  "meta": {
    "tag": "电磁感应",
    "summary": "B、v、L 三向量关系与感应电压联动",
    "highlights": [
      "中零式电压表偏转",
      "常见夹角预设对比"
    ],
    "tone": "mhd"
  },
  "touchProfile": {
    "pageScroll": "vertical-outside-canvas",
    "canvasGestureScope": "interactive-canvas",
    "minTouchTargetPx": 44,
    "gestureMatrix": {
      "singleFingerRotate": true,
      "twoFingerZoom": true,
      "twoFingerPan": true
    }
  },
  "classroom": {
    "presentationSignals": ["live-metric", "interactive-readout"],
    "coreSummaryLineCount": 4,
    "sceneKind": "process",
    "smartPresentation": {
      "layout": "never",
      "focus": false,
      "stickySummary": false
    }
  },
  "playwright": {
    "readyText": "切割磁感线实验控制",
    "screenshotName": "motional-emf"
  }
}
```

2. 在 `src/scenes/motional-emf/MotionalEmfScene.tsx` 组装：
- `SceneLayout`
- `presentationSignals={['live-metric', 'interactive-readout']}`
- `coreSummary` 先用最小 4 行摘要
- `InteractiveCanvas`
- `MotionalEmfControls`
- `MotionalEmfRig3D`

3. 在 `src/scenes/motional-emf/MotionalEmfRig3D.tsx` 先放最小占位几何（导轨、导体棒、表头位置），只要场景可渲染，不必一次做完全部视觉细节。

**Step 4: 运行场景与路由测试**

Run:
```bash
npm test -- src/scenes/motional-emf/__tests__/structure.test.tsx src/app/__tests__/demoRouteConformance.test.ts
```
Expected: PASS，且 `demoRouteConformance` 不报缺失场景、缺失 `presentationSignals` 或课堂元数据错误。

**Step 5: Commit**

```bash
git add config/demo-scenes.json src/scenes/motional-emf/MotionalEmfScene.tsx src/scenes/motional-emf/MotionalEmfRig3D.tsx src/scenes/motional-emf/__tests__/structure.test.tsx
git commit -m "feat(motional-emf): register scene shell and route metadata"
```

---

## 5. 3D 布局与中零式电压表

### Task 5: 用可测试布局常量完善 `MotionalEmfRig3D.tsx`

**Files:**
- Create: `src/scenes/motional-emf/layout.ts`
- Create: `src/scenes/motional-emf/layout.test.ts`
- Modify: `src/scenes/motional-emf/MotionalEmfRig3D.tsx`
- Modify: `src/scenes/motional-emf/model.ts`

**Step 1: 写失败测试（布局约束）**

在 `src/scenes/motional-emf/layout.test.ts` 覆盖：

```ts
import { describe, expect, it } from 'vitest'
import { MOTIONAL_EMF_LAYOUT } from './layout'

describe('motional-emf layout', () => {
  it('keeps the rod endpoints aligned with the two rails', () => {
    expect(MOTIONAL_EMF_LAYOUT.rod.leftContact[0]).toBeCloseTo(MOTIONAL_EMF_LAYOUT.rails.leftX)
    expect(MOTIONAL_EMF_LAYOUT.rod.rightContact[0]).toBeCloseTo(MOTIONAL_EMF_LAYOUT.rails.rightX)
  })

  it('starts meter wires from the rod contact points', () => {
    expect(MOTIONAL_EMF_LAYOUT.wires.aLead[0]).toEqual(MOTIONAL_EMF_LAYOUT.rod.leftContact)
    expect(MOTIONAL_EMF_LAYOUT.wires.bLead[0]).toEqual(MOTIONAL_EMF_LAYOUT.rod.rightContact)
  })

  it('places the voltmeter outside the rail sweep area', () => {
    expect(MOTIONAL_EMF_LAYOUT.meter.center[2]).toBeGreaterThan(MOTIONAL_EMF_LAYOUT.rails.maxTravelZ)
  })
})
```

**Step 2: 运行测试确认失败**

Run:
```bash
npm test -- src/scenes/motional-emf/layout.test.ts
```
Expected: FAIL。

**Step 3: 实现布局常量与完整 Rig**

1. 在 `src/scenes/motional-emf/layout.ts` 固化：
- 两条导轨位置
- 导体棒接触点
- 表头位置
- 导线路径关键点
- 三矢量锚点
- 磁场区域范围

2. 在 `src/scenes/motional-emf/MotionalEmfRig3D.tsx` 实现：
- 导轨 + 导体棒沿轨道往返运动
- 半透明磁场区与磁感线箭头
- `B` / `v` / `L` 三根彩色矢量
- 中零式电压表（借鉴 `src/scenes/induction-current/InductionCurrentRig3D.tsx` 的盒体、表盘、刻度、红针、接线柱）
- 指针角度受 `needleAngleRad` 驱动，正负方向可见
- 导体棒两端标记 `A`、`B`

**Step 4: 运行测试确认通过**

Run:
```bash
npm test -- src/scenes/motional-emf/layout.test.ts src/scenes/motional-emf/model.test.ts
```
Expected: PASS。

**Step 5: Commit**

```bash
git add src/scenes/motional-emf/layout.ts src/scenes/motional-emf/layout.test.ts src/scenes/motional-emf/MotionalEmfRig3D.tsx src/scenes/motional-emf/model.ts
git commit -m "feat(motional-emf): add testable rig layout and center-zero voltmeter"
```

---

## 6. 课堂模式与摘要保底

### Task 6: 补齐 `coreSummary` 与课堂模式测试

**Files:**
- Create: `src/scenes/motional-emf/__tests__/classroomMode.test.tsx`
- Modify: `src/scenes/motional-emf/MotionalEmfScene.tsx`
- Modify: `src/scenes/motional-emf/MotionalEmfControls.tsx`
- Modify: `src/scenes/motional-emf/motional-emf.css`

**Step 1: 写失败测试（控制区折叠后摘要仍可见）**

在 `src/scenes/motional-emf/__tests__/classroomMode.test.tsx` 覆盖：

```ts
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { MotionalEmfScene } from '../MotionalEmfScene'

describe('motional-emf classroom mode', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1366 })
    window.history.replaceState(null, '', '/motional-emf')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/motional-emf': 'viewport' },
      activeScenePath: '/motional-emf',
    })
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
    useAppStore.setState({ presentationMode: false, presentationRouteModes: {}, activeScenePath: '/' })
  })

  it('keeps the core summary visible and exposes presentation signal markers', async () => {
    render(<MotionalEmfScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/电压 U_AB:/)).toBeInTheDocument()
    expect(within(summary).getByText(/速度方向:/)).toBeInTheDocument()

    const signalNode = document.querySelector('.motional-emf-voltage-card[data-presentation-signal~="live-metric"][data-presentation-signal~="interactive-readout"]')
    expect(signalNode).toBeInTheDocument()
  })
})
```

**Step 2: 运行测试确认失败**

Run:
```bash
npm test -- src/scenes/motional-emf/__tests__/classroomMode.test.tsx
```
Expected: FAIL。

**Step 3: 写最小实现**

1. 在 `src/scenes/motional-emf/MotionalEmfScene.tsx` 中把 `coreSummary` 固定成 4 行：
   - `电压 U_AB`
   - `极性 / 指针方向`
   - `B-v-L 方向关系`
   - `速度方向 / 当前夹角`
2. 确保 `MotionalEmfControls.tsx` 的关键信息块保留 `data-presentation-signal`
3. 在 `src/scenes/motional-emf/motional-emf.css` 中放大课堂模式下的标题、读数和按钮字号，保证 1080P 可读

**Step 4: 运行测试确认通过**

Run:
```bash
npm test -- src/scenes/motional-emf/__tests__/classroomMode.test.tsx src/scenes/motional-emf/__tests__/structure.test.tsx
```
Expected: PASS。

**Step 5: Commit**

```bash
git add src/scenes/motional-emf/__tests__/classroomMode.test.tsx src/scenes/motional-emf/MotionalEmfScene.tsx src/scenes/motional-emf/MotionalEmfControls.tsx src/scenes/motional-emf/motional-emf.css
git commit -m "feat(motional-emf): add classroom summary fallback and presentation signals"
```

---

## 7. 全链路验证与收尾

### Task 7: 做最终验证并检查课堂展示质量

**Files:**
- Modify only if verification exposes real defects

**Step 1: 运行场景聚焦测试**

Run:
```bash
npm test -- src/scenes/motional-emf src/app/__tests__/demoRouteConformance.test.ts
```
Expected: PASS。

**Step 2: 运行静态检查与构建**

Run:
```bash
npm run lint
npm run build
```
Expected: PASS。

**Step 3: 运行课堂展示回归**

Run:
```bash
npm run test:1080p-presentation
```
Expected: PASS；新场景在课堂模式下控制区折叠后仍能看到核心摘要，3D 区与读数保持高对比。

**Step 4: 运行导航/路由回归（可选但推荐）**

Run:
```bash
npm run test:roundtrip
```
Expected: PASS；导航页能进入 `导体棒切割磁感线` 场景且返回不回归。

**Step 5: 最终 Commit**

```bash
git add config/demo-scenes.json src/scenes/motional-emf docs/plans/2026-03-09-motional-emf-design.md docs/plans/2026-03-09-motional-emf-implementation-plan.md
git commit -m "feat(motional-emf): add classroom-ready motional emf scene"
```

---

## 实施顺序摘要

1. 先锁定纯物理模型，避免 3D 视效和数学逻辑互相污染。
2. 再接状态 hook，把参数、动画和读数统一到一个来源。
3. 然后做控制区与场景壳层，让场景尽早可运行。
4. 接着用布局常量驱动 3D Rig，保证导轨、导体棒、电压表和导线位置可测试。
5. 最后补课堂模式与全链路验证，确保“不依赖展开隐藏面板”这一底线被覆盖到测试里。

## 风险与防漂移提醒

- 风险 1：把“导体棒角度”解释成任意空间姿态，导致课堂讲解复杂度失控。解决：只允许围绕实验台约定轴做离散角度变化。
- 风险 2：3D 表头太花，弱化教学信息。解决：保持表头为结果输出，不要加多余装饰与二次交互。
- 风险 3：只在 3D 表头显示结果，忘了功能区数值。解决：`MotionalEmfControls.test.tsx` 和 `classroomMode.test.tsx` 都强制检查数值读数卡。
- 风险 4：课堂模式下只剩 3D 没有摘要。解决：把 `coreSummary` 测试作为独立任务，不放到最后顺手修。
