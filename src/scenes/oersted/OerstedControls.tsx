import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { useState } from 'react'

type OerstedPresetButton = {
  id: string
  label: string
  active: boolean
  onClick: () => void
}

type NeedlePreviewState = {
  observedSwingDeg: number
  wireFieldMicroT: number
}

type OerstedControlsProps = {
  presetButtons: OerstedPresetButton[]
  activePresetTip: string
  currentA: number
  onCurrentChange: (value: number) => void
  earthFieldMicroT: number
  onEarthFieldChange: (value: number) => void
  wireAzimuthDeg: number
  onWireAzimuthChange: (value: number) => void
  wirePitchDeg: number
  onWirePitchChange: (value: number) => void
  wireHeightM: number
  onWireHeightChange: (value: number) => void
  initialHeadingDeg: number
  onInitialHeadingChange: (value: number) => void
  running: boolean
  onToggleRunning: () => void
  onReset: () => void
  showFieldLines: boolean
  onToggleFieldLines: () => void
  previewNeedleStates: NeedlePreviewState[]
  maxSwing: number
  discoveryText: string
}

export function OerstedControls({
  presetButtons,
  activePresetTip,
  currentA,
  onCurrentChange,
  earthFieldMicroT,
  onEarthFieldChange,
  wireAzimuthDeg,
  onWireAzimuthChange,
  wirePitchDeg,
  onWirePitchChange,
  wireHeightM,
  onWireHeightChange,
  initialHeadingDeg,
  onInitialHeadingChange,
  running,
  onToggleRunning,
  onReset,
  showFieldLines,
  onToggleFieldLines,
  previewNeedleStates,
  maxSwing,
  discoveryText,
}: OerstedControlsProps) {
  const [advancedVisible, setAdvancedVisible] = useState(false)

  return (
    <>
      <h2>奥斯特电流磁效应</h2>

      <div className="subsection">
        <h3>课堂预设位</h3>
        <div className="oersted-preset-grid">
          {presetButtons.map((preset) => (
            <button
              key={preset.id}
              className={`touch-target ${preset.active ? 'active' : ''}`.trim()}
              aria-pressed={preset.active}
              onClick={preset.onClick}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="oersted-preset-tip">{activePresetTip}</p>
      </div>

      <RangeField
        id="oersted-current"
        label="电流 I (A)"
        min={-8}
        max={8}
        step={0.2}
        value={currentA}
        onChange={onCurrentChange}
      />

      <div className="subsection">
        <h3>导线姿态（3D）</h3>

        <RangeField
          id="oersted-wire-height"
          label="导线高度 h (m)"
          min={0.01}
          max={0.16}
          step={0.005}
          value={wireHeightM}
          onChange={onWireHeightChange}
        />
      </div>

      <div className="subsection">
        <button
          type="button"
          className="touch-target oersted-advanced-toggle"
          aria-expanded={advancedVisible}
          onClick={() => setAdvancedVisible((value) => !value)}
        >
          {advancedVisible ? '收起高级参数' : '显示高级参数'}
        </button>
      </div>

      {advancedVisible ? (
        <div className="subsection oersted-advanced-panel">
          <h3>高级参数</h3>
          <RangeField
            id="oersted-earth"
            label="地磁场 B0 (μT)"
            min={20}
            max={70}
            step={1}
            value={earthFieldMicroT}
            onChange={onEarthFieldChange}
          />

          <RangeField
            id="oersted-wire-azimuth"
            label="导线方位角 ψ (°)"
            min={0}
            max={360}
            step={1}
            value={wireAzimuthDeg}
            onChange={onWireAzimuthChange}
          />

          <RangeField
            id="oersted-wire-pitch"
            label="导线俯仰角 β (°)"
            min={-50}
            max={50}
            step={1}
            value={wirePitchDeg}
            onChange={onWirePitchChange}
          />

          <RangeField
            id="oersted-heading"
            label="磁针初始方向 θ0 (°)"
            min={0}
            max={360}
            step={1}
            value={initialHeadingDeg}
            onChange={onInitialHeadingChange}
          />
        </div>
      ) : null}

      <SceneActions
        actions={[
          {
            key: 'toggle-running',
            label: running ? '断电' : '通电',
            onClick: onToggleRunning,
          },
          {
            key: 'reset',
            label: '回到地磁初始位',
            onClick: onReset,
          },
          {
            key: 'toggle-field-lines',
            label: showFieldLines ? '隐藏磁感线' : '显示磁感线',
            onClick: onToggleFieldLines,
          },
        ]}
      />

      <div className="oersted-card">
        {previewNeedleStates.map((state, index) => (
          <p key={`needle-reading-${index}`} data-testid={`oersted-swing-${index + 1}`}>
            磁针{index + 1}: 摆动 <strong>{state.observedSwingDeg.toFixed(1)}°</strong> · Bwire{' '}
            <strong>{state.wireFieldMicroT.toFixed(1)} μT</strong>
          </p>
        ))}
        <p>
          最大可见摆动: <strong>{maxSwing.toFixed(1)}°</strong>
        </p>
        <p>可观察性: {discoveryText}</p>
      </div>

      <div className="structure-card">
        <h3>演示要点</h3>
        <ul>
          <li>磁感线半径统一，仅表示方向，不暗示不同圈层强弱。</li>
          <li>磁感线方向由切向箭头强化，便于课堂观察右手定则。</li>
          <li>三枚小磁针可鼠标拖拽放置，初始默认按地磁北向摆放。</li>
          <li>导线方位角、俯仰角和高度都可在三维中连续调节。</li>
          <li>极性标识：红色为正极(+)，蓝色为负极(-)。</li>
        </ul>
      </div>
    </>
  )
}
