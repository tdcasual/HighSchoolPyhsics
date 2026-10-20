import { memo, useEffect, useRef } from 'react'
import { ChartCard } from '../../ui/charts/ChartCard'
import { drawDark, drawReticle, drawScaleBar } from '../../ui/charts/canvasMarks'
import { sizeCanvas, useAdaptiveResolution, useContainerWidth, useSettledQuality } from '../../ui/charts/useAdaptiveCanvas'
import {
  drawDiffractionPattern,
  drawWhiteLightPattern,
  setPatternCacheMax,
  drawDiffractionProfile,
  singleSlitCentralWidth,
  airyDiskRadius,
  poissonSpotFirstDarkRadius,
  gratingFirstOrderDisplacement,
  getPhysicalViewWidth,
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
} from './model'

type LightDiffractionChartProps = {
  params: DiffractionParams
  mode: DiffractionMode
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  eyepieceAngle?: number
}

const TITLES: Record<DiffractionMode, string> = {
  'single-slit': '单缝衍射图样',
  'circular-aperture': '圆孔衍射图样',
  'circular-obstacle': '圆盘衍射 / 泊松亮斑',
  'diffraction-grating': '光栅衍射图样',
}

const FORMULAS: Record<DiffractionMode, string> = {
  'single-slit': 'I(y)=sinc²(πa sinθ/λ),  Δy₀≈2λL/a',
  'circular-aperture': 'r = 1.22λL / D',
  'circular-obstacle': '近轴泊松亮斑：I(r)/I₀ ≈ J₀²(πDr/(λL))',
  'diffraction-grating': 'd·sinθ = mλ；屏上位置 y = L·tanθ',
}

/** The size the scale bar marks: the central maximum, the first dark ring or the first order. */
function featureWidthM(mode: DiffractionMode, params: DiffractionParams): number {
  if (mode === 'single-slit') return singleSlitCentralWidth(params)
  if (mode === 'circular-aperture') return airyDiskRadius(params)
  if (mode === 'circular-obstacle') return poissonSpotFirstDarkRadius(params)
  return gratingFirstOrderDisplacement(params)
}

export const LightDiffractionChart = memo(function LightDiffractionChart({
  params,
  mode,
  isLightOn,
  isWhiteLight,
  filterColor,
  eyepieceAngle = 0,
}: LightDiffractionChartProps) {
  const [fieldRef, fieldWidth] = useContainerWidth<HTMLDivElement>(360)
  const patternRef = useRef<HTMLCanvasElement>(null)
  const reticleRef = useRef<HTMLCanvasElement>(null)
  const profileRef = useRef<HTMLCanvasElement>(null)
  const { perf, dpr, currentScale, measure, revision } = useAdaptiveResolution()
  const { isFull: isSettled, revision: settledRevision } = useSettledQuality(isWhiteLight, [params, mode, filterColor])

  useEffect(() => {
    setPatternCacheMax(perf.doubleSlitPatternCacheMax ?? 6)
  }, [perf.doubleSlitPatternCacheMax])

  useEffect(() => {
    const canvas = patternRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const size = Math.round(fieldWidth * currentScale() * dpr)
    sizeCanvas(canvas, size, size)
    if (!isLightOn) {
      drawDark(ctx, '#0a0a0a')
      return
    }
    const fullStep = perf.doubleSlitWhiteLightWavelengthStep ?? 5
    measure(() => {
      if (isWhiteLight) drawWhiteLightPattern(ctx, mode, params, filterColor, fullStep * (isSettled() ? 1 : 3))
      else drawDiffractionPattern(ctx, params, mode)
    })
  }, [fieldWidth, params, mode, isLightOn, isWhiteLight, filterColor, dpr, perf, currentScale, measure, revision, isSettled, settledRevision])

  useEffect(() => {
    const canvas = reticleRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const size = fieldWidth
    sizeCanvas(canvas, size * dpr, size * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 2
    drawReticle(ctx, { cx, cy, radius, angleDeg: eyepieceAngle, lit: isLightOn })
    // White light: mark the reddest (widest) pattern.
    const viewParams = { ...params, wavelength: isWhiteLight ? 700 : params.wavelength }
    const barPx = (featureWidthM(mode, viewParams) / getPhysicalViewWidth(mode, viewParams)) * size
    if (barPx > 8 && barPx < size * 0.6) {
      drawScaleBar(ctx, {
        x: cx,
        y: cy + radius * 0.72,
        length: barPx,
        from: mode === 'single-slit' ? 'center' : 'start',
        label: mode === 'single-slit' ? 'Δy₀' : mode === 'diffraction-grating' ? 'y₁' : 'r₁',
        alpha: 0.45,
      })
    }
  }, [fieldWidth, dpr, eyepieceAngle, isLightOn, isWhiteLight, mode, params])

  useEffect(() => {
    const canvas = profileRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const width = Math.round(fieldWidth * dpr)
    const height = Math.round(fieldWidth * 0.4 * dpr)
    sizeCanvas(canvas, width, height)
    if (!isLightOn) {
      drawDark(ctx, '#0a0a0a')
      return
    }
    drawDiffractionProfile(ctx, mode, params, width, height, isWhiteLight, filterColor)
  }, [fieldWidth, params, mode, isLightOn, isWhiteLight, filterColor, dpr])

  return (
    <ChartCard title={TITLES[mode]} footer={<span className="chart-formula">{FORMULAS[mode]}</span>}>
      <div className="chart-field" data-shape="round" ref={fieldRef}>
        <canvas ref={patternRef} role="img" aria-label="衍射图样" />
        <canvas ref={reticleRef} data-layer="reticle" role="img" aria-label="十字准线与标尺" />
      </div>
      <div className="chart-field">
        <canvas ref={profileRef} role="img" aria-label="强度分布曲线" />
      </div>
    </ChartCard>
  )
})
