import { useEffect, useRef, useState, memo, useMemo } from 'react'
import { drawInterferencePattern, drawWhiteLightPattern, type DoubleSlitParams, type FilterColor } from './model'
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
}

export const DoubleSlitChart = memo(function DoubleSlitChart({ params, isLightOn, isWhiteLight, filterColor, doubleSlitAngle, singleSlitAngle, eyepieceAngle }: DoubleSlitChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const patternCanvasRef = useRef<HTMLCanvasElement>(null)
  const reticleCanvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState(0)
  const perf = useMemo(() => resolvePerformanceProfile(), [])

  // Responsive canvas sizing
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const w = Math.round(Math.min(entry.contentRect.width, 800))
      if (w > 0 && w !== canvasSize) {
        setCanvasSize(w)
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Pattern rendering (depends on physics params, NOT eyepieceAngle)
  useEffect(() => {
    const canvas = patternCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, perf.canvas.dpr[1]) : 1
    const cssSize = canvasSize || 800
    const renderCssSize = Math.round(cssSize * perf.doubleSlitChartScale)
    if (canvas.width !== renderCssSize * dpr || canvas.height !== renderCssSize * dpr) {
      canvas.width = renderCssSize * dpr
      canvas.height = renderCssSize * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (!isLightOn) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, renderCssSize, renderCssSize)
      return
    }

    if (isWhiteLight) {
      drawWhiteLightPattern(ctx, params, filterColor, doubleSlitAngle, singleSlitAngle, perf.doubleSlitWhiteLightWavelengthStep)
    } else {
      drawInterferencePattern(ctx, params, doubleSlitAngle, singleSlitAngle)
    }
  }, [params, isLightOn, isWhiteLight, filterColor, doubleSlitAngle, singleSlitAngle, canvasSize, perf])

  // Reticle overlay (depends ONLY on eyepieceAngle and canvas size)
  useEffect(() => {
    const canvas = reticleCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, perf.canvas.dpr[1]) : 1
    const cssSize = canvasSize || 800
    const renderCssSize = Math.round(cssSize * perf.doubleSlitChartScale)
    if (canvas.width !== renderCssSize * dpr || canvas.height !== renderCssSize * dpr) {
      canvas.width = renderCssSize * dpr
      canvas.height = renderCssSize * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, renderCssSize, renderCssSize)

    const cx = renderCssSize / 2
    const cy = renderCssSize / 2
    const radius = Math.min(renderCssSize, renderCssSize) / 2 - 2

    if (!isLightOn) {
      // Dark circle border
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Reticle crosshair
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(eyepieceAngle * Math.PI / 180)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(-radius * 0.45, 0)
      ctx.lineTo(radius * 0.45, 0)
      ctx.moveTo(0, -radius * 0.45)
      ctx.lineTo(0, radius * 0.45)
      ctx.stroke()
      ctx.restore()

      // Center dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.beginPath()
      ctx.arc(cx, cy, 2, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    // Reticle crosshair on top of pattern
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(eyepieceAngle * Math.PI / 180)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(-radius * 0.4, 0)
    ctx.lineTo(radius * 0.4, 0)
    ctx.moveTo(0, -radius * 0.4)
    ctx.lineTo(0, radius * 0.4)
    ctx.stroke()
    ctx.restore()

    // Scale bar: 1 fringe spacing at bottom
    const spacingM = (params.screenDistance * params.wavelength * 1e-9) / (params.slitDistance * 1e-3)
    const spacingPx = (spacingM / 0.02) * renderCssSize
    if (spacingPx > 8) {
      const barY = cy + radius * 0.72
      const barStartX = cx - spacingPx / 2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(barStartX, barY)
      ctx.lineTo(barStartX + spacingPx, barY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(barStartX, barY - 3)
      ctx.lineTo(barStartX, barY + 3)
      ctx.moveTo(barStartX + spacingPx, barY - 3)
      ctx.lineTo(barStartX + spacingPx, barY + 3)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '10px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Δx', cx, barY + 12)
    }
  }, [eyepieceAngle, isLightOn, params.screenDistance, params.wavelength, params.slitDistance, canvasSize, perf])

  return (
    <div className="double-slit-chart" ref={containerRef}>
      <h3>毛玻璃上的干涉图样</h3>
      <div className="double-slit-canvas-stack">
        <canvas
          ref={patternCanvasRef}
          className="double-slit-canvas double-slit-canvas-layer"
        />
        <canvas
          ref={reticleCanvasRef}
          className="double-slit-canvas double-slit-canvas-layer"
        />
      </div>
      <p className="double-slit-formula">Δx = Lλ / d</p>
    </div>
  )
})
