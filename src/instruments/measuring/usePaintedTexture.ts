import { useEffect, useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

export type ScalePaint = (context: CanvasRenderingContext2D, width: number, height: number) => void

export function usePaintedTexture(width: number, height: number, paint: ScalePaint, wrapT = false) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (context) paint(context, width, height)
    const next = new CanvasTexture(canvas)
    next.colorSpace = SRGBColorSpace
    next.anisotropy = 8
    if (wrapT) next.wrapT = RepeatWrapping
    next.needsUpdate = true
    return next
  }, [height, paint, width, wrapT])

  useEffect(() => () => texture.dispose(), [texture])
  return texture
}
