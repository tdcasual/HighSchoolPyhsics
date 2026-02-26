import { MOUSE, TOUCH } from 'three'

export const DEMO_ORBIT_CONTROLS = {
  enableRotate: true,
  enableZoom: true,
  enablePan: true,
  enableDamping: true,
  dampingFactor: 0.08,
  rotateSpeed: 0.65,
  zoomSpeed: 0.2,
  panSpeed: 0.65,
  minDistance: 3,
  maxDistance: 16,
  minPolarAngle: 0.2,
  maxPolarAngle: Math.PI - 0.2,
  mouseButtons: {
    LEFT: MOUSE.ROTATE,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.PAN,
  },
  touches: {
    ONE: TOUCH.ROTATE,
    TWO: TOUCH.DOLLY_PAN,
  },
} as const
