import type { ElectromagneticDriveSceneState } from './useElectromagneticDriveSceneState'

type ElectromagneticDriveControlsProps = {
  state: Pick<ElectromagneticDriveSceneState, 'start' | 'pause' | 'reset'>
}

export function ElectromagneticDriveControls({ state }: ElectromagneticDriveControlsProps) {
  return (
    <div className="electromagnetic-drive-controls">
      <h2>电磁驱动控制</h2>

      <div className="electromagnetic-drive-button-grid">
        <button type="button" className="touch-target btn-start" onClick={state.start}>
          开始摇动
        </button>
        <button type="button" className="touch-target btn-pause" onClick={state.pause}>
          停止摇动
        </button>
        <button type="button" className="touch-target btn-reset" onClick={state.reset}>
          重置实验
        </button>
      </div>

      <section className="electromagnetic-drive-info-card" aria-label="实验现象说明">
        <p><strong>1. 磁场旋转：</strong>点击开始，曲柄带动磁铁旋转。</p>
        <p><strong>2. 磁通量变化：</strong>旋转磁场切割闭合铝框。</p>
        <p><strong>3. 异步跟随：</strong>铝框产生感应电流并受力旋转，但速度略慢于磁铁。</p>
      </section>
    </div>
  )
}
