import { ControlSection } from '../../ui/controls/ControlSection'
import { RangeField } from '../../ui/controls/RangeField'
import { SceneActions } from '../../ui/controls/SceneActions'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { SelectField } from '../../ui/controls/SelectField'
import { ELEMENTS, MATERIALS, METERS, type ElementKind, type MaterialKey } from './model'
import type { ResistivitySceneState } from './useResistivitySceneState'
import './resistivity.css'

const STAGES = [
  { key: 'diameter', label: '测直径' },
  { key: 'circuit', label: '接电路' },
  { key: 'analysis', label: '作图' },
  { key: 'iv', label: '伏安特性' },
]
const VIEWS = [
  { key: 'home', label: '全景' },
  { key: 'front', label: '正视' },
  { key: 'top', label: '俯视' },
  { key: 'focus', label: '近看' },
]

type ResistivityControlsProps = {
  state: ResistivitySceneState
  showSecant?: boolean
  showTangent?: boolean
  onShowSecantChange?: (visible: boolean) => void
  onShowTangentChange?: (visible: boolean) => void
}

export function ResistivityControls({
  state,
  showSecant = true,
  showTangent = false,
  onShowSecantChange = () => {},
  onShowTangentChange = () => {},
}: ResistivityControlsProps) {
  return (
    <div className='resistivity-controls'>
      <h2>电阻率测量控制</h2>
      <ControlSection title='实验阶段'>
        <SegmentedControl options={STAGES} value={state.stage} onChange={(key) => state.setStage(key as ResistivitySceneState['stage'])} />
      </ControlSection>
      <ControlSection title='金属丝'>
        <SelectField
          id='resistivity-material'
          label='材料'
          value={state.mystery ? 'mystery' : state.material}
          onChange={(value) => {
            if (value === 'mystery') state.setMystery(true)
            else {
              state.setMystery(false)
              state.setMaterial(value as MaterialKey)
            }
          }}
          options={[
            ...Object.entries(MATERIALS).map(([value, spec]) => ({ value, label: spec.name })),
            { value: 'mystery', label: '未知金属丝' },
          ]}
        />
        <RangeField id='resistivity-nominal' label='标称直径' min={0.2} max={1} step={0.05} value={state.nominal} unit='mm' displayValue={state.nominal.toFixed(2) + ' mm'} onChange={state.setNominal} />
      </ControlSection>
      {state.stage === 'diameter' ? (
        <>
          <ControlSection title='螺旋测微器'>
            <SegmentedControl
              options={[{ key: '0', label: '位置 1' }, { key: '1', label: '位置 2' }, { key: '2', label: '位置 3' }]}
              value={String(state.position)}
              onChange={(key) => state.setPosition(Number(key) as 0 | 1 | 2)}
            />
            <SegmentedControl
              options={[
                { key: '0', label: '零点正常' },
                { key: '0.006', label: '正零误差 +0.006 mm' },
                { key: '-0.004', label: '负零误差 −0.004 mm' },
              ]}
              value={String(state.zero)}
              onChange={(key) => state.setZero(Number(key))}
            />
            <RangeField id='resistivity-gap' transient label='螺杆间隙' min={0} max={25} step={0.001} value={state.gap} unit='mm' displayValue={state.gap.toFixed(3) + ' mm'} onChange={state.setGap} />
            <SceneActions actions={[
              { key: 'fine-out', label: '微调退回 0.01 mm', onClick: () => state.setGap(state.gap + 0.01) },
              { key: 'fine-in', label: '微调前进 0.01 mm', onClick: () => state.setGap(state.gap - 0.01) },
              { key: 'seat', label: '接触金属丝', onClick: state.seat },
              { key: 'record-d', label: '记录直径', onClick: state.recordDiameter },
              { key: 'reset', label: '重置本环节', onClick: state.reset },
            ]} />
          </ControlSection>
          <ControlSection title='直径记录' collapsible>
            <DiameterTable state={state} />
          </ControlSection>
        </>
      ) : null}
      {state.stage === 'circuit' || state.stage === 'analysis' ? (
        <>
          <ControlSection title='电路'>
            <SegmentedControl options={[{ key: 'external', label: '外接' }, { key: 'internal', label: '内接' }]} value={state.method} onChange={(key) => state.setMethod(key as 'external' | 'internal')} />
            <p className='resistivity-hint'>
              {state.method === 'external'
                ? '外接：电压表分流，R测 = RₓRᵥ/(Rₓ+Rᵥ) ＜ Rₓ；几欧金属丝通常采用外接。'
                : '内接：电流表内阻计入电压读数，R测 = Rₓ + Rₐ ＞ Rₓ。'}
            </p>
            <SegmentedControl options={[{ key: 'limit', label: '限流' }, { key: 'divider', label: '分压' }]} value={state.control} onChange={(key) => state.setControl(key as 'limit' | 'divider')} />
            <SegmentedControl options={[{ key: 'A06', label: '0.6 A' }, { key: 'A3', label: '3 A' }]} value={state.ammeter === 'A3' ? 'A3' : 'A06'} onChange={(key) => state.setAmmeter(key as 'A06' | 'A3')} />
            <SegmentedControl options={[{ key: 'V3', label: '3 V' }, { key: 'V15', label: '15 V' }]} value={state.voltmeter === 'V15' ? 'V15' : 'V3'} onChange={(key) => state.setVoltmeter(key as 'V3' | 'V15')} />
            <RangeField id='resistivity-length' label='接入长度 l' min={10} max={50} step={0.5} value={state.lengthCm} unit='cm' displayValue={state.lengthCm.toFixed(1) + ' cm'} onChange={state.setLength} />
            <RangeField id='resistivity-slider' label='滑片' min={0} max={1} step={0.01} value={state.slider} displayValue={state.slider.toFixed(2)} onChange={state.setSlider} />
            <p className='resistivity-hint' aria-live='polite'>
              {state.step === 0
                ? '第 1 步：连接电源、开关、滑动变阻器、电流表和待测金属丝。'
                : state.step === 1
                  ? '第 2 步：将电压表并联到待测金属丝两端。'
                  : '线路已接好。先确认量程，并让滑片位于安全端再闭合。'}
            </p>
            <SceneActions actions={[
              { key: 'step', label: state.step >= 2 ? '重新接线' : state.step === 0 ? '连接主回路' : '接入电压表', onClick: () => state.setStep(state.step >= 2 ? 0 : state.step + 1) },
              { key: 'record', label: '记录 U、I', onClick: state.recordPoint },
              { key: 'sample', label: '示例数据', onClick: state.fillSamples },
            ]} />
          </ControlSection>
          <ControlSection title='U、I 数据记录' collapsible defaultOpen={false}>
            <RecordTable state={state} />
          </ControlSection>
        </>
      ) : null}
      {state.stage === 'analysis' ? (
        <ControlSection title='图像'>
          <p className='resistivity-hint'>
            {state.diameters.every(Boolean)
              ? '三处直径已测量；用 U–I 或 R–l 图像的斜率计算电阻率。'
              : `已测 ${state.diameters.filter(Boolean).length}/3 处直径。斜率可先求电阻，但需完成三处直径测量才能计算电阻率。`}
          </p>
          <SegmentedControl options={[{ key: 'UI', label: 'U–I' }, { key: 'Rl', label: 'R–l' }]} value={state.graph} onChange={(key) => state.setGraph(key as 'UI' | 'Rl')} />
          <SegmentedControl options={[{ key: 'origin', label: '过原点' }, { key: 'line', label: '自由直线' }]} value={state.fit} onChange={(key) => state.setFit(key as 'origin' | 'line')} />
          <SceneActions actions={[{ key: 'clear', label: '清空数据', onClick: state.clearRecords }]} />
        </ControlSection>
      ) : null}
      {state.stage === 'iv' ? (
        <>
        <ControlSection title='元件与表量程'>
          <SegmentedControl options={(Object.keys(ELEMENTS) as ElementKind[]).map((key) => ({ key, label: ELEMENTS[key].short }))} value={state.element} onChange={(key) => state.setElement(key as ElementKind)} />
          <SegmentedControl options={[{ key: 'A06', label: '电流 ±0.6 A' }, { key: 'A3', label: '电流 ±3 A' }]} value={state.ammeter === 'A3' ? 'A3' : 'A06'} onChange={(key) => state.setAmmeter(key as 'A06' | 'A3')} />
          <SegmentedControl options={[{ key: 'V3', label: '电压 ±3 V' }, { key: 'V15', label: '电压 ±15 V' }]} value={state.voltmeter === 'V15' ? 'V15' : 'V3'} onChange={(key) => state.setVoltmeter(key as 'V3' | 'V15')} />
          <RangeField
            id='resistivity-voltage'
            label='电压 U'
            min={ELEMENTS[state.element].min}
            max={ELEMENTS[state.element].max}
            step={0.01}
            value={state.voltage}
            unit='V'
            displayValue={state.voltage.toFixed(2) + ' V'}
            onChange={state.setVoltage}
          />
          <p className='resistivity-hint'>本环节用可调直流电源直接设定元件两端电压；电流表串联，电压表并联。U 为负时电源极性反向。</p>
        </ControlSection>
        <ControlSection title='伏安曲线分析'>
          <SegmentedControl
            options={[{ key: 'show', label: '显示割线' }, { key: 'hide', label: '隐藏割线' }]}
            value={showSecant ? 'show' : 'hide'}
            onChange={(key) => onShowSecantChange(key === 'show')}
          />
          <SegmentedControl
            options={[{ key: 'show', label: '显示切线' }, { key: 'hide', label: '隐藏切线' }]}
            value={showTangent ? 'show' : 'hide'}
            onChange={(key) => onShowTangentChange(key === 'show')}
          />
          <p className='resistivity-hint'>R = U/I 对应 I–U 图上割线斜率的倒数；切线斜率 dI/dU 表示该点附近的变化率，非线性元件两者不同。</p>
        </ControlSection>
        </>
      ) : null}
      <ControlSection title='观察视角'>
        <SegmentedControl options={VIEWS} value={state.view} onChange={(key) => state.setView(key as ResistivitySceneState['view'])} />
      </ControlSection>
      <p className='resistivity-hint' aria-live='polite'>{state.notice}</p>
    </div>
  )
}

function DiameterTable({ state }: { state: ResistivitySceneState }) {
  return (
    // Scrolls sideways on narrow panels, so it must be reachable from the keyboard.
    <div className='resistivity-table-wrap' tabIndex={0} role='region' aria-label='直径测量记录'>
      <table className='resistivity-table'>
        <thead><tr><th>位置</th><th>示数 / mm</th><th>零点 / mm</th><th>修正 d / mm</th><th>来源</th></tr></thead>
        <tbody>
          {state.diameters.map((row, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{row ? row.reading.toFixed(3) : '—'}</td>
              <td>{row ? row.zero.toFixed(3) : '—'}</td>
              <td>{row ? row.d.toFixed(3) : '—'}</td>
              <td>{row?.source ?? '未测'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><th colSpan={3}>平均修正直径</th><td colSpan={2}>{state.meanDiameter === null ? '—' : state.meanDiameter.toFixed(3) + ' mm'}</td></tr></tfoot>
      </table>
    </div>
  )
}

function RecordTable({ state }: { state: ResistivitySceneState }) {
  if (state.records.length === 0) return <p className='resistivity-hint'>还没有记录。可连接电路后手动采样，或插入标有“示例”的数据。</p>
  return (
    <div className='resistivity-table-wrap' tabIndex={0} role='region' aria-label='电压电流测量记录'>
      <table className='resistivity-table'>
        <thead><tr><th>#</th><th>l / cm</th><th>U / V</th><th>I / A</th><th>接法</th><th>控制</th><th>量程</th><th>来源</th></tr></thead>
        <tbody>
          {state.records.map((row, index) => (
            <tr key={index}>
              <td>{index + 1}</td><td>{row.l.toFixed(1)}</td>
              <td>{row.U.toFixed(2)}</td><td>{row.I.toFixed(2)}</td>
              <td>{row.method === 'external' ? '外接' : '内接'}</td>
              <td>{row.control === 'limit' ? '限流' : '分压'}</td>
              <td>{METERS[row.ammeter].label} / {METERS[row.voltmeter].label}</td>
              <td>{row.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
