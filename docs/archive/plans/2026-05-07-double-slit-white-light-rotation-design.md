# 双缝干涉：白光模式 + 组件旋转

## 概述

为双缝干涉场景增加两个功能：
1. 白光光源模式（含可选滤光片），目镜中显示物理级彩色干涉条纹
2. 单缝、双缝、目镜三个组件可绕光学轴（X 轴）独立旋转

## 一、白光模式

### 模型层 (`model.ts`)

- 新增类型 `FilterColor = 'none' | 'red' | 'green' | 'blue'`
- 滤光片波长定义：`FILTER_PROFILES`，每个定义中心波长和带宽
  - red: 620nm ± 30nm
  - green: 540nm ± 25nm
  - blue: 460nm ± 25nm
- 新增 `drawWhiteLightPattern(ctx, params, filterColor)`：对 400~700nm 可见光每 5nm 采样，叠加干涉+衍射强度。滤光片带外波长不参与叠加。结果映射到 RGB 像素
- 现有 `drawInterferencePattern` 保留（单色模式）

### 状态层 (`useDoubleSlitSceneState.ts`)

- 新增 `isWhiteLight: boolean`、`toggleWhiteLight()`
- 新增 `filterColor: FilterColor`、`setFilterColor()`
- 切回单色模式时 `filterColor` 重置为 `'none'`

### 控制面板 (`DoubleSlitControls.tsx`)

- "光源类型"开关：单色光 / 白光（SegmentedControl）
- 白光模式下显示"滤光片"SegmentedControl（无 / 红 / 绿 / 蓝）
- 单色模式下隐藏滤光片控件，波长滑块仍可用

### 图表 (`DoubleSlitChart.tsx`)

- `isWhiteLight` 时调用 `drawWhiteLightPattern`，否则调用 `drawInterferencePattern`
- 数据叠加层：白光模式显示"白光 400-700nm"，有滤光片时追加标注

## 二、滤光片 3D 组件

### 位置与外观

- 位于单缝前方 `TUBE_START_X - 2.5`，与单缝共享支架
- 半透明薄片（圆角矩形平面），颜色随滤光片选择变化
- 仅在 `isWhiteLight && filterColor !== 'none'` 时显示
- 标签"滤光片"，风格与现有组件一致

## 三、组件旋转

### 状态层

- 新增三个角度（度）：`singleSlitAngle`、`doubleSlitAngle`、`eyepieceAngle`
- 初始值 0，范围 0~360°，步进 1°
- 三个 `setXxxAngle()` 回调

### 3D 组件 (`DoubleSlitRig3D.tsx`)

- 单缝、双缝、目镜各用 `<group rotation={[angleRad, 0, 0]}>` 包裹
- 标签跟随旋转

### 图表 (`DoubleSlitChart.tsx`)

- 干涉条纹旋转相应角度：`ctx.rotate(angleRad)`

### 控制面板

- 三个 RangeField 滑块（0~360°，步进 1°）

## 四、文件改动范围

| 文件 | 改动 |
|---|---|
| `model.ts` | 新增 `drawWhiteLightPattern`、`FilterColor` 类型、`FILTER_PROFILES` |
| `useDoubleSlitSceneState.ts` | 新增白光/滤光片/旋转状态 |
| `DoubleSlitControls.tsx` | 新增光源切换、滤光片选择、3 个旋转滑块 |
| `DoubleSlitRig3D.tsx` | 新增滤光片 3D 组件、三处旋转 group |
| `DoubleSlitChart.tsx` | 白光渲染分支、条纹旋转 |
| `DoubleSlitScene.tsx` | 传递新 props、数据叠加更新 |
