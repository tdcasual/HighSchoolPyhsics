import { BufferGeometry, Float32BufferAttribute } from 'three'

const DEG = Math.PI / 180

/** First sample of the C-frame bow. phi = 168°, centre (9, -2), outer radius 31. */
export function micrometerBowPoints(): Array<[number, number]> {
  const points: Array<[number, number]> = []
  const cx = 9
  const cy = -2
  const outer = 31
  const inner = 19.5
  for (let angle = 168; angle <= 372; angle += 6) {
    points.push([cx + outer * Math.cos(angle * DEG), cy + outer * Math.sin(angle * DEG)])
  }
  for (let angle = 372; angle >= 168; angle -= 6) {
    points.push([cx + inner * Math.cos(angle * DEG), cy + inner * Math.sin(angle * DEG)])
  }
  return points
}

export function micrometerInsulatorPoints(): Array<[number, number]> {
  const points: Array<[number, number]> = []
  const cx = 9
  const cy = -2
  const outer = 31 - 1.5
  const inner = 19.5 + 1.5
  for (let angle = 200; angle <= 340; angle += 5) {
    points.push([cx + outer * Math.cos(angle * DEG), cy + outer * Math.sin(angle * DEG)])
  }
  for (let angle = 340; angle >= 200; angle -= 5) {
    points.push([cx + inner * Math.cos(angle * DEG), cy + inner * Math.sin(angle * DEG)])
  }
  return points
}

/** Revolution around +x: y = r sin φ, z = r cos φ. φ = 0 lies on +z. */
export function revolvePoint(x: number, radius: number, phi: number): [number, number, number] {
  return [x, radius * Math.sin(phi), radius * Math.cos(phi)]
}

export function buildRevolveGeometry(
  profile: Array<[number, number]>,
  segments: number,
  phiStart = 0,
  phiLength = Math.PI * 2,
): BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const lengths = [0]
  for (let i = 1; i < profile.length; i += 1) {
    lengths.push(lengths[i - 1] + Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]))
  }
  const total = lengths[lengths.length - 1] || 1
  for (let i = 0; i < profile.length; i += 1) {
    for (let j = 0; j <= segments; j += 1) {
      const phi = phiStart + (phiLength * j) / segments
      const [x, radius] = profile[i]
      const point = revolvePoint(x, radius, phi)
      positions.push(point[0], point[1], point[2])
      uvs.push(lengths[i] / total, j / segments)
    }
  }
  const row = segments + 1
  for (let i = 0; i < profile.length - 1; i += 1) {
    for (let j = 0; j < segments; j += 1) {
      const a = i * row + j
      const b = (i + 1) * row + j
      const c = a + 1
      const d = b + 1
      indices.push(a, b, c, b, d, c)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
