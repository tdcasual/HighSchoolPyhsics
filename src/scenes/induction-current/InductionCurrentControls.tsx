import type { InductionCurrentSceneState } from './useInductionCurrentSceneState'
import {
  formatCurrentDirection,
  formatFluxChange,
  formatVerticalDirection,
} from './model'

type InductionCurrentControlsProps = {
  state: InductionCurrentSceneState
}

export function InductionCurrentControls({ state }: InductionCurrentControlsProps) {
  return (
    <div className="induction-current-controls">
      <h2>实验控制台</h2>

      <div className="subsection">
        <h3>磁极设置</h3>
        <div className="induction-current-btn-row">
          <button
            type="button"
            className={`touch-target induction-current-action ${state.poleSetting === 's-top-n-down' ? 'active' : ''}`.trim()}
            aria-pressed={state.poleSetting === 's-top-n-down'}
            onClick={() => state.setPoleSetting('s-top-n-down')}
            disabled={!state.canChangePolarity}
          >
            S 极在上 (N 下)
          </button>
          <button
            type="button"
            className={`touch-target induction-current-action ${state.poleSetting === 's-bottom-n-up' ? 'active' : ''}`.trim()}
            aria-pressed={state.poleSetting === 's-bottom-n-up'}
            onClick={() => state.setPoleSetting('s-bottom-n-up')}
            disabled={!state.canChangePolarity}
          >
            S 极在下 (N 上)
          </button>
        </div>
      </div>

      <div className="induction-current-legend" aria-label="颜色图例">
        <span className="induction-current-legend-item">
          <i className="induction-current-dot north" aria-hidden="true" />
          N 极
        </span>
        <span className="induction-current-legend-item">
          <i className="induction-current-dot south" aria-hidden="true" />
          S 极
        </span>
        <span className="induction-current-legend-item">
          <i className="induction-current-dot current" aria-hidden="true" />
          感应电流
        </span>
      </div>

      <div className="induction-current-records">
        <h3>实验数据记录</h3>
        <table className="induction-current-record-table">
          <thead>
            <tr>
              <th scope="col">原磁场方向</th>
              <th scope="col">磁通量变化</th>
              <th scope="col">感应电流方向</th>
              <th scope="col">感应磁场方向</th>
            </tr>
          </thead>
          <tbody>
            {state.records.length === 0 ? (
              <tr>
                <td colSpan={4}>暂无实验记录</td>
              </tr>
            ) : (
              state.records.map((record) => (
                <tr key={record.id}>
                  <td>{formatVerticalDirection(record.originalFieldDirection)}</td>
                  <td>{formatFluxChange(record.fluxChange)}</td>
                  <td className={record.inducedCurrentDirection === 'counterclockwise' ? 'ccw' : 'cw'}>
                    {formatCurrentDirection(record.inducedCurrentDirection)}
                  </td>
                  <td>{formatVerticalDirection(record.inducedFieldDirection)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="touch-target induction-current-conclusion-toggle"
        onClick={state.toggleConclusion}
      >
        {state.showConclusion ? '隐藏实验结论' : '查看实验结论'}
      </button>

      {state.showConclusion ? (
        <div className="structure-card">
          <h3>实验结论</h3>
          <ul>
            <li>感应电流方向由"原磁场方向 + 磁通量变化"共同决定。</li>
            <li>磁铁接近线圈时，线圈感应磁场总是阻碍磁通量增加。</li>
            <li>磁铁远离线圈时，线圈感应磁场总是阻碍磁通量减少。</li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
