import { ControlSection } from '../../ui/controls/ControlSection'
export function ElectromagneticDriveControls() {
  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>电磁驱动控制</h2>

      <div className="scene-legend" aria-label="颜色图例">
        <span className="scene-legend-item">
          <i className="scene-legend-dot" style={{ backgroundColor: '#e54453' }} aria-hidden="true" />
          红色：N 极
        </span>
        <span className="scene-legend-item">
          <i className="scene-legend-dot" style={{ backgroundColor: '#264b82' }} aria-hidden="true" />
          蓝色：S 极
        </span>
        <span className="scene-legend-item">
          <i className="scene-legend-dot" style={{ backgroundColor: '#a8a8a8' }} aria-hidden="true" />
          铝框
        </span>
        <span className="scene-legend-item">
          <i className="scene-legend-dot" style={{ backgroundColor: '#14b8a6' }} aria-hidden="true" />
          青色高亮：感应涡流强弱（示意）
        </span>
      </div>

      <ControlSection title="实验现象说明" collapsible defaultOpen={true}>
        <p><strong>1. 磁铁旋转：</strong><br />点击开始，曲柄带动 U 形磁铁绕竖直轴转动。</p>
        <p><strong>2. 磁通量变化：</strong><br />N、S 极转动使穿过闭合铝框的磁通量变化，框内产生感应涡流。</p>
        <p><strong>3. 异步跟随：</strong><br />涡流产生的磁场阻碍磁铁与铝框间的相对转动，铝框被带动但存在转差。</p>
      </ControlSection>

      <ControlSection title="模型边界" collapsible defaultOpen={false}>
        <p>转差 Δω = ω<sub>磁铁</sub> − ω<sub>铝框</sub>。本模型把平均驱动转矩近似设为与 Δω 成正比；青色亮度随 |Δω| 变化，用来示意耦合趋势。</p>
        <p>该近似只用于观察同向跟随和接近同步时作用减弱；不计算真实磁场分布、涡流路径和焦耳热，转速也不是实物测量值。</p>
      </ControlSection>
    </div>
  )
}
