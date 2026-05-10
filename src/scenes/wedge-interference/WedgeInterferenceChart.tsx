import { useEffect, useRef, useState, useMemo, memo } from 'react'
import { drawWedgePattern, PHYSICAL_VIEW_WIDTH, type WedgeParams } from './model'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'
import './wedge-interference.css'

type WedgeInterferenceChartProps = {
  params: WedgeParams
  isLightOn: boolean
}

export const WedgeInterferenceChart = memo(function WedgeInterferenceChart({ params, isLightOn }: WedgeInterferenceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(() =>
    typeof ResizeObserver === 'undefined' ? 800 : 0
  )
  const perf = useMemo(() => resolvePerformanceProfile(), [])
  const dpr = useMemo(() => typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, perf.canvas.dpr[1]) : 1, [perf])

  const adaptiveScaleRef = useRef(perf.doubleSlitChartScale)
  const frameTimesRef = useRef<number[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const w = Math.round(Math.min(entry.contentRect.width, 800))
      if (w > 0) setCanvasWidth(w)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssW = canvasWidth || 800
    const cssH = Math.round(cssW / 2)
    const scale = adaptiveScaleRef.current
    const renderW = Math.round(cssW * scale)
    const renderH = Math.round(cssH * scale)

    if (canvas.width !== renderW * dpr || canvas.height !== renderH * dpr) {
      canvas.width = renderW * dpr
      canvas.height = renderH * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (!isLightOn) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, renderW, renderH)
      return
    }

    const t0 = performance.now()
    drawWedgePattern(ctx, params)
    const elapsed = performance.now() - t0

    const times = frameTimesRef.current
    times.push(elapsed)
    if (times.length >= 3) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      if (avg > 25) {
        adaptiveScaleRef.current = Math.max(0.35, +(adaptiveScaleRef.current - 0.1).toFixed(2))
        frameTimesRef.current = []
      } else if (avg < 10) {
        adaptiveScaleRef.current = Math.min(perf.doubleSlitChartScale, +(adaptiveScaleRef.current + 0.05).toFixed(2))
        frameTimesRef.current = []
      } else if (times.length >= 6) {
        frameTimesRef.current = []
      }
    }

    // Scale bar: 1 fringe spacing at bottom
    const fringeSpacingM = (params.wavelength * 1e-9) / (2 * Math.sin(params.wedgeAngle * Math.PI / 180))
    const fringePx = (fringeSpacingM / PHYSICAL_VIEW_WIDTH) * renderW
    if (fringePx > 4) {
      const barY = renderH - 12
      const barStartX = renderW / 2 - fringePx / 2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(barStartX, barY)
      ctx.lineTo(barStartX + fringePx, barY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(barStartX, barY - 3)
      ctx.lineTo(barStartX, barY + 3)
      ctx.moveTo(barStartX + fringePx, barY - 3)
      ctx.lineTo(barStartX + fringePx, barY + 3)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('l', renderW / 2, barY + 12)
    }
  }, [params, isLightOn, canvasWidth, perf, dpr])

  return (
    <div className="wedge-chart" ref={containerRef}>
      <h3>劈尖干涉条纹</h3>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="劈尖干涉图样"
        className="wedge-chart-canvas"
      />
      <p className="wedge-formula">l = λ / (2sinθ)</p>
    </div>
  )
})
