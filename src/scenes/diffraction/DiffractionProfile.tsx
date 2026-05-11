import { useRef, useEffect, memo } from 'react'
import {
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
  getIntensityFunction,
  getPhysicalViewWidth,
  waveLengthToRGB,
  FILTER_PROFILES,
} from '../light-diffraction/model'

type DiffractionProfileProps = {
  mode: DiffractionMode
  params: DiffractionParams
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  width: number
  height: number
}

function gamma(int: number): number {
  return Math.pow(Math.max(0, int), 0.35)
}

export const DiffractionProfile = memo(function DiffractionProfile({
  mode, params, isLightOn, isWhiteLight, filterColor, width, height,
}: DiffractionProfileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    if (!isLightOn) {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, width, height)
      return
    }

    const intensityFn = getIntensityFunction(mode)
    const viewW = getPhysicalViewWidth(mode)

    const padL = 40
    const padR = 12
    const padT = 12
    const padB = 28
    const chartW = width - padL - padR
    const chartH = height - padT - padB

    // Background
    ctx.fillStyle = '#0f0f0f'
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH * i) / 4
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + chartW, y)
    }
    ctx.stroke()

    const steps = Math.min(chartW, 400)

    if (!isWhiteLight) {
      const rgb = waveLengthToRGB(params.wavelength)
      const color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`

      // Curve
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const xNorm = i / steps
        const yPhys = (xNorm * 2 - 1) * viewW
        const int = gamma(intensityFn(yPhys, params))
        const x = padL + xNorm * chartW
        const y = padT + chartH * (1 - int)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Fill under curve
      ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', ', 0.15)')
      ctx.lineTo(padL + chartW, padT + chartH)
      ctx.lineTo(padL, padT + chartH)
      ctx.closePath()
      ctx.fill()
    } else {
      // White light: draw rainbow spectrum showing dispersion
      const filterProfile = filterColor !== 'none' ? FILTER_PROFILES[filterColor] : null
      // Zoom in for white light to make dispersion visible
      const effectiveViewW = viewW * 0.25

      for (let i = 0; i <= steps; i++) {
        const xNorm = i / steps
        const yPhys = (xNorm * 2 - 1) * effectiveViewW
        const x = padL + xNorm * chartW

        // Sample a few wavelengths to build rainbow color (no gamma for dispersion contrast)
        let r = 0, g = 0, b = 0
        for (let wl = 400; wl <= 700; wl += 15) {
          let w = 1.0
          if (filterProfile) {
            const dist = Math.abs(wl - filterProfile.center)
            w = dist <= filterProfile.halfWidth
              ? 1.0 - 0.7 * (dist / filterProfile.halfWidth) ** 2
              : 0.15
          }
          const rgb = waveLengthToRGB(wl)
          const int = intensityFn(yPhys, { ...params, wavelength: wl })
          r += rgb[0] * int * w
          g += rgb[1] * int * w
          b += rgb[2] * int * w
        }
        // Per-pixel hue normalization + brightness from max component
        const maxC = Math.max(r, g, b, 1)
        const brightness = Math.min(1, maxC / 255)
        const scale = brightness > 0 ? 255 / maxC : 0
        let rr = Math.min(255, r * scale)
        let gg = Math.min(255, g * scale)
        let bb = Math.min(255, b * scale)
        // Saturation boost
        const maxComp = Math.max(rr, gg, bb)
        const minComp = Math.min(rr, gg, bb)
        if (maxComp > minComp + 1) {
          const boost = 1.5
          const avg = (rr + gg + bb) / 3
          rr = Math.min(255, Math.max(0, avg + (rr - avg) * boost))
          gg = Math.min(255, Math.max(0, avg + (gg - avg) * boost))
          bb = Math.min(255, Math.max(0, avg + (bb - avg) * boost))
        }
        ctx.strokeStyle = `rgb(${rr|0},${gg|0},${bb|0})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, padT + chartH)
        ctx.lineTo(x, padT)
        ctx.stroke()
      }
    }

    // Axis labels
    ctx.fillStyle = '#888'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    const centerX = padL + chartW / 2
    const labelViewW = isWhiteLight ? viewW * 0.25 : viewW
    ctx.fillText('0', centerX, height - 8)
    ctx.fillText(`-${Math.round(labelViewW * 1000)}`, padL, height - 8)
    ctx.fillText(`+${Math.round(labelViewW * 1000)}`, padL + chartW, height - 8)
    ctx.textAlign = 'right'
    ctx.fillText('1.0', padL - 6, padT + 10)
    ctx.fillText('0', padL - 6, padT + chartH + 4)

    // Unit
    ctx.textAlign = 'center'
    ctx.fillStyle = '#666'
    ctx.font = '10px sans-serif'
    ctx.fillText('mm', centerX, height - 2)
  }, [mode, params, isLightOn, isWhiteLight, filterColor, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, imageRendering: 'auto' }}
      role="img"
      aria-label="强度分布曲线"
    />
  )
})
