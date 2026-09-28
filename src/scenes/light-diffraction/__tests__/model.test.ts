import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PARAMS,
  airyDiskRadius,
  circularApertureIntensity,
  circularObstacleIntensity,
  clampApertureSize,
  fastPow08,
  formatFeatureValue,
  formatWhiteLightFeatureValue,
  formatCentralWidth,
  getApertureRange,
  getPhysicalViewWidth,
  gratingFirstOrderAngle,
  gratingFirstOrderDisplacement,
  filterTransmission,
  drawDiffractionPattern,
  gratingIlluminatedSlitCount,
  getFarFieldMinimumScreenDistance,
  formatScreenDistance,
  GRATING_ILLUMINATED_WIDTH_MM,
  poissonSpotFirstDarkRadius,
  whiteLightIntensity,
  gratingIntensity,
  singleSlitCentralWidth,
  singleSlitIntensity,
  waveLengthToHex,
  waveLengthToRGB,
} from '../model'


function createPixelContext(width: number, height: number) {
  let imageData: { width: number; height: number; data: Uint8ClampedArray } | null = null
  const context = {
    canvas: { width, height },
    createImageData(imageWidth: number, imageHeight: number) {
      return {
        width: imageWidth,
        height: imageHeight,
        data: new Uint8ClampedArray(imageWidth * imageHeight * 4),
      }
    },
    putImageData(next: { width: number; height: number; data: Uint8ClampedArray }) {
      imageData = next
    },
    beginPath() {},
    arc() {},
    stroke() {},
    strokeRect() {},
    fill() {},
    createRadialGradient() {
      return { addColorStop() {} }
    },
  } as unknown as CanvasRenderingContext2D

  return { context, getImageData: () => imageData }
}

describe('waveLengthToRGB', () => {
  it('returns black for out-of-range wavelengths', () => {
    expect(waveLengthToRGB(300)).toEqual([0, 0, 0])
    expect(waveLengthToRGB(900)).toEqual([0, 0, 0])
  })

  it('returns green at 532nm', () => {
    const rgb = waveLengthToRGB(532)
    expect(rgb[1]).toBe(255)
  })

  it('returns red at 700nm', () => {
    const [r, g, b] = waveLengthToRGB(700)
    expect(r).toBe(255)
    expect(g).toBe(0)
    expect(b).toBe(0)
  })
})

describe('waveLengthToHex', () => {
  it('converts 532nm to non-zero hex', () => {
    expect(waveLengthToHex(532)).toBeGreaterThan(0)
  })
})

describe('formatScreenDistance', () => {
  it('rounds a floating-point minimum upward so the label does not understate the allowed distance', () => {
    expect(formatScreenDistance(1.5624999999999996)).toBe('1.563 m')
    expect(formatScreenDistance(0.5)).toBe('0.5 m')
  })
})

describe('singleSlitIntensity', () => {
  it('returns 1.0 at center (y=0)', () => {
    expect(singleSlitIntensity(0, DEFAULT_PARAMS)).toBe(1.0)
  })

  it('decreases with larger y', () => {
    const center = singleSlitIntensity(0, DEFAULT_PARAMS)
    const offCenter = singleSlitIntensity(0.005, DEFAULT_PARAMS)
    expect(offCenter).toBeLessThan(center)
  })

  it('approaches zero at first minimum for default params', () => {
    const lambda = DEFAULT_PARAMS.wavelength * 1e-9
    const a = DEFAULT_PARAMS.apertureSize * 1e-3
    const L = DEFAULT_PARAMS.screenDistance
    const y1 = L * Math.tan(Math.asin(lambda / a)) // exact flat-screen position
    const intensity = singleSlitIntensity(y1, DEFAULT_PARAMS)
    expect(intensity).toBeLessThan(0.01)
  })
})

describe('circularApertureIntensity', () => {
  it('returns 1.0 at center', () => {
    expect(circularApertureIntensity(0, DEFAULT_PARAMS)).toBe(1.0)
  })

  it('decreases away from center', () => {
    const center = circularApertureIntensity(0, DEFAULT_PARAMS)
    const offCenter = circularApertureIntensity(0.005, DEFAULT_PARAMS)
    expect(offCenter).toBeLessThan(center)
  })
})

describe('circularObstacleIntensity', () => {
  it('has the Poisson bright spot on axis and a dark first ring', () => {
    const center = circularObstacleIntensity(0, DEFAULT_PARAMS)
    const firstDarkRing = circularObstacleIntensity(poissonSpotFirstDarkRadius(DEFAULT_PARAMS), DEFAULT_PARAMS)
    expect(center).toBeCloseTo(1, 4)
    expect(firstDarkRing).toBeLessThan(1e-6)
  })

  it('decreases from the bright axis into the first dark ring', () => {
    const center = circularObstacleIntensity(0, DEFAULT_PARAMS)
    const ring = circularObstacleIntensity(0.003, DEFAULT_PARAMS)
    expect(center).toBeGreaterThan(ring)
  })
})

describe('gratingIntensity', () => {
  it('returns 1.0 at center (y=0)', () => {
    expect(gratingIntensity(0, DEFAULT_PARAMS)).toBe(1.0)
  })

  it('has distinct maxima at first-order positions', () => {
    const y1 = gratingFirstOrderDisplacement(DEFAULT_PARAMS)
    const d = 1e-3 / DEFAULT_PARAMS.gratingLines
    const a = d * 0.2
    const firstOrder = gratingIntensity(y1, DEFAULT_PARAMS)
    // At exact first order the grating factor tends to 1, leaving the slit envelope.
    expect(firstOrder).toBeCloseTo((Math.sin(Math.PI * a / d) / (Math.PI * a / d)) ** 2, 4)
  })

  it('uses line density and the declared illuminated width to set slit count', () => {
    expect(GRATING_ILLUMINATED_WIDTH_MM).toBe(0.5)
    expect(gratingIlluminatedSlitCount(100)).toBe(50)
    expect(gratingIlluminatedSlitCount(600)).toBe(300)
  })

  it('keeps slit, aperture, and grating settings in the declared far field', () => {
    const shortestWavelength = 400
    const maximumSlit = { ...DEFAULT_PARAMS, apertureSize: 0.30 }
    const maximumCircle = { ...DEFAULT_PARAMS, apertureSize: 0.50 }
    const slitMinimum = getFarFieldMinimumScreenDistance('single-slit', maximumSlit, shortestWavelength)
    const circleMinimum = getFarFieldMinimumScreenDistance('circular-aperture', maximumCircle, shortestWavelength)
    const gratingMinimum = getFarFieldMinimumScreenDistance('diffraction-grating', DEFAULT_PARAMS, shortestWavelength)

    expect(slitMinimum).toBeCloseTo(0.5625, 4)
    expect(circleMinimum).toBeCloseTo(1.5625, 4)
    expect(gratingMinimum).toBeCloseTo(1.5625, 4)
    expect(getFarFieldMinimumScreenDistance('circular-obstacle', maximumCircle, shortestWavelength)).toBe(0)
  })

  it('keeps the first-order maximum narrow at high line density', () => {
    const params = { ...DEFAULT_PARAMS, wavelength: 700, gratingLines: 600, screenDistance: 3 }
    const d = 1e-3 / params.gratingLines
    const n = gratingIlluminatedSlitCount(params.gratingLines)
    const firstZeroSin = (params.wavelength * 1e-9) / d + (params.wavelength * 1e-9) / (n * d)
    const firstZeroY = params.screenDistance * Math.tan(Math.asin(firstZeroSin))

    expect(gratingIntensity(firstZeroY, params)).toBeLessThan(1e-6)
  })

  it('renders a visible high-density first order after pixel integration', () => {
    const width = 512
    const height = 384
    const params = { ...DEFAULT_PARAMS, wavelength: 700, gratingLines: 600, screenDistance: 3 }
    const { context, getImageData } = createPixelContext(width, height)
    const firstOrder = gratingFirstOrderDisplacement(params)
    const viewWidth = getPhysicalViewWidth('diffraction-grating', params)
    const expectedPixel = Math.floor((firstOrder / viewWidth + 0.5) * width)

    drawDiffractionPattern(context, params, 'diffraction-grating')

    const image = getImageData()
    expect(image).not.toBeNull()
    const centerY = Math.floor(height / 2)
    let peakBrightness = 0
    for (let x = Math.max(0, expectedPixel - 2); x <= Math.min(width - 1, expectedPixel + 2); x++) {
      const pixelIndex = (centerY * width + x) * 4
      peakBrightness = Math.max(peakBrightness, image!.data[pixelIndex], image!.data[pixelIndex + 1], image!.data[pixelIndex + 2])
    }

    expect(peakBrightness).toBeGreaterThan(30)
  })
})

describe('singleSlitCentralWidth', () => {
  it('increases with wavelength', () => {
    const narrow = singleSlitCentralWidth({ ...DEFAULT_PARAMS, wavelength: 400 })
    const wide = singleSlitCentralWidth({ ...DEFAULT_PARAMS, wavelength: 700 })
    expect(wide).toBeGreaterThan(narrow)
  })

  it('decreases with larger aperture', () => {
    const narrowAperture = singleSlitCentralWidth({ ...DEFAULT_PARAMS, apertureSize: 0.3 })
    const wideAperture = singleSlitCentralWidth({ ...DEFAULT_PARAMS, apertureSize: 0.05 })
    expect(wideAperture).toBeGreaterThan(narrowAperture)
  })
})

describe('airyDiskRadius', () => {
  it('increases with wavelength', () => {
    const small = airyDiskRadius({ ...DEFAULT_PARAMS, wavelength: 400 })
    const large = airyDiskRadius({ ...DEFAULT_PARAMS, wavelength: 700 })
    expect(large).toBeGreaterThan(small)
  })
})

describe('gratingFirstOrderAngle', () => {
  it('increases with wavelength', () => {
    const small = gratingFirstOrderAngle({ ...DEFAULT_PARAMS, wavelength: 400 })
    const large = gratingFirstOrderAngle({ ...DEFAULT_PARAMS, wavelength: 700 })
    expect(large).toBeGreaterThan(small)
  })

  it('returns 90° when wavelength exceeds grating spacing', () => {
    const params = { ...DEFAULT_PARAMS, wavelength: 800, gratingLines: 1500 }
    expect(gratingFirstOrderAngle(params)).toBe(90)
  })
})

describe('parameter dependent display scales', () => {
  it('keeps the first single-slit minima inside the adaptive view', () => {
    const params = { ...DEFAULT_PARAMS, apertureSize: 0.02, wavelength: 700 }
    expect(getPhysicalViewWidth('single-slit', params) / 2).toBeGreaterThan(
      singleSlitCentralWidth(params) / 2,
    )
  })

  it('keeps the first grating order inside the adaptive view', () => {
    const params = { ...DEFAULT_PARAMS, apertureSize: 0.1, wavelength: 700, gratingLines: 600, screenDistance: 2 }
    expect(getPhysicalViewWidth('diffraction-grating', params) / 2).toBeGreaterThan(
      gratingFirstOrderDisplacement(params),
    )
  })

  it('uses a finite fallback view when the grating has no first order', () => {
    const params = { ...DEFAULT_PARAMS, wavelength: 20_000, gratingLines: 600 }
    expect(gratingFirstOrderDisplacement(params)).toBe(Number.POSITIVE_INFINITY)
    expect(getPhysicalViewWidth('diffraction-grating', params)).toBe(0.08)
  })
})

describe('radial pattern screen mapping', () => {
  it('maps the first Poisson dark ring to the active diameter on a 4:3 canvas', () => {
    const width = 512
    const height = 384
    const params = { ...DEFAULT_PARAMS, wavelength: 532, apertureSize: 0.5, screenDistance: 0.5 }
    const { context, getImageData } = createPixelContext(width, height)

    drawDiffractionPattern(context, params, 'circular-obstacle')

    const physicalViewWidth = getPhysicalViewWidth('circular-obstacle', params)
    const pixelsPerMeter = Math.min(width, height) / physicalViewWidth
    const ringRadiusPx = Math.round(poissonSpotFirstDarkRadius(params) * pixelsPerMeter)
    const image = getImageData()
    expect(image).not.toBeNull()

    const centerX = Math.floor(width / 2)
    const centerY = Math.floor(height / 2)
    const pixelIndex = (centerY * width + centerX + ringRadiusPx) * 4
    const ringBrightness = Math.max(
      image!.data[pixelIndex],
      image!.data[pixelIndex + 1],
      image!.data[pixelIndex + 2],
    )

    expect(ringBrightness).toBeLessThan(12)
  })
})

describe('white light and filters', () => {
  it('blocks wavelengths outside a selected filter band', () => {
    expect(filterTransmission(620, 'red')).toBe(1)
    expect(filterTransmission(540, 'red')).toBe(0)
  })

  it('computes a normalized spectrum integrated intensity', () => {
    expect(whiteLightIntensity(0, 'single-slit', DEFAULT_PARAMS)).toBeCloseTo(1, 5)
    expect(whiteLightIntensity(0, 'single-slit', DEFAULT_PARAMS, 'green')).toBeCloseTo(1, 5)
  })
})

describe('formatFeatureValue', () => {
  it('returns numeric width for single-slit', () => {
    const value = formatFeatureValue(DEFAULT_PARAMS, 'single-slit')
    expect(value).toContain('mm')
  })

  it('returns angle for diffraction-grating', () => {
    const value = formatFeatureValue(DEFAULT_PARAMS, 'diffraction-grating')
    expect(value).toContain('°')
  })
})

describe('filter-aware white-light feature readout', () => {
  it('limits the reported feature range to the selected filter passband', () => {
    const redRange = formatWhiteLightFeatureValue(DEFAULT_PARAMS, 'single-slit', 'red')
    const redMinimum = formatCentralWidth({ ...DEFAULT_PARAMS, wavelength: 590 }, 'single-slit').replace(/ mm$/, '')
    const redMaximum = formatCentralWidth({ ...DEFAULT_PARAMS, wavelength: 650 }, 'single-slit')

    expect(redRange).toBe(`${redMinimum}–${redMaximum}`)
    expect(redRange).not.toBe(formatWhiteLightFeatureValue(DEFAULT_PARAMS, 'single-slit'))
    expect(formatWhiteLightFeatureValue(DEFAULT_PARAMS, 'diffraction-grating', 'green'))
      .not.toBe(formatWhiteLightFeatureValue(DEFAULT_PARAMS, 'diffraction-grating'))
  })
})

describe('formatWhiteLightFeatureValue', () => {
  it('returns a range for single-slit', () => {
    const value = formatWhiteLightFeatureValue(DEFAULT_PARAMS, 'single-slit')
    expect(value).toContain('–')
    expect(value).toContain('mm')
  })

  it('returns an angle range for diffraction-grating', () => {
    const value = formatWhiteLightFeatureValue(DEFAULT_PARAMS, 'diffraction-grating')
    expect(value).toContain('–')
    expect(value).toContain('°')
  })
})

describe('clampApertureSize', () => {
  it('clamps to mode range', () => {
    expect(clampApertureSize('single-slit', 0.5)).toBe(0.30)
    expect(clampApertureSize('single-slit', 0.01)).toBe(0.02)
  })
})

describe('getApertureRange', () => {
  it('returns different ranges for different modes', () => {
    const single = getApertureRange('single-slit')
    const circular = getApertureRange('circular-aperture')
    expect(single.max).not.toBe(circular.max)
  })
})

describe('fastPow08', () => {
  it('returns 0 for x <= 0', () => {
    expect(fastPow08(0)).toBe(0)
    expect(fastPow08(-1)).toBe(0)
  })

  it('returns 1 for x >= 1', () => {
    expect(fastPow08(1)).toBe(1)
    expect(fastPow08(2)).toBe(1)
  })

  it('is monotonically increasing in [0,1]', () => {
    const a = fastPow08(0.2)
    const b = fastPow08(0.5)
    const c = fastPow08(0.8)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
  })
})
