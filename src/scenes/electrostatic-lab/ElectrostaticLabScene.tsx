import { useMemo, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SelectField } from '../../ui/controls/SelectField'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ElectrostaticLabRig3D } from './ElectrostaticLabRig3D'
import {
  buildFieldLines,
  buildPotentialTerrain,
  clonePresetCharges,
  PRESET_CONFIGS,
  sampleElectricFieldAt,
  samplePotentialAt,
  summarizeChargeSet,
  type ElectrostaticCharge,
  type PresetKey,
} from './model'
import './electrostatic-lab.css'

const SCENE_BOUNDS = 7

function nextChargeId(charges: ReadonlyArray<ElectrostaticCharge>): string {
  let maxIndex = 0
  for (const charge of charges) {
    const match = charge.id.match(/^C(\d+)$/)
    if (!match) {
      continue
    }
    maxIndex = Math.max(maxIndex, Number(match[1]))
  }
  return `C${maxIndex + 1}`
}

const PRESET_OPTIONS: Array<{ value: PresetKey; label: string }> = [
  { value: 'single', label: '单点电荷' },
  { value: 'dipole', label: '电偶极子' },
  { value: 'same', label: '等量同号' },
  { value: 'opposite', label: '等量异号' },
  { value: 'three-linear', label: '三电荷线性' },
  { value: 'three-triangle', label: '三电荷三角' },
  { value: 'quadrupole', label: '电四极子' },
]

function formatNetCharge(netCharge: number): string {
  return `${netCharge >= 0 ? '+' : ''}${netCharge.toFixed(2)}`
}

export function ElectrostaticLabScene() {
  const [presetKey, setPresetKey] = useState<PresetKey>('dipole')
  const [charges, setCharges] = useState<ElectrostaticCharge[]>(() => clonePresetCharges('dipole'))
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>('C1')
  const [displayMode, setDisplayMode] = useState<'potential' | 'field'>('potential')
  const [overlayFieldLines, setOverlayFieldLines] = useState(true)
  const [showContourLines, setShowContourLines] = useState(true)
  const [invertHeight, setInvertHeight] = useState(false)
  const [resolution, setResolution] = useState(30)
  const [probeMode, setProbeMode] = useState(false)
  const [probePoint, setProbePoint] = useState<{ x: number; z: number } | null>(null)
  const [advancedInteractionsEnabled, setAdvancedInteractionsEnabled] = useState(false)

  const selectedCharge = useMemo(
    () => charges.find((charge) => charge.id === selectedChargeId) ?? null,
    [charges, selectedChargeId],
  )

  const chargeSummary = useMemo(() => summarizeChargeSet(charges), [charges])

  const terrain = useMemo(
    () =>
      buildPotentialTerrain({
        charges,
        bounds: SCENE_BOUNDS,
        resolution,
        contourLevels: [-3, -2, -1, 0, 1, 2, 3],
        invertHeight,
      }),
    [charges, invertHeight, resolution],
  )

  const fieldLines = useMemo(
    () =>
      buildFieldLines({
        charges,
        bounds: SCENE_BOUNDS,
        seedsPerCharge: displayMode === 'field' ? 11 : 8,
        maxSteps: displayMode === 'field' ? 220 : 170,
      }),
    [charges, displayMode],
  )

  const probeReadout = useMemo(() => {
    if (!probePoint) {
      return null
    }
    const potential = samplePotentialAt(charges, probePoint)
    const field = sampleElectricFieldAt(charges, probePoint)
    return { potential, field }
  }, [charges, probePoint])

  const applyPreset = (nextPreset: PresetKey) => {
    const nextCharges = clonePresetCharges(nextPreset)
    setPresetKey(nextPreset)
    setCharges(nextCharges)
    setSelectedChargeId(nextCharges[0]?.id ?? null)
    setProbePoint(null)
  }

  const addCharge = (magnitude: number) => {
    setCharges((prevCharges) => {
      const id = nextChargeId(prevCharges)
      const angle = prevCharges.length * 0.85
      const radius = 3.8
      const nextCharge: ElectrostaticCharge = {
        id,
        x: Number((Math.cos(angle) * radius).toFixed(1)),
        z: Number((Math.sin(angle) * radius).toFixed(1)),
        magnitude,
      }
      setSelectedChargeId(id)
      return [...prevCharges, nextCharge]
    })
  }

  const addChargeAtPoint = (position: { x: number; z: number }, sign: 1 | -1) => {
    setCharges((prevCharges) => {
      const id = nextChargeId(prevCharges)
      const nextCharge: ElectrostaticCharge = {
        id,
        x: Number(position.x.toFixed(2)),
        z: Number(position.z.toFixed(2)),
        magnitude: sign > 0 ? 1.2 : -1.2,
      }
      setSelectedChargeId(id)
      return [...prevCharges, nextCharge]
    })
  }

  const deleteChargeById = (chargeId: string) => {
    if (!chargeId) {
      return
    }

    setCharges((prevCharges) => {
      const nextCharges = prevCharges.filter((charge) => charge.id !== chargeId)
      if (selectedChargeId === chargeId) {
        setSelectedChargeId(nextCharges[0]?.id ?? null)
      }
      return nextCharges
    })
  }

  const deleteSelectedCharge = () => {
    if (!selectedChargeId) {
      return
    }
    deleteChargeById(selectedChargeId)
  }

  const updateSelectedCharge = (
    patch: Partial<Pick<ElectrostaticCharge, 'x' | 'z' | 'magnitude'>>,
  ) => {
    if (!selectedChargeId) {
      return
    }

    setCharges((prevCharges) =>
      prevCharges.map((charge) =>
        charge.id === selectedChargeId
          ? {
              ...charge,
              ...patch,
            }
          : charge,
      ),
    )
  }

  const presetLabel = PRESET_CONFIGS[presetKey].label
  const modeLabel = displayMode === 'potential' ? '电势地形' : '电场线'

  return (
    <SceneLayout
      presentationSignals={['chart', 'live-metric', 'interactive-readout']}
      coreSummary={
        <div className="scene-core-summary-stack">
          <p>
            电荷方案: {presetLabel}（+{chargeSummary.positiveCount} / -{chargeSummary.negativeCount}）
          </p>
          <p>
            势场范围: {terrain.stats.minPotential.toFixed(2)} ~ {terrain.stats.maxPotential.toFixed(2)}
          </p>
          <p>当前模式: {modeLabel}</p>
          <p>
            探针读数:{' '}
            {probeReadout
              ? `V=${probeReadout.potential.toFixed(2)}, |E|=${probeReadout.field.magnitude.toFixed(2)}`
              : '未放置'}
          </p>
        </div>
      }
      controls={
        <>
          <h2>3D等势面实验台控制</h2>

          <div className="subsection">
            <h3>课堂预设</h3>
            <div className="electrostatic-lab-preset-grid">
              {PRESET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`touch-target electrostatic-lab-preset-btn ${presetKey === option.value ? 'active' : ''}`.trim()}
                  onClick={() => applyPreset(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="electrostatic-lab-mode-card" data-presentation-signal="chart">
            <p>显示模式: {modeLabel}</p>
            <div className="electrostatic-lab-mode-row">
              <button
                className={`touch-target electrostatic-lab-mode-btn ${displayMode === 'potential' ? 'active' : ''}`.trim()}
                onClick={() => setDisplayMode('potential')}
              >
                电势地形
              </button>
              <button
                className={`touch-target electrostatic-lab-mode-btn ${displayMode === 'field' ? 'active' : ''}`.trim()}
                onClick={() => setDisplayMode('field')}
              >
                电场线
              </button>
            </div>
            <label className="electrostatic-lab-checkline">
              <input
                type="checkbox"
                checked={overlayFieldLines}
                onChange={(event) => setOverlayFieldLines(event.target.checked)}
              />
              势面叠加电场线
            </label>
            <label className="electrostatic-lab-checkline">
              <input
                type="checkbox"
                checked={showContourLines}
                onChange={(event) => setShowContourLines(event.target.checked)}
              />
              显示等势线
            </label>
            <label className="electrostatic-lab-checkline">
              <input
                type="checkbox"
                checked={invertHeight}
                onChange={(event) => setInvertHeight(event.target.checked)}
              />
              翻转势面高度
            </label>
            <button
              className="touch-target electrostatic-lab-advanced-toggle"
              onClick={() => setAdvancedInteractionsEnabled((value) => !value)}
            >
              {advancedInteractionsEnabled ? '关闭进阶交互' : '开启进阶交互'}
            </button>
            {advancedInteractionsEnabled ? (
              <p className="electrostatic-lab-advanced-hint">
                已启用：可在视图中拖拽电荷移动、双击地面添加电荷、右键点击电荷删除。
              </p>
            ) : null}
          </div>

          <SceneActions
            actions={[
              {
                key: 'add-positive',
                label: '添加 + 电荷',
                onClick: () => addCharge(2.4),
              },
              {
                key: 'add-negative',
                label: '添加 - 电荷',
                onClick: () => addCharge(-2.4),
              },
              {
                key: 'delete-selected',
                label: '删除选中',
                onClick: deleteSelectedCharge,
                disabled: !selectedCharge,
              },
              {
                key: 'toggle-probe',
                label: probeMode ? '关闭探针模式' : '开启探针模式',
                onClick: () => setProbeMode((value) => !value),
              },
            ]}
          />

          <div className="subsection">
            <h3>电荷编辑</h3>
            <SelectField
              id="electrostatic-lab-selected-charge"
              label="当前目标"
              value={selectedChargeId ?? ''}
              onChange={(value) => setSelectedChargeId(value)}
              className="preset-select"
              options={charges.map((charge) => ({
                value: charge.id,
                label: `${charge.id} (${charge.magnitude.toFixed(1)} q)`,
              }))}
            />
          </div>

          {selectedCharge ? (
            <>
              <RangeField
                id="electrostatic-lab-charge-magnitude"
                label="电荷量 q"
                min={-5}
                max={5}
                step={0.1}
                value={selectedCharge.magnitude}
                onChange={(value) => updateSelectedCharge({ magnitude: value })}
              />
              <RangeField
                id="electrostatic-lab-charge-x"
                label="位置 X"
                min={-6}
                max={6}
                step={0.1}
                value={selectedCharge.x}
                onChange={(value) => updateSelectedCharge({ x: value })}
              />
              <RangeField
                id="electrostatic-lab-charge-z"
                label="位置 Z"
                min={-6}
                max={6}
                step={0.1}
                value={selectedCharge.z}
                onChange={(value) => updateSelectedCharge({ z: value })}
              />
            </>
          ) : null}

          <RangeField
            id="electrostatic-lab-resolution"
            label="地形分辨率"
            min={18}
            max={44}
            step={1}
            value={resolution}
            onChange={(value) => setResolution(Math.round(value))}
          />

          <div
            className="electrostatic-lab-readout"
            data-presentation-signal="chart live-metric interactive-readout"
          >
            <p>
              电荷总数: {charges.length}（+{chargeSummary.positiveCount} / -{chargeSummary.negativeCount}）
            </p>
            <p>净电荷: {formatNetCharge(chargeSummary.netCharge)}</p>
            <p>
              选中电荷:{' '}
              {selectedCharge
                ? `${selectedCharge.id} (${selectedCharge.x.toFixed(2)}, ${selectedCharge.z.toFixed(2)})`
                : '无'}
            </p>
            <p>
              势场范围: {terrain.stats.minPotential.toFixed(2)} ~ {terrain.stats.maxPotential.toFixed(2)}
            </p>
            <p>
              探针位置:{' '}
              {probePoint ? `(${probePoint.x.toFixed(2)}, ${probePoint.z.toFixed(2)})` : '未放置'}
            </p>
            <p>探针电势: {probeReadout ? `${probeReadout.potential.toFixed(3)} V` : '--'}</p>
            <p>探针场强: {probeReadout ? `${probeReadout.field.magnitude.toFixed(3)} N/C` : '--'}</p>
          </div>

          <div className="structure-card">
            <h3>演示要点</h3>
            <ul>
              <li>先切“电势地形”观察正负电势在空间中的高低分区，再切“电场线”观察方向性。</li>
              <li>更换预设可快速演示单电荷、偶极子、四极子等典型模型的场分布差异。</li>
              <li>开启探针模式并点击地面任意点，可对比电势数值与场强大小。</li>
            </ul>
          </div>
        </>
      }
      viewport={
        <>
          <InteractiveCanvas
            camera={{ position: [10, 10, 11], fov: 52 }}
            controls={{ target: [0, 0.4, 0], minDistance: 6, maxDistance: 30 }}
            adaptiveFraming={false}
            frameloop="demand"
          >
            <ElectrostaticLabRig3D
              bounds={SCENE_BOUNDS}
              charges={charges}
              terrain={terrain}
              fieldLines={fieldLines}
              displayMode={displayMode}
              overlayFieldLines={overlayFieldLines}
              showContourLines={showContourLines}
              selectedChargeId={selectedChargeId}
              probeMode={probeMode}
              probePoint={probePoint}
              advancedInteractionsEnabled={advancedInteractionsEnabled}
              onSelectCharge={(chargeId) => setSelectedChargeId(chargeId)}
              onProbePointChange={setProbePoint}
              onChargePositionChange={(chargeId, position) =>
                setCharges((prevCharges) =>
                  prevCharges.map((charge) =>
                    charge.id === chargeId
                      ? {
                          ...charge,
                          x: position.x,
                          z: position.z,
                        }
                      : charge,
                  ),
                )
              }
              onAddChargeAt={addChargeAtPoint}
              onDeleteCharge={deleteChargeById}
            />
          </InteractiveCanvas>
          <p className="electrostatic-lab-viewport-note" data-presentation-signal="chart">
            操作提示：先选课堂预设，再切换“电势地形/电场线”；探针模式下点击地面任意点可读取电势与场强。
          </p>
        </>
      }
    />
  )
}
