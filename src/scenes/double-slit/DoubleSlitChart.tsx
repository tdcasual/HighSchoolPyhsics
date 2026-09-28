import { useEffect, useRef, useState, memo, useMemo } from 'react'
import { drawInterferencePattern, drawWhiteLightPattern, setPatternCacheMax, PHYSICAL_VIEW_WIDTH, FILTER_PROFILES, type DoubleSlitParams, type FilterColor } from './model'
import { INITIAL_MEASUREMENT_READOUT_MM } from './measurement'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'
import './double-slit.css'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const patternCanvasRef = useRef<HTMLCanvasElement>(null)
  const reticleCanvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState(() =>
    typeof ResizeObserver === 'undefined' ? 800 : 0
  )
  const [renderRevision, setRenderRevision] = useState(0)
  const perf = useMemo(() => resolvePerformanceProfile(), [])
  const dpr = useMemo(() => typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, perf.canvas.dpr[1]) : 1, [perf])

  const adaptiveScaleRef = useRef(perf.doubleSlitChartScale)
  const frameTimesRef = useRef<number[]>([])
  const wlFullQualityRef = useRef(true)
  const qualityTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isWhiteLight) {
      if (qualityTimerRef.current !== null) window.clearTimeout(qualityTimerRef.current)
      qualityTimerRef.current = null
      wlFullQualityRef.current = true
      return
    }
    wlFullQualityRef.current = false
    if (qualityTimerRef.current !== null) window.clearTimeout(qualityTimerRef.current)
    qualityTimerRef.current = window.setTimeout(() => {
      wlFullQualityRef.current = true
      setRenderRevision((revision) => revision + 1)
    }, 200)
    return () => {
      if (qualityTimerRef.current !== null) window.clearTimeout(qualityTimerRef.current)
      qualityTimerRef.current = null
    }
  }, [params, isWhiteLight, filterColor, doubleSlitAngle, singleSlitAngle])

  useEffect(() => {
    setPatternCacheMax(perf.doubleSlitPatternCacheMax)
  }, [perf.doubleSlitPatternCacheMax])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const width = Math.round(Math.min(entry.contentRect.width, 800))
      if (width > 0) setCanvasSize((current) => current === width ? current : width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = patternCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssSize = canvasSize || 800
    const renderCssSize = Math.round(cssSize * adaptiveScaleRef.current)
    const pixelSize = renderCssSize * dpr
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize
      canvas.height = pixelSize
    }

    // The model writes ImageData and draws its border in device-pixel coordinates.
    // Keep an identity transform here; DPR scaling belongs to the reticle canvas only.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (!isLightOn) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    const startedAt = performance.now()
    if (isWhiteLight) {
      const wavelengthStep = wlFullQualityRef.current
        ? perf.doubleSlitWhiteLightWavelengthStep
        : perf.doubleSlitWhiteLightWavelengthStep * 4
      drawWhiteLightPattern(ctx, params, filterColor, doubleSlitAngle, singleSlitAngle, wavelengthStep)
    } else {
      drawInterferencePattern(ctx, params, doubleSlitAngle, singleSlitAngle)
    }

    const times = frameTimesRef.current
    times.push(performance.now() - startedAt)
    if (times.length > 3) times.shift()
    if (times.length === 3) {
      const average = times.reduce((sum, value) => sum + value, 0) / times.length
      const currentScale = adaptiveScaleRef.current
      const nextScale = average > 25
        ? Math.max(0.35, +(currentScale - 0.1).toFixed(2))
        : average < 10
          ? Math.min(perf.doubleSlitChartScale, +(currentScale + 0.05).toFixed(2))
          : currentScale
      if (nextScale !== currentScale) {
        adaptiveScaleRef.current = nextScale
        times.length = 0
        setRenderRevision((revision) => revision + 1)
      }
    }
  }, [params, isLightOn, isWhiteLight, filterColor, doubleSlitAngle, singleSlitAngle, canvasSize, perf, dpr, renderRevision])

  useEffect(() => {
    const canvas = reticleCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssSize = canvasSize || 800
    const renderCssSize = Math.round(cssSize * adaptiveScaleRef.current)
    const pixelSize = renderCssSize * dpr
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize
      canvas.height = pixelSize
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, renderCssSize, renderCssSize)

    const cx = renderCssSize / 2
    const cy = renderCssSize / 2
    const radius = renderCssSize / 2 - 2
    const wheelOffsetMm = wheelReadoutMm - INITIAL_MEASUREMENT_READOUT_MM
    const reticleOffsetPx = wheelOffsetMm * 1e-3 / PHYSICAL_VIEW_WIDTH * renderCssSize

    if (!isLightOn) {
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.clip()
    ctx.translate(cx + reticleOffsetPx, cy)
    ctx.rotate(eyepieceAngle * Math.PI / 180)
    ctx.strokeStyle = isLightOn ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.75)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-radius * 0.48, 0)
    ctx.lineTo(radius * 0.48, 0)
    ctx.moveTo(0, -radius * 0.48)
    ctx.lineTo(0, radius * 0.48)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(0, 0, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    const displayWavelengthNm = isWhiteLight
      ? filterColor === 'none' ? null : FILTER_PROFILES[filterColor].center
      : params.wavelength
    const spacingM = displayWavelengthNm === null ? 0 : (params.screenDistance * displayWavelengthNm * 1e-9) / (params.slitDistance * 1e-3)
    const spacingPx = spacingM / PHYSICAL_VIEW_WIDTH * renderCssSize
    if (spacingPx > 8 && Number.isFinite(spacingPx)) {
      const barY = cy + radius * 0.72
      const barStartX = cx - spacingPx / 2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(barStartX, barY)
      ctx.lineTo(barStartX + spacingPx, barY)
      ctx.moveTo(barStartX, barY - 3)
      ctx.lineTo(barStartX, barY + 3)
      ctx.moveTo(barStartX + spacingPx, barY - 3)
      ctx.lineTo(barStartX + spacingPx, barY + 3)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Δx', cx, barY + 12)
    }

    if (showFringeOrders && !isWhiteLight && spacingPx > 8 && Number.isFinite(spacingPx)) {
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
  }, [eyepieceAngle, wheelReadoutMm, showFringeOrders, isLightOn, isWhiteLight, params.screenDistance, params.wavelength, params.slitDistance, canvasSize, dpr, perf, renderRevision])

  const spectrumLabel = filterColor === 'none' ? '白光' : filterColor === 'red' ? '红色滤光片' : filterColor === 'green' ? '绿色滤光片' : '蓝色滤光片'

  return (
    <div className="double-slit-chart" ref={containerRef}>
      <h3>毛玻璃视场与测量分划板</h3>
      <div className="double-slit-canvas-stack">
        <canvas
          ref={patternCanvasRef}
          role="img"
          aria-label={isWhiteLight ? spectrumLabel + '双缝干涉图样' : '双缝干涉图样'}
          className="double-slit-canvas double-slit-canvas-layer"
        />
        <canvas
          ref={reticleCanvasRef}
          role="img"
          aria-label="随测量头移动的分划板与亮纹序号"
          className="double-slit-canvas double-slit-canvas-layer"
        />
      </div>
      <p className="double-slit-formula">{isWhiteLight && filterColor === 'none' ? '白光：不同波长的条纹间距不同' : 'Δx = Lλ / d　　λ = dΔx / L'}</p>
    </div>
  )
})
