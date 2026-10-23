import { DataRows } from '../../ui/panels/DataRows'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { EquipotentialControls } from './EquipotentialControls'
import { EquipotentialRig3D } from './EquipotentialRig3D'
import { SCENE_BOUNDS, useEquipotentialSceneState } from './useEquipotentialSceneState'

export function EquipotentialScene() {
  const {
    charges,
    selectedChargeId,
    setSelectedChargeId,
    selectedCharge,
    shellCount,
    setShellCount,
    effectiveResolution,
    maxSampleResolution,
    setSampleResolution,
    activePreset,
    setActivePreset,
    maxCharges,
    cloudResult,
    addCharge,
    updateSelectedCharge,
    deleteSelectedCharge,
    applyPreset,
  } = useEquipotentialSceneState()

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
      dataOverlay={
        <DataRows
          rows={[
            {
              label: '电荷数',
              value: (
                <>
                  {charges.length}/{maxCharges}（+{cloudResult.stats.positiveChargeCount} / −
                  {cloudResult.stats.negativeChargeCount}）
                </>
              ),
            },
            {
              label: '网格相对电势范围',
              value: (
                <>
                  {cloudResult.stats.minPotential.toFixed(1)} ~ {cloudResult.stats.maxPotential.toFixed(1)}
                </>
              ),
            },
            {
              label: '正势层值',
              value:
                cloudResult.positiveSurfaces.map((surface) => '+' + surface.isoValue.toFixed(1)).join(' / ') || '无',
            },
            {
              label: '负势层值',
              value: cloudResult.negativeSurfaces.map((surface) => surface.isoValue.toFixed(1)).join(' / ') || '无',
            },
          ]}
        />
      }
      viewport={
        <FittedCanvas
          shot={{ from: [8, 6, 8], to: [0, 0, 0] }}
          fov={44}
          minDistance={4}
          maxDistance={28}
          frameloop="demand"
        >
          <EquipotentialRig3D
            bounds={SCENE_BOUNDS}
            charges={charges}
            selectedChargeId={selectedChargeId}
            positiveSurfaces={cloudResult.positiveSurfaces}
            negativeSurfaces={cloudResult.negativeSurfaces}
          />
        </FittedCanvas>
      }
    />
  )
}

export default EquipotentialScene
