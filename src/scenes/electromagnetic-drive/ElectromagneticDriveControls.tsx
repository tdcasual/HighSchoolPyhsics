import { ControlSection } from '../../ui/controls/ControlSection'

export function ElectromagneticDriveControls() {
  return (
    <div className="electromagnetic-drive-controls">
      <h2>电磁驱动控制</h2>

      <div className="induction-current-legend" aria-label="颜色图例">
        <span className="induction-current-legend-item">
          <i className="induction-current-dot north" aria-hidden="true" />
          磁铁
        </span>
        <span className="induction-current-legend-item">
          <i className="induction-current-dot current" aria-hidden="true" />
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
