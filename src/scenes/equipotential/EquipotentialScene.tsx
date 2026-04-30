import { useMemo, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { EquipotentialControls } from './EquipotentialControls'
import { EquipotentialRig3D } from './EquipotentialRig3D'
import { buildEquipotentialClouds, type EquipotentialCharge } from './model'
import './equipotential.css'

const SCENE_BOUNDS = 5
const SOFTENING_FACTOR = 0.34
const SOFT_POTENTIAL_LIMIT = 24

function createCharge(id: string, x: number, y: number, z: number, magnitude: number): EquipotentialCharge {
  return { id, x, y, z, magnitude }
}

function createDipolePreset(): EquipotentialCharge[] {
  return [
    createCharge('C1', -2.2, 0, 0, 12),
    createCharge('C2', 2.2, 0, 0, -12),
  ]
}

function createQuadrupolePreset(): EquipotentialCharge[] {
  return [
    createCharge('C1', -2.2, 0, -2.2, 10),
    createCharge('C2', 2.2, 0, -2.2, -10),
    createCharge('C3', -2.2, 0, 2.2, -10),
    createCharge('C4', 2.2, 0, 2.2, 10),
  ]
}

function nextChargeId(charges: ReadonlyArray<EquipotentialCharge>): string {
  let maxIndex = 0
  for (const charge of charges) {
    const match = charge.id.match(/^C(\d+)$/)
    if (!match) {
      continue
    }
    maxIndex = Math.max(maxIndex, Number(match[1]))
  }
  return `C${maxIndex + 1}`
}

function formatDominantPolarityLabel(
  dominantPolarity: 'positive' | 'negative' | 'balanced',
): string {
  if (dominantPolarity === 'positive') {
    return '正势区更强'
  }
  if (dominantPolarity === 'negative') {
    return '负势区更强'
  }
  return '正负势区接近平衡'
}

export function EquipotentialScene() {
  const [charges, setCharges] = useState<EquipotentialCharge[]>(() => createDipolePreset())
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>('C1')
  const [shellCount, setShellCount] = useState(4)
  const [sampleResolution, setSampleResolution] = useState(20)

  const selectedCharge = useMemo(
    () => charges.find((charge) => charge.id === selectedChargeId) ?? null,
    [charges, selectedChargeId],
  )

  const cloudResult = useMemo(
    () =>
      buildEquipotentialClouds({
        charges,
        bounds: SCENE_BOUNDS,
        resolution: sampleResolution,
        shellCount,
        softeningFactor: SOFTENING_FACTOR,
        softPotentialLimit: SOFT_POTENTIAL_LIMIT,
      }),
    [charges, sampleResolution, shellCount],
  )

  const addCharge = (magnitude: number) => {
    setCharges((prevCharges) => {
      const base = prevCharges.length
      const theta = (base * Math.PI) / 4
      const radius = 2.8
      const newCharge = createCharge(
        nextChargeId(prevCharges),
        Number((Math.cos(theta) * radius).toFixed(1)),
        0,
        Number((Math.sin(theta) * radius).toFixed(1)),
        magnitude,
      )
      setSelectedChargeId(newCharge.id)
      return [...prevCharges, newCharge]
    })
  }

  const updateSelectedCharge = (
    patch: Partial<Pick<EquipotentialCharge, 'x' | 'y' | 'z' | 'magnitude'>>,
  ) => {
    if (!selectedChargeId) {
      return
    }

    setCharges((prevCharges) =>
      prevCharges.map((charge) =>
        charge.id === selectedChargeId
          ? {
              ...charge,
              ...patch,
            }
          : charge,
      ),
    )
  }

  const deleteSelectedCharge = () => {
    if (!selectedChargeId) {
      return
    }

    setCharges((prevCharges) => {
      const nextCharges = prevCharges.filter((charge) => charge.id !== selectedChargeId)
      setSelectedChargeId(nextCharges[0]?.id ?? null)
      return nextCharges
    })
  }

  const applyPreset = (presetName: 'dipole' | 'quadrupole') => {
    const nextCharges = presetName === 'quadrupole' ? createQuadrupolePreset() : createDipolePreset()
    setCharges(nextCharges)
    setSelectedChargeId(nextCharges[0]?.id ?? null)
  }

  const coreDominantLabel = formatDominantPolarityLabel(cloudResult.stats.dominantPolarity)

  return (
    <SceneLayout
      controls={
        <EquipotentialControls
          charges={charges}
          selectedChargeId={selectedChargeId}
          onSelectCharge={(chargeId) => setSelectedChargeId(chargeId)}
          selectedCharge={selectedCharge}
          onUpdateSelectedCharge={updateSelectedCharge}
          onAddPositiveCharge={() => addCharge(10)}
          onAddNegativeCharge={() => addCharge(-10)}
          onDeleteSelectedCharge={deleteSelectedCharge}
          onApplyDipolePreset={() => applyPreset('dipole')}
          onApplyQuadrupolePreset={() => applyPreset('quadrupole')}
          shellCount={shellCount}
          onShellCountChange={setShellCount}
          sampleResolution={sampleResolution}
          onSampleResolutionChange={setSampleResolution}
          stats={cloudResult.stats}
        />
      }
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            电荷数: {charges.length}（+{cloudResult.stats.positiveChargeCount} / -
            {cloudResult.stats.negativeChargeCount}）
          </p>
          <p>
            势场范围: {cloudResult.stats.minPotential.toFixed(1)} ~ {cloudResult.stats.maxPotential.toFixed(1)}
          </p>
          <p>
            等势采样: 正 {cloudResult.stats.positivePointCount} 点 · 负 {cloudResult.stats.negativePointCount} 点
          </p>
          <p>主导势区: {coreDominantLabel}</p>
        </div>
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [8, 6, 8], fov: 44 }}
          controls={{
            target: [0, 0, 0],
            minDistance: 4,
            maxDistance: 28,
          }}
          adaptiveFraming={false}
          frameloop="demand"
        >
          <EquipotentialRig3D
            bounds={SCENE_BOUNDS}
            charges={charges}
            positiveSurfaces={cloudResult.positiveSurfaces}
            negativeSurfaces={cloudResult.negativeSurfaces}
          />
        </InteractiveCanvas>
      }
    />
  )
}
