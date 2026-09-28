import { useEffect, useRef, useState, memo, useMemo } from 'react'
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
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'
import './light-diffraction.css'

type LightDiffractionChartProps = {
  params: DiffractionParams
  mode: DiffractionMode
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  eyepieceAngle?: number
}

export const LightDiffractionChart = memo(function LightDiffractionChart({
  params: diffractionParams,
  mode,
  isLightOn,
  isWhiteLight,
  filterColor,
  eyepieceAngle = 0,
}: LightDiffractionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const patternCanvasRef = useRef<HTMLCanvasElement>(null)
  const reticleCanvasRef = useRef<HTMLCanvasElement>(null)
  const profileCanvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState(() =>
    typeof ResizeObserver === 'undefined' ? 400 : 0,
  )
  const [qualityRevision, setQualityRevision] = useState(0)
  const perf = useMemo(() => resolvePerformanceProfile(), [])
  const dpr = useMemo(
    () => (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, perf.canvas.dpr[1]) : 1),
    [perf],
  )

  const adaptiveScaleRef = useRef(perf.doubleSlitChartScale ?? 1.0)
  const frameTimesRef = useRef<number[]>([])
  const wlStepRef = useRef(5)
  const qualityTimerRef = useRef(0)
  const qualityFrameRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (qualityFrameRef.current !== null) window.cancelAnimationFrame(qualityFrameRef.current)
  }, [])

  useEffect(() => {
    const fullStep = perf.doubleSlitWhiteLightWavelengthStep ?? 5
    if (!isWhiteLight) {
      clearTimeout(qualityTimerRef.current)
      wlStepRef.current = fullStep
      return
    }
    // Coarse quality immediately; the draw effect will run because
    // diffractionParams / mode / isWhiteLight / filterColor are in its deps.
    wlStepRef.current = fullStep * 3
    clearTimeout(qualityTimerRef.current)
    qualityTimerRef.current = window.setTimeout(() => {
      wlStepRef.current = fullStep
      // Trigger re-render so the draw effect picks up the full quality step
      setQualityRevision((revision) => revision + 1)
    }, 200)
    return () => clearTimeout(qualityTimerRef.current)
  }, [diffractionParams, mode, isWhiteLight, filterColor, perf])

  useEffect(() => {
    setPatternCacheMax(perf.doubleSlitPatternCacheMax ?? 6)
  }, [perf.doubleSlitPatternCacheMax])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const w = Math.round(Math.min(entry.contentRect.width, 800))
      if (w > 0) setCanvasSize(w)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Pattern rendering
  useEffect(() => {
    const canvas = patternCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssSize = canvasSize || 400
    const scale = adaptiveScaleRef.current
    const internalSize = Math.round(cssSize * scale * dpr)

    canvas.style.width = `${cssSize}px`
    canvas.style.height = `${cssSize}px`
    if (canvas.width !== internalSize || canvas.height !== internalSize) {
      canvas.width = internalSize
      canvas.height = internalSize
    }

    if (!isLightOn) {
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, internalSize, internalSize)
      return
    }

    const t0 = performance.now()

    if (isWhiteLight) {
      drawWhiteLightPattern(ctx, mode, diffractionParams, filterColor, wlStepRef.current)
    } else {
      drawDiffractionPattern(ctx, diffractionParams, mode)
    }

    // Adaptive resolution: scale down when draw time > 25ms, up when < 10ms
    const elapsed = performance.now() - t0
    const times = frameTimesRef.current
    times.push(elapsed)
    if (times.length >= 3) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      if (avg > 25) {
        const nextScale = Math.max(0.35, +(adaptiveScaleRef.current - 0.1).toFixed(2))
        frameTimesRef.current = []
        if (nextScale !== adaptiveScaleRef.current) {
          adaptiveScaleRef.current = nextScale
          if (qualityFrameRef.current === null) {
            qualityFrameRef.current = window.requestAnimationFrame(() => {
              qualityFrameRef.current = null
              setQualityRevision((revision) => revision + 1)
            })
          }
        }
      } else if (avg < 10) {
        const nextScale = Math.min(perf.doubleSlitChartScale ?? 1.0, +(adaptiveScaleRef.current + 0.05).toFixed(2))
        frameTimesRef.current = []
        if (nextScale !== adaptiveScaleRef.current) {
          adaptiveScaleRef.current = nextScale
          if (qualityFrameRef.current === null) {
            qualityFrameRef.current = window.requestAnimationFrame(() => {
              qualityFrameRef.current = null
              setQualityRevision((revision) => revision + 1)
            })
          }
        }
      }
    }
  }, [canvasSize, diffractionParams, mode, isLightOn, isWhiteLight, filterColor, dpr, perf, qualityRevision])

  // Reticle overlay
  useEffect(() => {
    const canvas = reticleCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cssSize = canvasSize || 400
    const scale = adaptiveScaleRef.current
    const internalSize = Math.round(cssSize * scale * dpr)
    if (canvas.width !== internalSize || canvas.height !== internalSize) {
      canvas.width = internalSize
      canvas.height = internalSize
    }
    canvas.style.width = `${cssSize}px`
    canvas.style.height = `${cssSize}px`
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
    ctx.clearRect(0, 0, cssSize, cssSize)

    const cx = cssSize / 2
    const cy = cssSize / 2
    const radius = Math.min(cssSize, cssSize) / 2 - 2

    if (!isLightOn) {
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((eyepieceAngle * Math.PI) / 180)
    ctx.strokeStyle = isLightOn ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-radius * 0.48, 0)
    ctx.lineTo(radius * 0.48, 0)
    ctx.moveTo(0, -radius * 0.48)
    ctx.lineTo(0, radius * 0.48)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = isLightOn ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fill()

    // Scale bar: central feature width
    const viewParams = { ...diffractionParams, wavelength: isWhiteLight ? 700 : diffractionParams.wavelength }
    const featureWidthMm =
      mode === 'single-slit'
        ? singleSlitCentralWidth(viewParams) * 1e3
        : mode === 'circular-aperture'
          ? airyDiskRadius(viewParams) * 1e3
          : mode === 'circular-obstacle'
            ? poissonSpotFirstDarkRadius(viewParams) * 1e3
            : gratingFirstOrderDisplacement(viewParams) * 1e3
    const physicalViewWidthMm = getPhysicalViewWidth(mode, viewParams) * 1000
    const pxPerMm = cssSize / physicalViewWidthMm
    const barPx = featureWidthMm * pxPerMm
    if (barPx > 8 && barPx < cssSize * 0.6) {
      const barY = cy + radius * 0.72
      const barStartX = mode === 'single-slit' ? cx - barPx / 2 : cx
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(barStartX, barY)
      ctx.lineTo(barStartX + barPx, barY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(barStartX, barY - 3)
      ctx.lineTo(barStartX, barY + 3)
      ctx.moveTo(barStartX + barPx, barY - 3)
      ctx.lineTo(barStartX + barPx, barY + 3)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      const scaleLabel = mode === 'single-slit' ? 'Δy₀' : mode === 'diffraction-grating' ? 'y₁' : 'r₁'
      ctx.fillText(scaleLabel, barStartX + barPx / 2, barY + 12)
    }
  }, [canvasSize, dpr, eyepieceAngle, isLightOn, isWhiteLight, mode, diffractionParams, qualityRevision])

  // Profile curve rendering
  useEffect(() => {
    const canvas = profileCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cssW = canvasSize || 400
    const cssH = Math.round(cssW * 0.4)
    const internalW = Math.round(cssW * dpr)
    const internalH = Math.round(cssH * dpr)

    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    if (canvas.width !== internalW || canvas.height !== internalH) {
      canvas.width = internalW
      canvas.height = internalH
    }

    if (!isLightOn) {
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, internalW, internalH)
      return
    }

    drawDiffractionProfile(ctx, mode, diffractionParams, internalW, internalH, isWhiteLight, filterColor)
  }, [canvasSize, diffractionParams, mode, isLightOn, isWhiteLight, filterColor, dpr])

  const chartTitle =
    mode === 'single-slit'
      ? '单缝衍射图样'
      : mode === 'circular-aperture'
        ? '圆孔衍射图样'
        : mode === 'circular-obstacle'
          ? '圆盘衍射 / 泊松亮斑'
          : '光栅衍射图样'

  const formula =
    mode === 'single-slit'
      ? 'I(y)=sinc²(πa sinθ/λ),  Δy₀≈2λL/a'
      : mode === 'circular-aperture'
        ? 'r = 1.22λL / D'
        : mode === 'circular-obstacle'
          ? '近轴泊松亮斑：I(r)/I₀ ≈ J₀²(πDr/(λL))'
          : 'd·sinθ = mλ；屏上位置 y = L·tanθ'

  return (
    <div ref={containerRef} className="diffraction-chart-stack">
      <h3 className="diffraction-chart-title">{chartTitle}</h3>
      <div className="diffraction-pattern-container diffraction-pattern-stack">
        <canvas
          ref={patternCanvasRef}
          className="diffraction-pattern-canvas diffraction-pattern-layer"
          role="img"
          aria-label="衍射图样"
        />
        <canvas
          ref={reticleCanvasRef}
          className="diffraction-pattern-canvas diffraction-pattern-layer"
          data-layer="reticle"
          role="img"
          aria-label="十字准线与标尺"
        />
      </div>
      <div className="diffraction-profile-container">
        <canvas
          ref={profileCanvasRef}
          className="diffraction-profile-canvas"
          role="img"
          aria-label="强度分布曲线"
        />
      </div>
      <p className="diffraction-formula">{formula}</p>
    </div>
  )
})
