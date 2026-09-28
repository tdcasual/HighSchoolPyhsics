import { useEffect, useRef, useState, memo } from 'react'
import type { Observer } from './model'
import './wave-interference.css'

type Props = {
  observer: Observer | null
  maxAmp: number
  maxHistory: number
}

type CanvasSize = { width: number; height: number; dpr: number }

export const WaveInterferenceChart = memo(function WaveInterferenceChart({ observer, maxAmp, maxHistory }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0, dpr: 1 })

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const measure = () => {
      const rect = container.getBoundingClientRect()
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      if (width <= 0 || height <= 0) return

      const pixelWidth = Math.round(width * dpr)
      const pixelHeight = Math.round(height * dpr)
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight
      setSize((previous) => (
        previous.width === width && previous.height === height && previous.dpr === dpr
          ? previous
          : { width, height, dpr }
      ))
    }

    measure()
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    resizeObserver?.observe(container)
    window.addEventListener('resize', measure)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width <= 0 || size.height <= 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = size.width
    const h = size.height
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const left = 46
    const right = w - 12
    const top = 18
    const bottom = h - 29
    const plotWidth = Math.max(1, right - left)
    const plotHeight = Math.max(1, bottom - top)
    const midY = top + plotHeight / 2
    const amplitudeRange = Math.max(maxAmp * 1.2, 0.01)
    const scaleY = plotHeight / (2 * amplitudeRange)

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const x = left + (plotWidth * i) / 4
      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x, bottom)
      ctx.stroke()
    }
    for (let i = 0; i <= 2; i++) {
      const y = top + (plotHeight * i) / 2
      ctx.beginPath()
      ctx.moveTo(left, y)
      ctx.lineTo(right, y)
      ctx.stroke()
    }

    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(left, bottom)
    ctx.lineTo(right, bottom)
    ctx.moveTo(left, midY)
    ctx.lineTo(right, midY)
    ctx.stroke()

    ctx.fillStyle = '#64748b'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('y / m', 4, 12)
    ctx.fillText('+' + amplitudeRange.toFixed(2), 4, top + 10)
    ctx.fillText('−' + amplitudeRange.toFixed(2), 4, bottom)
    ctx.textAlign = 'right'
    ctx.fillText('t / s', right, 12)
    const history = observer?.history ?? []
    const history1 = observer?.history1 ?? []
    const history2 = observer?.history2 ?? []
    const times = observer?.historyTimes ?? []
    const count = Math.min(history.length, history1.length, history2.length, times.length, maxHistory)

    if (!observer || count < 2) {
      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'center'
      ctx.fillText('等待观察点数据…', left + plotWidth / 2, midY - 8)
      ctx.textAlign = 'right'
      return
    }

    const styles = getComputedStyle(canvas)
    const source1Color = styles.getPropertyValue('--wave-s1-color').trim() || '#ef4444'
    const source2Color = styles.getPropertyValue('--wave-s2-color').trim() || '#3b82f6'
    const combinedColor = styles.getPropertyValue('--wave-composite-color').trim() || '#1f2937'
    const startTime = times[0] ?? 0
    const endTime = times[count - 1] ?? observer.time
    const duration = endTime - startTime
    const xAt = (index: number) => {
      const samplePosition = duration > 1e-6
        ? Math.max(0, Math.min(1, ((times[index] ?? startTime) - startTime) / duration))
        : index / (count - 1)
      return left + samplePosition * plotWidth
    }

    const drawLine = (data: number[], color: string, dashed: boolean, lineWidth: number) => {
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.setLineDash(dashed ? [5, 4] : [])
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        const x = xAt(i)
        const y = midY - data[i] * scaleY
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    drawLine(history1, source1Color, true, 1.5)
    drawLine(history2, source2Color, true, 1.5)
    drawLine(history, combinedColor, false, 2.6)

    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'left'
    ctx.fillText(startTime.toFixed(2), left, h - 5)
    ctx.textAlign = 'right'
    ctx.fillText(endTime.toFixed(2), right, h - 5)
  }, [observer, maxAmp, maxHistory, size])

  return (
    <div className="wave-chart" ref={containerRef}>
      <h3>观察点位移—时间图像（y-t）</h3>
      <div className="wave-chart-canvas-container">
        <canvas ref={canvasRef} className="wave-chart-canvas" />
      </div>
      <div className="wave-chart-legend">
        <span style={{ color: 'var(--wave-s1-color)' }}>┄ S₁ 分波</span>
        <span style={{ color: 'var(--wave-s2-color)' }}>┄ S₂ 分波</span>
        <span style={{ color: 'var(--wave-composite-color)', fontWeight: 'bold' }}>— 合位移</span>
      </div>
    </div>
  )
})
