/** Visible-light colour and fast pixel helpers shared by the interference and diffraction scenes. */

/** Approximate sRGB colour (0–255) of monochromatic light, dimmed toward the ends of the visible band. */
export function waveLengthToRGB(wl: number): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  let alpha = 0

  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380)
    b = 1.0
  } else if (wl >= 440 && wl < 490) {
    g = (wl - 440) / (490 - 440)
    b = 1.0
  } else if (wl >= 490 && wl < 510) {
    g = 1.0
    b = -(wl - 510) / (510 - 490)
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510)
    g = 1.0
  } else if (wl >= 580 && wl < 645) {
    r = 1.0
    g = -(wl - 645) / (645 - 580)
  } else if (wl >= 645 && wl <= 780) {
    r = 1.0
  }

  if (wl >= 380 && wl < 420) {
    alpha = 0.3 + (0.7 * (wl - 380)) / (420 - 380)
  } else if (wl >= 420 && wl <= 700) {
    alpha = 1.0
  } else if (wl > 700 && wl <= 780) {
    alpha = 0.3 + (0.7 * (780 - wl)) / (780 - 700)
  }

  return [Math.round(r * alpha * 255), Math.round(g * alpha * 255), Math.round(b * alpha * 255)]
}

export function waveLengthToHex(wl: number): number {
  const [r, g, b] = waveLengthToRGB(wl)
  return (r << 16) | (g << 8) | b
}
