import { Html } from '@react-three/drei/web/Html'
import type { CSSProperties, ReactNode } from 'react'
import './scene-label.css'

type SceneLabelProps = {
  position: [number, number, number]
  children: ReactNode
  /**
   * 'tag': a part's name on a light pill; 'dark': the same for a darkened optics lab; 'text':
   * a coloured annotation (a field name, a reading, a scale number) with a soft halo; 'badge':
   * a short marker (N/S, an end A/B) in white on a chip of `color`.
   */
  variant?: 'tag' | 'dark' | 'text' | 'badge'
  /** Text colour (any CSS colour); the chip colour for a badge. */
  color?: string
  /** Font size in CSS px (text default 12, tags 13). */
  size?: number
  weight?: number
  /** Halo behind 'text' labels: light for light backgrounds (default), dark for bright ink. */
  halo?: 'light' | 'dark'
  /** Scale with distance like scene geometry (drei Html distanceFactor). */
  distanceFactor?: number
  /** Centre the label on its anchor (default) or hang it to the right of it. */
  center?: boolean
  italic?: boolean
  className?: string
  testId?: string
}

/** A text label pinned to a point in the 3D scene, styled the same way in every scene. */
export function SceneLabel({
  position,
  children,
  variant = 'tag',
  color,
  size,
  weight,
  halo = 'light',
  distanceFactor,
  center = true,
  italic,
  className,
  testId,
}: SceneLabelProps) {
  const style: CSSProperties = {
    ...(variant === 'badge' ? { background: color } : { color }),
    fontSize: size === undefined ? undefined : `${size}px`,
    fontWeight: weight,
    fontStyle: italic ? 'italic' : undefined,
  }
  const classes = [
    'scene-label',
    `scene-label--${variant}`,
    variant === 'text' && halo === 'dark' ? 'scene-label--dark-halo' : null,
    className,
  ]
  return (
    <Html position={position} center={center} distanceFactor={distanceFactor} style={{ pointerEvents: 'none' }}>
      <span className={classes.filter(Boolean).join(' ')} style={style} data-testid={testId}>
        {children}
      </span>
    </Html>
  )
}
