import { useMemo, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { EquipotentialControls } from './EquipotentialControls'
import { EquipotentialRig3D } from './EquipotentialRig3D'
import { buildEquipotentialSurfaces, type EquipotentialCharge } from './model'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'

const SCENE_BOUNDS = 5
const SOFTENING_EPSILON = 0.18

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

export function EquipotentialScene() {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const [charges, setCharges] = useState<EquipotentialCharge[]>(() => createDipolePreset())
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>('C1')
  const [shellCount, setShellCount] = useState(4)
  const [sampleResolution, setSampleResolution] = useState(20)
  const [activePreset, setActivePreset] = useState<'dipole' | 'quadrupole' | 'custom'>('dipole')
  const maxCharges = 12

  const selectedCharge = useMemo(
    () => charges.find((charge) => charge.id === selectedChargeId) ?? null,
    [charges, selectedChargeId],
  )

  const perf = resolvePerformanceProfile()
  const maxSampleResolution = Math.max(14, Math.min(26, Math.round(14 + 12 * Math.sqrt(perf.equipotentialMaxPointsPerSurface / 1200))))
  const effectiveResolution = Math.min(sampleResolution, maxSampleResolution)

  const cloudResult = useMemo(
    () =>
      buildEquipotentialSurfaces({
        charges,
        bounds: SCENE_BOUNDS,
        resolution: effectiveResolution,
        shellCount,
        softeningEpsilon: SOFTENING_EPSILON,
      }),
    [charges, effectiveResolution, shellCount],
  )

  const addCharge = (magnitude: number) => {
    if (charges.length >= maxCharges) {
      return
    }
    const id = nextChargeId(charges)
    const chargeIndex = Number(id.slice(1)) - 1
    const theta = ((chargeIndex % 8) * Math.PI) / 4
    const radius = Math.min(2.8 + Math.floor(chargeIndex / 8) * 0.2, 3)
    const newCharge = createCharge(
      id,
      Number((Math.cos(theta) * radius).toFixed(1)),
      0,
      Number((Math.sin(theta) * radius).toFixed(1)),
      magnitude,
    )
    setCharges([...charges, newCharge])
    setSelectedChargeId(newCharge.id)
    setActivePreset('custom')
  }

  const updateSelectedCharge = (
    patch: Partial<Pick<EquipotentialCharge, 'x' | 'y' | 'z' | 'magnitude'>>,
  ) => {
    if (!selectedChargeId) {
      return
    }

    setCharges(
      charges.map((charge) =>
        charge.id === selectedChargeId
          ? {
              ...charge,
              ...patch,
            }
          : charge,
      ),
    )
    setActivePreset('custom')
  }

  const deleteSelectedCharge = () => {
    if (!selectedChargeId) {
      return
    }

    const nextCharges = charges.filter((charge) => charge.id !== selectedChargeId)
    setCharges(nextCharges)
    setSelectedChargeId(nextCharges[0]?.id ?? null)
    setActivePreset('custom')
  }

  const applyPreset = (presetName: 'dipole' | 'quadrupole') => {
    const nextCharges = presetName === 'quadrupole' ? createQuadrupolePreset() : createDipolePreset()
    setCharges(nextCharges)
    setSelectedChargeId(nextCharges[0]?.id ?? null)
    setActivePreset(presetName)
  }

  return (
    <SceneLayout
      controls={
        <EquipotentialControls
          charges={charges}
          selectedChargeId={selectedChargeId}
          activePreset={activePreset}
          maxCharges={maxCharges}
          onSelectCustom={() => setActivePreset('custom')}
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
          sampleResolution={effectiveResolution}
          sampleResolutionMax={maxSampleResolution}
          onSampleResolutionChange={setSampleResolution}
          stats={cloudResult.stats}
          positiveIsoValues={cloudResult.positiveSurfaces.map((surface) => surface.isoValue)}
          negativeIsoValues={cloudResult.negativeSurfaces.map((surface) => surface.isoValue)}
        />
      }
      dataInitiallyCollapsed
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            电荷数: {charges.length}/{maxCharges}（+{cloudResult.stats.positiveChargeCount} / -
            {cloudResult.stats.negativeChargeCount}）
          </p>
          <p>
            网格相对电势范围: {cloudResult.stats.minPotential.toFixed(1)} ~ {cloudResult.stats.maxPotential.toFixed(1)}
          </p>
          <p>
            正势层值: {cloudResult.positiveSurfaces.map((surface) => '+' + surface.isoValue.toFixed(1)).join(' / ') || '无'}
          </p>
          <p>
            负势层值: {cloudResult.negativeSurfaces.map((surface) => surface.isoValue.toFixed(1)).join(' / ') || '无'}
          </p>
        </div>
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: isMobile ? [10, 7.5, 10] : [8, 6, 8], fov: isMobile ? 46 : 44 }}
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
            selectedChargeId={selectedChargeId}
            positiveSurfaces={cloudResult.positiveSurfaces}
            negativeSurfaces={cloudResult.negativeSurfaces}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default EquipotentialScene
