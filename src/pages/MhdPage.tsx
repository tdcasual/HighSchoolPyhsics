import { MhdGeneratorScene } from '../scenes/mhd/MhdGeneratorScene'
import { DemoPage } from './DemoPage'

export function MhdPage() {
  return (
    <DemoPage pageId="mhd">
      <MhdGeneratorScene />
    </DemoPage>
  )
}
