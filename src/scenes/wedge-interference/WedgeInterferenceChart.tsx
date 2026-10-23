import { memo, useEffect, useRef } from 'react'
import { ChartCard } from '../../ui/charts/ChartCard'
import { drawDark, drawScaleBar } from '../../ui/charts/canvasMarks'
import { sizeCanvas, useAdaptiveResolution, useContainerWidth } from '../../ui/charts/useAdaptiveCanvas'
import { drawWedgePattern, PHYSICAL_VIEW_WIDTH, type WedgeParams } from './model'

type WedgeInterferenceChartProps = {
  params: WedgeParams
  isLightOn: boolean
}

export const WedgeInterferenceChart = memo(function WedgeInterferenceChart({
  params,
  isLightOn,
}: WedgeInterferenceChartProps) {
  const [fieldRef, fieldWidth] = useContainerWidth<HTMLDivElement>(360)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { dpr, currentScale, measure, revision } = useAdaptiveResolution()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const width = Math.round(fieldWidth * currentScale())
    const height = Math.round(width / 2)
    sizeCanvas(canvas, width * dpr, height * dpr)
    if (!isLightOn) {
      drawDark(ctx, '#000')
      return
    }
    // The pattern fills the backing store; the scale bar is drawn in CSS-scaled pixels.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    measure(() => drawWedgePattern(ctx, params))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const fringeSpacingM = (params.wavelength * 1e-9) / (2 * Math.tan((params.wedgeAngle * Math.PI) / 180))
    const fringePx = (fringeSpacingM / PHYSICAL_VIEW_WIDTH) * width
    if (fringePx > 4) drawScaleBar(ctx, { x: width / 2, y: height - 12, length: fringePx, label: 'l' })
  }, [params, isLightOn, fieldWidth, dpr, currentScale, measure, revision])

  return (
    <ChartCard
      title="劈尖干涉条纹"
      footer={<span className="chart-formula">l = λ / (2tanθ) ≈ λ / (2θ)，θ 用弧度</span>}
    >
      <div className="chart-field" ref={fieldRef}>
        <canvas ref={canvasRef} role="img" aria-label="劈尖干涉图样" />
      </div>
    </ChartCard>
  )
})
