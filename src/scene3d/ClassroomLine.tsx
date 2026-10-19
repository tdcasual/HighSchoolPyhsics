import { Line as DreiLine } from '@react-three/drei/core/Line'
import type { ComponentProps } from 'react'
import { useAppStore } from '../store/useAppStore'

/** Screen-space lines this thin (1–3 px) wash out on a projector; classroom large text thickens them. */
export const CLASSROOM_LINE_SCALE = 1.6

/** drei <Line> whose lineWidth follows the classroom large-text setting. */
export function Line({ lineWidth = 1, ...props }: ComponentProps<typeof DreiLine>) {
  const largeText = useAppStore((state) => state.largeText)
  return <DreiLine {...props} lineWidth={largeText ? lineWidth * CLASSROOM_LINE_SCALE : lineWidth} />
}
