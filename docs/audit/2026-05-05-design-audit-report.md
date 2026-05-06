# 设计审计报告 — 高中电磁学 3D 课堂演示平台

**审计日期**: 2026-05-05  
**审计范围**: 导航页 + 场景页，白天/夜间双主题  
**审计依据**: WCAG 2.1 AA, AGENTS.md 五区布局规范, frontend-design 技能反模式指南  
**截图状态**: ❌ Playwright 环境不支持 WebGL2，四张截图均显示错误提示，视觉审计基于代码审查

---

## 执行摘要

| 维度 | 评级 | 关键问题数 |
|---|---|---|
| AI 风格痕迹 | ⚠️ 中风险 | 4 |
| WCAG 对比度 | ⚠️ 中风险 | 1 |
| 主题一致性 | ⚠️ 中风险 | 4 |
| 响应式/触控 | ✅ 低风险 | 1 |
| 代码健康度 | ⚠️ 中风险 | 2 |

**总体评估**: 白天模式可读性良好，夜间 magazine 模式存在对比度缺陷。UI 组件存在多处硬编码色值未接入主题系统。Glassmorphism 在教室投影场景下为潜在可用性风险。

---

## 1. AI 风格痕迹检测 (AI Slop Detection)

### 🔴 高 — Glassmorphism 过度使用

**位置**: `src/styles/shell.css:926-950`

```css
.floating-panel {
  background: var(--glass-bg-day);          /* rgba(255,255,255,0.62) */
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid var(--glass-border-outer-day);
  box-shadow: var(--glass-highlight-day), var(--glass-shadow-day);
}
```

**问题**:  
- `blur(20px) saturate(1.4)` 是 2023–2024 AI 生成 UI 的标志性特征，在教室投影屏幕上会产生严重的可读性退化（白色半透明 + 模糊在明亮环境下对比度不可预测）。
- 夜间模式同样使用半透明深色面板 `rgba(8, 20, 38, 0.68)` + blur，在低端投影设备上可能出现渲染性能问题。

**建议**: 教室场景下考虑提供"高对比度模式"或降低 blur 强度至 `blur(8px)`，并增加不透明 fallback。

### 🟡 中 — 青色系主导配色

**位置**: `src/styles/theme.css`（出现 20+ 次）

`rgba(56, 189, 248, ...)`（sky-400）和 `rgba(14, 165, 233, ...)`（sky-500）几乎垄断了所有边框、阴影、激活态色值。

**问题**:  单一的青色主导使界面缺乏视觉层次，呈现典型的 "AI 蓝" 审美疲劳。

**建议**: 引入中性灰阶作为边框/分割线的主色，将青色限制在交互焦点和激活态。

### 🟡 中 — Glow 效果滥用

**位置**: `src/styles/theme.css:64-73`, `src/ui/controls/SegmentedControl.tsx:56-57`

```css
background: linear-gradient(135deg, rgba(14, 165, 233, 0.55) 0%, rgba(45, 212, 191, 0.45) 100%);
box-shadow: 0 0 16px rgba(14, 165, 233, 0.25);
```

**问题**: 夜间模式按钮激活态的 glow + 渐变组合是"赛博朋克"风格的典型 AI 输出，与高中课堂的严肃教学场景气质不符。

**建议**: 激活态使用纯色 + 轻微内阴影即可，移除外发光。

### 🟡 中 — 径向渐变背景

**位置**: `src/styles/tokens.css:11-15`, `src/styles/theme.css:7-11`

```css
background:
  radial-gradient(ellipse 80% 60% at 10% 0%, rgba(14, 165, 233, 0.10) 0%, transparent 55%),
  radial-gradient(ellipse 70% 50% at 90% 10%, rgba(45, 212, 191, 0.08) 0%, transparent 50%),
  ...
```

**问题**: 多层径向渐变背景是 AI 生成 landing page 的典型特征，在教室投影设备上可能出现色带（banding）。

**建议**: 简化为纯色或单一层非常淡的渐变。

---

## 2. WCAG 对比度可达性

### 对比度计算结果

| 场景 | 前景色 | 背景色 | 对比度 | WCAG AA |
|---|---|---|---|---|
| Day — muted 文字 | `#64748b` | glass 有效 `#f9fdff` | **4.65:1** | ✅ PASS |
| Day — 主文字 | `#0c4a6e` | `#f0f9ff` | **8.87:1** | ✅ PASS |
| Day — shell 文字 | `#0f172a` | `#f0f9ff` | **16.75:1** | ✅ PASS |
| Night — shell 文字 | `#e0f2fe` | `#060e1a` | **16.86:1** | ✅ PASS |
| Night — panel 标题 | `#bae6fd` | panel `#071222` | **14.15:1** | ✅ PASS |
| Night — magazine 主文字 | `#e8e8e8` | `#080808` | **16.35:1** | ✅ PASS |
| Night — magazine 次要 | `#c8c8c8` | `#080808` | **11.97:1** | ✅ PASS |
| **Night — magazine muted** | **`#555555`** | **`#080808`** | **2.69:1** | ❌ **FAIL** |

### 🔴 高 — 夜间 Magazine Muted 文字对比度不足

**位置**: `src/styles/theme.css:291` `--magazine-ink-muted: #555555`

**问题**: `#555555` 在 `#080808` 背景上对比度仅 2.69:1，远低于 WCAG AA 要求的 4.5:1。这会导致次要信息（如描述文字、时间戳、提示语）在夜间模式下难以阅读。

**修复建议**:
```css
/* 将 --magazine-ink-muted 从 #555555 提升到 #888888 */
--magazine-ink-muted: #888888;  /* 对比度 ≈ 5.8:1，满足 AA */
```

同时检查 `--magazine-group-desc: #444444` 和 `--magazine-preview-placeholder: #444444` 等同背景色的对比度。

---

## 3. 主题一致性

### 🔴 高 — 场景级 CSS 硬编码颜色未接入主题系统

**位置**: 7 个场景 CSS 文件

| 文件 | 硬编码色值数 | 夜间覆盖 |
|---|---|---|
| `alternator.css` | 12 | ✅ 有 |
| `motional-emf.css` | 10 | ✅ 有 |
| `electromagnetic-drive.css` | 8 | ✅ 有 |
| `cyclotron.css` | 14 | ✅ 有 |
| `oscilloscope.css` | 10 | ✅ 有 |
| `oersted.css` | 12 | ✅ 有 |
| `double-slit.css` | 3 | ⚠️ 不完整 |

**问题**: 每个场景维护独立的硬编码配色方案。虽然都有 night 覆盖，但这些颜色未接入全局 CSS 变量系统，导致：
- 新增主题（如高对比度、色盲友好）需要修改 7 个文件
- 颜色一致性难以保证（如 alternator 的 `#3088d0` vs oscilloscope 的 `#d7ffad`）

**建议**: 将场景色板提取为 `--scene-accent-*` / `--scene-chart-*` 系列变量，集中到 `tokens.css`。

### 🟡 中 — UI 组件硬编码色值

**位置 1**: `src/ui/controls/SegmentedControl.tsx:52,56`
```tsx
active ? 'active text-white shadow-sm' : ...
style={active ? {
  background: 'linear-gradient(135deg, #0ea5e9 0%, #2dd4bf 100%)',
  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25), inset 0 1px 0 0 rgba(255,255,255,0.2)',
} : {}}
```

**问题**: `text-white` 未通过 CSS 变量控制；渐变和阴影硬编码。

**位置 2**: `src/ui/controls/RangeField.tsx:62`
```tsx
background: `linear-gradient(90deg, #38bdf8 ${progress}%, rgba(14,165,233,0.15) ${progress}%)`
```

**问题**: 进度条填充色 `#38bdf8` 硬编码，无夜间适配。

**位置 3**: `src/ui/panels/FloatingPanel.tsx:108`
```tsx
className="... hover:text-[#e11d48] hover:bg-[rgba(225,29,72,0.08)] ..."
```

**问题**: 关闭按钮 hover 红色 `#e11d48`（rose-600）硬编码，在不同主题下过于突兀。

**位置 4**: `src/ui/layout/SceneLayout.tsx:150`
```tsx
<div className="... border-t border-gray-200 dark:border-[#2f4863]" ...>
```

**问题**: 混合使用 Tailwind 语义色 `gray-200` 和硬编码 `#2f4863`，风格不一致。

### 🟢 低 — 导航页区域 dot 颜色

**位置**: `src/pages/NavigationPage.tsx:13-18`

```tsx
electrostatics: { dot: '#818cf8' },
electromagnetism: { dot: '#fbbf24' },
...
```

**评估**: ✅ 这是设计意图（按学科区分颜色），无需修改。

---

## 4. 响应式与触控设计

### 🟡 中 — SegmentedControl 触控目标不足

**位置**: `src/ui/controls/SegmentedControl.tsx:50`

```tsx
className="... min-h-[32px] md:min-h-[36px] ..."
```

**问题**: 移动端触控高度仅 32px，不满足 WCAG 2.5.5 Target Size (Enhanced) 要求的 44px。虽然 `md:` 断点提升到 36px，但在 ≤767px 的移动端仍不足。

**建议**:
```tsx
min-h-[40px] md:min-h-[36px]  /* 或统一为 44px */
```

### ✅ 其他触控目标检查

| 元素 | 尺寸 | 状态 |
|---|---|---|
| FloatingPanel 折叠按钮 | 44×44px | ✅ |
| FloatingPanel 关闭按钮 | 44×44px | ✅ |
| SidebarPanel 展开/折叠按钮 | 44×44px | ✅ |
| SceneActions 按钮 | 检查通过 | ✅ |

---

## 5. 前端设计反模式

### 🟡 中 — 死代码：`whiteboard-theme` 样式块

**位置**: `src/styles/shell.css:956-999+`

**问题**: `whiteboard-theme` 包含约 50 行样式规则，但整个代码库中已无 TSX/TS 文件引用该类名（之前已清理 `glass-theme` 但遗漏了 `whiteboard-theme`）。

**建议**: 移除整个 `.app-shell.whiteboard-theme` 块。

### 🟡 中 — 混合样式策略

**位置**: `src/ui/controls/SegmentedControl.tsx`

同一组件中同时存在：
- Tailwind 工具类 (`min-h-[32px]`, `text-white`, `shadow-sm`)
- CSS 变量 (`text-[var(--control-ink)]`)
- 内联 style (`background: linear-gradient(...)`, `boxShadow: ...`)

**问题**: 维护困难，主题切换时内联 style 无法被 CSS 覆盖。

**建议**: 将渐变和阴影提取为 CSS 变量，内联 style 仅保留动态计算值（如 progress 百分比）。

### 🟡 中 — 场景 CSS 碎片化

**问题**: 7 个场景各自维护 `.css` 文件，颜色硬编码。虽然 night 覆盖齐全，但新增主题成本高。

---

## 6. 自动化测试失效

### 🔴 高 — Playwright 截图环境不支持 WebGL2

**问题**: 所有四张截图（nav-day, nav-night, scene-day, scene-night）均显示：
> "运行环境不支持 / 当前浏览器不满足 3D 演示运行要求 / WebGL2"

**影响**: 自动化视觉回归测试完全失效，无法通过截图验证 UI 变更。

**建议**: 在 Playwright 配置中启用 `--use-angle=gl` 或 `--enable-webgl` 标志，或使用支持 WebGL 的无头浏览器（如带 GPU 的 Chromium）。

---

## 修复优先级矩阵

| 优先级 | 问题 | 影响 | 预估工作量 |
|---|---|---|---|
| 🔴 P0 | 夜间 magazine muted 对比度不足 | 可达性缺陷 | 5 min |
| 🔴 P0 | Playwright WebGL 截图失效 | 测试阻断 | 2-4 hr |
| 🟡 P1 | 移除 whiteboard-theme 死代码 | 代码健康 | 5 min |
| 🟡 P1 | SegmentedControl 触控目标 32→44px | WCAG 合规 | 5 min |
| 🟡 P1 | SegmentedControl 硬编码渐变/文字 | 主题一致性 | 30 min |
| 🟡 P1 | RangeField 进度条硬编码色 | 主题一致性 | 15 min |
| 🟡 P1 | FloatingPanel 关闭按钮硬编码红 | 主题一致性 | 10 min |
| 🟡 P2 | Glassmorphism blur(20px) 投影风险 | 教室可用性 | 评估中 |
| 🟡 P2 | 场景 CSS 碎片化 | 维护成本 | 2-4 hr |
| 🟢 P3 | Glow 效果简化 | 设计品味 | 30 min |

---

## 附录：颜色变量化进度

| 区域 | 状态 | 备注 |
|---|---|---|
| Magazine 导航 | ✅ 已变量化 | 25 个 `--magazine-*` 变量 |
| Shell 基础 | ✅ 已变量化 | `--shell-ink-day`, `--shell-bg-day` |
| Glass 面板 | ✅ 已变量化 | `--glass-bg-day`, `--glass-border-day` |
| 控制元素 | ✅ 已变量化 | `--control-*` 系列 |
| Actions | ✅ 已变量化 | `--action-*` 系列 |
| Overview | ✅ 已变量化 | `--overview-*` 系列 |
| 场景级 CSS | ✅ 已变量化 | 7 个文件已提取 `--scene-*` 变量 |
| SegmentedControl | ✅ 已变量化 | 渐变提取到 `shell.css`，文字色通过 CSS 变量 |
| RangeField | ✅ 已变量化 | `#38bdf8` → `var(--control-accent-soft)` |
| FloatingPanel 关闭 | ✅ 已变量化 | `#e11d48` → `var(--control-accent)` |

---

## 修复完成记录

所有问题已按优先级修复完毕，`npm run verify:ci` 全绿通过。

| 优先级 | 问题 | 状态 | 修改文件 |
|---|---|---|---|
| P0 | 夜间 magazine muted 对比度不足 | ✅ 已修复 | `theme.css` |
| P0 | Playwright WebGL 截图失效 | ✅ 已修复 | 4 个 `scripts/playwright/*.mjs` |
| P1 | 移除 whiteboard-theme 死代码 | ✅ 已修复 | `shell.css` |
| P1 | SegmentedControl 触控目标 32→44px | ✅ 已修复 | `SegmentedControl.tsx` |
| P1 | SegmentedControl 硬编码渐变/文字 | ✅ 已修复 | `SegmentedControl.tsx`, `shell.css`, `theme.css` |
| P1 | RangeField 进度条硬编码色 | ✅ 已修复 | `RangeField.tsx` |
| P1 | FloatingPanel 关闭按钮硬编码红 | ✅ 已修复 | `FloatingPanel.tsx` |
| P1 | SceneLayout 移动端 border 混合策略 | ✅ 已修复 | `SceneLayout.tsx`, `shell.css`, `theme.css` |
| P2 | Glassmorphism blur(20px) 投影风险 | ✅ 已修复 | `shell.css` (blur 8px + fallback) |
| P2 | Glow 效果简化 | ✅ 已修复 | `theme.css` |
| P2 | 场景 CSS 碎片化 | ✅ 已修复 | 7 个 `src/scenes/*/*.css` |

---

*报告更新于修复完成后*。建议优先修复 P0 项，然后按 P1 → P2 顺序推进。*
