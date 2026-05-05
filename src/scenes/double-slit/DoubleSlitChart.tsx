import { useEffect, useRef } from 'react'
import { drawInterferencePattern, type DoubleSlitParams } from './model'
import './double-slit.css'

type DoubleSlitChartProps = {
  params: DoubleSlitParams
  isLightOn: boolean
}

export function DoubleSlitChart({ params, isLightOn }: DoubleSlitChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!isLightOn) {
      // Light off: draw a dark circle
      const width = canvas.width
      const height = canvas.height
      const cx = width / 2
      const cy = height / 2
      const radius = Math.min(width, height) / 2 - 2
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      return
    }

    drawInterferencePattern(ctx, params)
  }, [params, isLightOn])

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
