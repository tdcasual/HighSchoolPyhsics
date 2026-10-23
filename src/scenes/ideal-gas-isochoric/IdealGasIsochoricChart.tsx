import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Cursor, Dot, Label, Segment, Series } from '../../ui/charts/ChartFrame'
import {
  buildIsochoricTraceSegment,
  type IsochoricAxis,
  type VolumePreset,
  VOLUME_PRESETS,
  IDEAL_GAS_CONSTANTS,
  ISOCHORIC_TEMPERATURE_RANGE,
} from './model'
import type { IdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'

const MAX_PRESSURE = 4.8
const VOLUMES: Record<VolumePreset, { color: string; label: string }> = {
  small: { color: 'var(--chart-2)', label: 'V₁' },
  medium: { color: 'var(--chart-3)', label: 'V₂' },
  large: { color: 'var(--chart-1)', label: 'V₃' },
}
const PRESETS = Object.keys(VOLUME_PRESETS) as VolumePreset[]

function IsochoricPlot({ state, axis }: { state: IdealGasIsochoricSceneState; axis: IsochoricAxis }) {
  const absoluteZero = IDEAL_GAS_CONSTANTS.absoluteZeroC
  const xMin = axis === 'kelvin' ? 0 : absoluteZero
  const xMax = axis === 'kelvin' ? ISOCHORIC_TEMPERATURE_RANGE.maxK : ISOCHORIC_TEMPERATURE_RANGE.maxK + absoluteZero
  const measuredMin =
    axis === 'kelvin' ? ISOCHORIC_TEMPERATURE_RANGE.minK : ISOCHORIC_TEMPERATURE_RANGE.minK + absoluteZero
  const currentX = axis === 'kelvin' ? state.temperatureK : state.readings.celsius
  const xTicks = Array.from({ length: 5 }, (_, index) => {
    const value = xMin + ((xMax - xMin) * index) / 4
    return { value, label: String(Math.round(value)) }
  })
  return (
    <ChartFrame
      title={axis === 'kelvin' ? 'p–T 图像（热力学温度）' : 'p–t 图像（摄氏温度）'}
      ariaLabel={axis === 'kelvin' ? '压强与热力学温度图像' : '压强与摄氏温度图像'}
      xDomain={[xMin, xMax]}
      yDomain={[0, MAX_PRESSURE]}
      xTicks={xTicks}
      yTicks={[0, 1.2, 2.4, 3.6, 4.8]}
      formatY={(value) => (value === 0 ? '0' : value.toFixed(1))}
      xLabel={axis === 'kelvin' ? 'T / K' : 't / °C'}
      yLabel="p / atm"
      height={220}
      pad={{ right: 30 }}
      clip={false}
    >
      {(plot) => (
        <>
          {axis === 'celsius' ? (
            <>
              <Segment
                plot={plot}
                from={[absoluteZero, 0]}
                to={[absoluteZero, MAX_PRESSURE]}
                color="var(--chart-6)"
                dashed="3 3"
                strokeWidth={1.4}
              />
              <Label plot={plot} x={absoluteZero} y={MAX_PRESSURE} dx={4} dy={12}>
                0 K
              </Label>
            </>
          ) : null}
          {PRESETS.map((key) => {
            const selected = key === state.volumePreset
            const { volumeL } = VOLUME_PRESETS[key]
            const end = buildIsochoricTraceSegment(volumeL, axis, xMax, xMax, 2)[1][1]
            return (
              <g key={key} opacity={selected ? 1 : 0.45}>
                <Series
                  plot={plot}
                  points={buildIsochoricTraceSegment(volumeL, axis, measuredMin, xMax, 81)}
                  color={VOLUMES[key].color}
                  strokeWidth={selected ? 3 : 1.8}
                />
                <Series
                  plot={plot}
                  points={buildIsochoricTraceSegment(volumeL, axis, xMin, measuredMin, 25)}
                  color={VOLUMES[key].color}
                  strokeWidth={selected ? 2.2 : 1.4}
                  dashed
                />
                <Label plot={plot} x={xMax} y={end} dx={4} dy={4} color={VOLUMES[key].color}>
                  {VOLUMES[key].label}
                </Label>
              </g>
            )
          })}
          <Cursor plot={plot} x={currentX} />
          <Dot plot={plot} x={currentX} y={state.readings.pressureAtm} color="var(--chart-point)" ring />
          <Label
            plot={plot}
            x={currentX}
            y={state.readings.pressureAtm}
            dx={plot.x(currentX) > plot.right - 42 ? -6 : 6}
            dy={-8}
            anchor={plot.x(currentX) > plot.right - 42 ? 'end' : 'start'}
          >
            {state.readings.pressureAtm.toFixed(2)}
          </Label>
        </>
      )}
    </ChartFrame>
  )
}

export function IdealGasIsochoricChart({ state }: { state: IdealGasIsochoricSceneState }) {
  return (
    <ChartCard
      title="等容线图像联动"
      status={<>{state.running ? '分子热运动中' : '已暂停'} · n 固定，p/T = nR/V</>}
      legend={[
        ...PRESETS.map((key) => ({
          label: `${VOLUMES[key].label} = ${VOLUME_PRESETS[key].volumeL.toFixed(1)} L`,
          color: VOLUMES[key].color,
        })),
        { label: '外推至 0 K（−273.15 °C）', color: 'var(--chart-6)', shape: 'dash' as const },
      ]}
      footer="实线：100–420 K 测量范围；虚线：外推"
    >
      <IsochoricPlot state={state} axis="kelvin" />
      <IsochoricPlot state={state} axis="celsius" />
    </ChartCard>
  )
}
