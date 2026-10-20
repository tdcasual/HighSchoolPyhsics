import { useRef, useEffect, memo } from 'react'
import {
  drawDiffractionProfile,
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
} from '../../domains/optics/diffraction'

type DiffractionProfileProps = {
  mode: DiffractionMode
  params: DiffractionParams
  isLightOn: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  width: number
  height: number
}

export const DiffractionProfile = memo(function DiffractionProfile({
  mode,
  params,
  isLightOn,
  isWhiteLight,
  filterColor,
  width,
  height,
}: DiffractionProfileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (!isLightOn) {
      context.fillStyle = '#1a1a1a'
      context.fillRect(0, 0, width, height)
      return
    }

    drawDiffractionProfile(context, mode, params, width, height, isWhiteLight, filterColor)
  }, [mode, params, isLightOn, isWhiteLight, filterColor, width, height])

  return <canvas ref={canvasRef} style={{ width, height, imageRendering: 'auto' }} role="img" aria-label="强度分布曲线" />
})
