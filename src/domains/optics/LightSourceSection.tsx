import { ControlSection } from '../../ui/controls/ControlSection'
import { SegmentedControl } from '../../ui/controls/SegmentedControl'
import { FILTER_LABEL, FILTER_PROFILES, type FilterColor } from './filters'

const FILTER_OPTIONS = [
  { key: 'none', label: '无滤光片' },
  ...(['red', 'green', 'blue'] as const).map((color) => ({ key: color, label: `${FILTER_LABEL[color]} ${FILTER_PROFILES[color].center}nm` })),
]

/** 光源: monochromatic or white light, and with white light the colour filter (labels from the shared table). */
export function LightSourceSection({
  isWhiteLight,
  onToggleWhiteLight,
  filterColor,
  onFilterChange,
}: {
  isWhiteLight: boolean
  onToggleWhiteLight: () => void
  filterColor: FilterColor
  onFilterChange: (color: FilterColor) => void
}) {
  return (
    <ControlSection title="光源">
      <SegmentedControl
        options={[
          { key: 'mono', label: '单色光' },
          { key: 'white', label: '白光' },
        ]}
        value={isWhiteLight ? 'white' : 'mono'}
        onChange={(key) => {
          if ((key === 'white') !== isWhiteLight) onToggleWhiteLight()
        }}
      />
      {isWhiteLight && (
        <>
          <SegmentedControl options={FILTER_OPTIONS} value={filterColor} onChange={(key) => onFilterChange(key as FilterColor)} />
          <p className="text-xs text-slate-500 dark:text-slate-400">白光是 400–700 nm 的连续光谱，滤光片用于选出近似单色波段。</p>
        </>
      )}
    </ControlSection>
  )
}
