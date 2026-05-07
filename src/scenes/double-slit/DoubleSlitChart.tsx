import { useEffect, useRef } from 'react'
import { drawInterferencePattern, drawWhiteLightPattern, type DoubleSlitParams, type FilterColor } from './model'
import './double-slit.css'

type DoubleSlitChartProps = {
  params: DoubleSlitParams
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  doubleSlitAngle: number
}

export function DoubleSlitChart({ params, isLightOn, isWhiteLight, filterColor, doubleSlitAngle }: DoubleSlitChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const cssSize = 800
    // Sync canvas internal resolution to DPR for crisp rendering
    if (canvas.width !== cssSize * dpr) {
      canvas.width = cssSize * dpr
      canvas.height = cssSize * dpr
    }
    ctx.scale(dpr, dpr)

    const width = cssSize
    const height = cssSize
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) / 2 - 2

    if (!isLightOn) {
      // Light off: draw dark circle with reticle crosshair
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Reticle crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(cx - radius * 0.35, cy)
      ctx.lineTo(cx + radius * 0.35, cy)
      ctx.moveTo(cx, cy - radius * 0.35)
      ctx.lineTo(cx, cy + radius * 0.35)
      ctx.stroke()

      // Small center dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    // Apply rotation for stripe orientation
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(doubleSlitAngle * Math.PI / 180)
    ctx.translate(-cx, -cy)

    if (isWhiteLight) {
      drawWhiteLightPattern(ctx, params, filterColor)
    } else {
      drawInterferencePattern(ctx, params)
    }

    ctx.restore()

    // Overlay reticle crosshair on top of pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(cx - radius * 0.3, cy)
    ctx.lineTo(cx + radius * 0.3, cy)
    ctx.moveTo(cx, cy - radius * 0.3)
    ctx.lineTo(cx, cy + radius * 0.3)
    ctx.stroke()

    // Scale bar: 1mm at bottom
    const spacingM = (params.screenDistance * params.wavelength * 1e-9) / (params.slitDistance * 1e-3)
    const spacingPx = (spacingM / 0.015) * width
    if (spacingPx > 8) {
      const barY = cy + radius * 0.72
      const barStartX = cx - spacingPx / 2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(barStartX, barY)
      ctx.lineTo(barStartX + spacingPx, barY)
      ctx.stroke()

      // Ticks
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
  }, [params, isLightOn, isWhiteLight, filterColor, doubleSlitAngle])

  return (
    <div className="double-slit-chart">
      <h3>毛玻璃上的干涉图样</h3>
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="double-slit-canvas"
      />
      <p className="double-slit-formula">Δx = Lλ / d</p>
    </div>
  )
}
