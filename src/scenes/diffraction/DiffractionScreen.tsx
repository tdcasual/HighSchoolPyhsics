import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import {
  drawDiffractionPattern,
  drawWhiteLightPattern,
  type DiffractionMode,
  type DiffractionParams,
  type FilterColor,
} from '../../domains/optics/diffraction'

const SCREEN_WIDTH_PX = 512
const SCREEN_HEIGHT_PX = 384
const WHITE_LIGHT_STEP_NM = 10

export type DiffractionScreenProps = {
  mode: DiffractionMode
  params: DiffractionParams
  isLightOn: boolean
  showPattern: boolean
  isWhiteLight: boolean
  filterColor: FilterColor
  screenWidthM: number
  screenHeightM: number
}

// The screen texture is shared for this single routed scene and only changes
// when its physical inputs change; the demand-rendered canvas is invalidated.
const screenCanvas = typeof document === 'undefined' ? null : document.createElement('canvas')
if (screenCanvas) {
  screenCanvas.width = SCREEN_WIDTH_PX
  screenCanvas.height = SCREEN_HEIGHT_PX
}
const screenTexture = screenCanvas
  ? (() => {
      const texture = new THREE.CanvasTexture(screenCanvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      return texture
    })()
  : null

export function DiffractionScreen({
  mode,
  params,
  isLightOn,
  showPattern,
  isWhiteLight,
  filterColor,
  screenWidthM,
  screenHeightM,
}: DiffractionScreenProps) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!screenCanvas || !screenTexture) return
    const context = screenCanvas.getContext('2d')
    if (!context) return

    if (!isLightOn || !showPattern) {
      context.fillStyle = '#0a0a0a'
      context.fillRect(0, 0, SCREEN_WIDTH_PX, SCREEN_HEIGHT_PX)
    } else if (isWhiteLight) {
      drawWhiteLightPattern(context, mode, params, filterColor, WHITE_LIGHT_STEP_NM)
    } else {
      drawDiffractionPattern(context, params, mode)
    }

    screenTexture.needsUpdate = true
    invalidate()
  }, [mode, params, isLightOn, showPattern, isWhiteLight, filterColor, invalidate])

  if (!screenTexture) return null

  return (
    <mesh position={[0, 0, params.screenDistance]}>
      <planeGeometry args={[screenWidthM, screenHeightM]} />
      <meshBasicMaterial map={screenTexture} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}
