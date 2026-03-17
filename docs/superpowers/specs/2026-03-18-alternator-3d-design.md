# 交流发电机3D模型重构设计

## 概述

重构现有交流发电机（alternator）场景的3D渲染层，将不准确的简易几何体替换为结构准确、视觉精美的经典教学模型（线圈旋转型），用于高中物理教学。

## 目标

- 结构准确：符合真实交流发电机的部件组成和空间关系
- 视觉精美：精细写实风格，金属质感材质，适合课堂展示
- 动画正确：线圈绕水平轴旋转，滑环随动，碳刷固定
- 保持兼容：Rig3D 接口不变，物理模型和控件层无需改动

## 发电机类型

经典教学模型（线圈旋转型 / 旋转电枢式）：矩形线圈在两个弧形凹面对置磁极之间绕水平轴旋转，线圈两端通过滑环和碳刷引出交流电。

## 空间布局与坐标系

整体沿 Z 轴水平展开：

```
左轴承座 — [左磁极(S)] — [转子铁芯+线圈] — [右磁极(N)] — 右轴承座 — 滑环 — 碳刷 — 外电路
```

坐标系约定：
- X 轴：左右（磁极对置方向，磁场方向 N→S）
- Y 轴：上下
- Z 轴：转轴方向（水平，线圈绕此轴旋转）

注意：现有代码中旋转轴为 X 轴（`AXIS_DIRECTION = [1,0,0]`），本次重构有意改为 Z 轴以匹配更自然的空间布局（转轴沿纵深方向）。model.ts 中的 `angleRad` 含义不变，仅 Rig3D 中的旋转应用轴从 X 改为 Z。

## 部件设计

### 1. 弧形磁极（两个，固定）

- 形状：ExtrudeGeometry 拉伸弧形截面，弧度约 120°，凹面朝内
- 磁极后方连接矩形磁轭（铁背板）作为底座
- N 极：深红色金属质感（metalness: 0.3, roughness: 0.6），白色 "N" 标注
- S 极：深蓝色金属质感，白色 "S" 标注
- 沿 X 轴对称放置，凹面间距留出转子旋转空间

### 2. 转子铁芯

- 形状：圆柱体，沿 Z 轴放置，直径略小于磁极间隙
- 表面模拟硅钢片叠压效果（多层薄圆柱或法线贴图）
- 材质：深灰色铁质，metalness: 0.5, roughness: 0.4

### 3. 矩形线圈

- TubeGeometry 沿矩形路径绕制，圆角过渡
- 线圈平面垂直于转轴（X-Y 平面内），绕 Z 轴旋转
- 铜色材质：color #B87333, metalness: 0.7, roughness: 0.3
- AB 边和 CD 边用不同深浅铜色区分
- 标注 A/B/C/D 四个顶点
- 两端引出线沿转轴方向延伸到滑环

### 4. 转轴

- 细长圆柱体，沿 Z 轴贯穿铁芯，两端伸出到轴承座
- 银灰色金属：metalness: 0.8, roughness: 0.2

### 5. 滑环（两个，随转子旋转）

- Torus 几何体，套在转轴上，沿 Z 轴间隔排列
- 黄铜色：color #C5A03F, metalness: 0.8, roughness: 0.2
- 各自通过引出线连接线圈一端
- 两环电气隔离

### 6. 碳刷（两个，固定）

- 小矩形方块，从上方/下方压在滑环表面
- 深灰色碳质：color #333, metalness: 0.1, roughness: 0.8
- 上方加螺旋线几何体模拟弹簧压紧

### 7. 轴承座（两个，固定）

- 简化 U 形或方形底座，中间圆孔套住转轴
- 灰色铸铁质感

### 8. 外电路

- TubeGeometry / CatmullRomCurve3 导线从碳刷引出
- 连接到小灯泡或电流表（负载）
- 红/蓝导线区分正负极

### 9. 磁场可视化

- 磁极间隙中若干水平箭头（N→S 方向）
- 半透明青色，可通过控件开关显示/隐藏

## 动画与交互

### 旋转动画

- 线圈 + 铁芯 + 转轴 + 滑环组成 `rotor-assembly` group，整体绕 Z 轴旋转
- 旋转角度由 model.ts 的 `stepAlternatorState()` 驱动，与现有物理模型一致
- 碳刷固定不动，始终压在滑环表面

### 电流方向指示

- 线圈 AB 边和 CD 边上用小箭头标注瞬时电流方向
- 电流方向随线圈位置变化，过中性面时反转
- 外电路导线上用流动小点或箭头表示电流方向和大小

### 关键位置标注

- θ=0°/180° 时提示"线圈平面∥B，Φ最大，e=0"
- θ=90°/270° 时提示"线圈平面⊥B，Φ变化最快，e最大"
- 可通过控件开关显示/隐藏

### 控件

沿用现有控件，不做改动：
- 四个滑块（角速度ω、磁感应强度B、匝数N、线圈面积S）
- 播放/暂停、重置按钮
- V-t 波形图
- 遥测数据面板（9项读数）

### 相机

- 默认位置：右前上方约 [6, 4, 8]，俯视约 30°
- OrbitControls 自由旋转
- 支持 classroom/presentation 模式

## 文件架构

### 改动策略

重写 AlternatorRig3D.tsx，拆分为多个子组件。保留 model.ts、useAlternatorSceneState.ts、AlternatorControls.tsx、AlternatorChart.tsx、AlternatorScene.tsx 不变。

### 核心改动

- `AlternatorRig3D.tsx` — 完全重写，作为子组件的组装入口

### 新增子组件

- `components/ArcMagnet.tsx` — 弧形磁极 + 磁轭，接收 polarity 参数
- `components/RotorAssembly.tsx` — 转子铁芯 + 线圈 + 转轴 + 滑环，接收 angleRad
- `components/Brushes.tsx` — 碳刷 + 弹簧
- `components/BearingMount.tsx` — 轴承座
- `components/ExternalCircuit.tsx` — 外电路导线 + 负载 + 输出电流表（含 meterNeedleAngleRad 驱动的指针偏转）
- `components/FieldArrows.tsx` — 磁场箭头可视化
- `components/CurrentIndicators.tsx` — 电流方向箭头/流动点

### 接口不变

```typescript
interface AlternatorRig3DProps {
  angleRad: number;
  meterNeedleAngleRad: number;
}
```

上层组件无需任何改动。

### 测试更新

- `rig.test.tsx` 需更新以匹配新的 3D 元素名称
- 其余测试文件不受影响

## 不在范围内

- 物理模型改动
- 控件 UI 改动
- 新增场景模式（如磁极旋转型）
- 外部 3D 模型文件（glTF/OBJ）— 全部用程序化几何体构建
