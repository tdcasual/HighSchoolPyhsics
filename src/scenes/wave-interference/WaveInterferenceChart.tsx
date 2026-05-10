import { useEffect, useRef, memo } from 'react'
import type { Observer } from './model'
import './wave-interference.css'

type Props = {
  observer: Observer | null
  maxAmp: number
  maxHistory: number
}

export const WaveInterferenceChart = memo(function WaveInterferenceChart({ observer, maxAmp, maxHistory }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const w = Math.round(entry.contentRect.width)
      const h = Math.round(entry.contentRect.height)
      const canvas = canvasRef.current
      if (w > 0 && h > 0 && canvas) {
        canvas.width = w
        canvas.height = h
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    if (w <= 0 || h <= 0) return

    ctx.clearRect(0, 0, w, h)

    // Background grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
    ctx.lineWidth = 1
    for (let i = 1; i < 5; i++) {
      const y = (h / 5) * i
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    if (!observer || observer.history.length < 2) {
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('等待观察点数据...', w / 2, h / 2)
      return
    }

    const midY = h / 2
    const scaleY = (h / 2 - 10) / (maxAmp * 1.2 || 1)

    function drawLine(c: CanvasRenderingContext2D, data: number[], color: string, dashed: boolean, lineWidth: number) {
      c.strokeStyle = color
      c.lineWidth = lineWidth
      c.setLineDash(dashed ? [4, 3] : [])
      c.beginPath()
      for (let i = 0; i < data.length; i++) {
        const x = (i / (maxHistory - 1)) * w
        const y = midY - data[i] * scaleY
        if (i === 0) c.moveTo(x, y)
        else c.lineTo(x, y)
      }
      c.stroke()
      c.setLineDash([])
    }

    drawLine(ctx, observer.history1, 'rgba(239, 68, 68, 0.5)', true, 1.5)
    drawLine(ctx, observer.history2, 'rgba(59, 130, 246, 0.5)', true, 1.5)
    drawLine(ctx, observer.history, '#8b5cf6', false, 3)

    // Time axis
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke()

    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('t →', w - 25, midY - 8)
    ctx.fillText('+A', 5, 15)
    ctx.fillText('-A', 5, h - 5)
  }, [observer, maxAmp, maxHistory])

  return (
    <div className="wave-chart" ref={containerRef}>
      <h3>观察点振动图像 (X-t)</h3>
      <div className="wave-chart-canvas-container">
        <canvas ref={canvasRef} className="wave-chart-canvas" />
      </div>
      <div className="wave-chart-legend">
        <span style={{ color: 'rgba(239,68,68,0.8)' }}>— S₁</span>
        <span style={{ color: 'rgba(59,130,246,0.8)' }}>— S₂</span>
        <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>— 合成波</span>
      </div>
    </div>
  )
})
