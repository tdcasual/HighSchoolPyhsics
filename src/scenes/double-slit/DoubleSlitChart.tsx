import { memo, useEffect, useRef } from 'react'
import { ChartCard } from '../../ui/charts/ChartCard'
import { drawDark, drawReticle, drawScaleBar } from '../../ui/charts/canvasMarks'
import { sizeCanvas, useAdaptiveResolution, useContainerWidth, useSettledQuality } from '../../ui/charts/useAdaptiveCanvas'
import { drawInterferencePattern, drawWhiteLightPattern, setPatternCacheMax, PHYSICAL_VIEW_WIDTH, FILTER_PROFILES, type DoubleSlitParams, type FilterColor } from './model'
import { INITIAL_MEASUREMENT_READOUT_MM } from './measurement'

type DoubleSlitChartProps = {
  params: DoubleSlitParams
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  doubleSlitAngle: number
  singleSlitAngle: number
  eyepieceAngle: number
  wheelReadoutMm: number
  showFringeOrders: boolean
}

/** The ground-glass field through the eyepiece, with the measuring reticle on its own layer. */
export const DoubleSlitChart = memo(function DoubleSlitChart({
  params,
  isLightOn,
  isWhiteLight,
  filterColor,
  doubleSlitAngle,
  singleSlitAngle,
  eyepieceAngle,
  wheelReadoutMm,
  showFringeOrders,
}: DoubleSlitChartProps) {
  const [fieldRef, fieldWidth] = useContainerWidth<HTMLDivElement>(360)
  const patternRef = useRef<HTMLCanvasElement>(null)
  const reticleRef = useRef<HTMLCanvasElement>(null)
  const { perf, dpr, currentScale, measure, revision } = useAdaptiveResolution()
  // White light sums many wavelengths: draw coarsely while a slider moves, finely once it rests.
  const { isFull: isSettled, revision: settledRevision } = useSettledQuality(isWhiteLight, [params, filterColor, doubleSlitAngle, singleSlitAngle])

  useEffect(() => {
    setPatternCacheMax(perf.doubleSlitPatternCacheMax)
  }, [perf.doubleSlitPatternCacheMax])

  useEffect(() => {
    const canvas = patternRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const size = Math.round(fieldWidth * currentScale()) * dpr
    sizeCanvas(canvas, size, size)
    // The model writes ImageData in device pixels, so keep the identity transform here.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (!isLightOn) {
      drawDark(ctx, '#000')
      return
    }
    measure(() => {
      if (isWhiteLight) {
        const step = perf.doubleSlitWhiteLightWavelengthStep * (isSettled() ? 1 : 4)
        drawWhiteLightPattern(ctx, params, filterColor, doubleSlitAngle, singleSlitAngle, step)
      } else {
        drawInterferencePattern(ctx, params, doubleSlitAngle, singleSlitAngle)
      }
    })
  }, [params, isLightOn, isWhiteLight, filterColor, doubleSlitAngle, singleSlitAngle, fieldWidth, perf, dpr, currentScale, measure, revision, isSettled, settledRevision])

  useEffect(() => {
    const canvas = reticleRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const size = Math.round(fieldWidth * currentScale())
    sizeCanvas(canvas, size * dpr, size * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 2
    const offsetX = ((wheelReadoutMm - INITIAL_MEASUREMENT_READOUT_MM) * 1e-3) / PHYSICAL_VIEW_WIDTH * size
    drawReticle(ctx, { cx, cy, radius, angleDeg: eyepieceAngle, offsetX, lit: isLightOn })

    const wavelengthNm = isWhiteLight ? (filterColor === 'none' ? null : FILTER_PROFILES[filterColor].center) : params.wavelength
    const spacingM = wavelengthNm === null ? 0 : (params.screenDistance * wavelengthNm * 1e-9) / (params.slitDistance * 1e-3)
    const spacingPx = (spacingM / PHYSICAL_VIEW_WIDTH) * size
    if (!(spacingPx > 8) || !Number.isFinite(spacingPx)) return
    drawScaleBar(ctx, { x: cx, y: cy + radius * 0.72, length: spacingPx, label: 'Δx' })
    if (showFringeOrders && !isWhiteLight) {
      const maxOrder = Math.min(12, Math.floor(radius / spacingPx))
      ctx.font = '10px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      for (let order = -maxOrder; order <= maxOrder; order += 1) {
        const x = cx + order * spacingPx
        ctx.beginPath()
        ctx.moveTo(x, cy - 5)
        ctx.lineTo(x, cy + 5)
        ctx.stroke()
        ctx.fillText(String(order), x, cy - radius * 0.12)
      }
    }
  }, [eyepieceAngle, wheelReadoutMm, showFringeOrders, isLightOn, isWhiteLight, filterColor, params.screenDistance, params.wavelength, params.slitDistance, fieldWidth, dpr, currentScale, revision])

  const spectrumLabel = filterColor === 'none' ? '白光' : filterColor === 'red' ? '红色滤光片' : filterColor === 'green' ? '绿色滤光片' : '蓝色滤光片'
  return (
    <ChartCard
      title="毛玻璃视场与测量分划板"
      footer={<span className="chart-formula">{isWhiteLight && filterColor === 'none' ? '白光：不同波长的条纹间距不同' : 'Δx = Lλ / d　　λ = dΔx / L'}</span>}
    >
      <div className="chart-field" data-shape="round" ref={fieldRef}>
        <canvas ref={patternRef} role="img" aria-label={isWhiteLight ? spectrumLabel + '双缝干涉图样' : '双缝干涉图样'} />
        <canvas ref={reticleRef} role="img" aria-label="随测量头移动的分划板与亮纹序号" />
      </div>
    </ChartCard>
  )
})
