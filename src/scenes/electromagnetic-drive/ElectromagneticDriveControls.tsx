import { ControlSection } from '../../ui/controls/ControlSection'

export function ElectromagneticDriveControls() {
  return (
    <div className="grid gap-[0.8rem] content-start">
      <h2>电磁驱动控制</h2>

      <div className="scene-legend" aria-label="颜色图例">
        <span className="scene-legend-item">
          <i className="scene-legend-dot bg-[#ff2f2f]" aria-hidden="true" />
          磁铁
        </span>
        <span className="scene-legend-item">
          <i className="scene-legend-dot bg-[#ffe431]" aria-hidden="true" />
          铝框
        </span>
      </div>

      <ControlSection title="实验现象说明" collapsible defaultOpen={true}>
        <p><strong>1. 磁场旋转：</strong><br />点击开始，曲柄带动磁铁旋转。</p>
        <p><strong>2. 磁通量变化：</strong><br />旋转磁场切割闭合铝框。</p>
        <p><strong>3. 异步跟随：</strong><br />铝框产生感应电流并受力旋转，但速度略慢于磁铁。</p>
      </ControlSection>
    </div>
  )
}
