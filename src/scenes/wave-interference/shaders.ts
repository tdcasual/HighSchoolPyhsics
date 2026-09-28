export const waveVertexShader = `
  uniform float uTime;
  uniform vec2 uSource1;
  uniform vec2 uSource2;
  uniform float uWavelength1;
  uniform float uWavelength2;
  uniform float uAmplitude1;
  uniform float uAmplitude2;
  uniform float uPhaseDiff;
  uniform float uWaveSpeed;
  uniform float uVisualScale;

  varying float vDisplacement;

  void main() {
    float r1 = distance(position.xy, uSource1);
    float r2 = distance(position.xy, uSource2);

    float k1 = 6.28318530718 / uWavelength1;
    float k2 = 6.28318530718 / uWavelength2;
    float omega1 = uWaveSpeed * k1;
    float omega2 = uWaveSpeed * k2;

    float y1 = uAmplitude1 * sin(k1 * r1 - omega1 * uTime);
    float y2 = uAmplitude2 * sin(k2 * r2 - omega2 * uTime + uPhaseDiff);
    float yTotal = y1 + y2;

    vDisplacement = yTotal;

    vec3 newPos = position;
    newPos.z = yTotal * uVisualScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`

export const waveFragmentShader = `
  uniform float uAmplitude1;
  uniform float uAmplitude2;
  varying float vDisplacement;

  void main() {
    float maxAmp = uAmplitude1 + uAmplitude2;
    float t = vDisplacement / (maxAmp + 0.001);

    vec3 color;
    if (t > 0.0) {
      color = mix(vec3(0.92, 0.94, 0.97), vec3(0.98, 0.55, 0.12), smoothstep(0.0, 1.0, t));
    } else {
      color = mix(vec3(0.92, 0.94, 0.97), vec3(0.06, 0.62, 0.72), smoothstep(0.0, 1.0, -t));
    }

    gl_FragColor = vec4(color, 1.0);
  }
`
