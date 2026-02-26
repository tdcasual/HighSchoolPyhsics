import { OscilloscopeScene } from '../scenes/oscilloscope/OscilloscopeScene'
import { DemoPage } from './DemoPage'

export function OscilloscopePage() {
  return (
    <DemoPage pageId="oscilloscope">
      <OscilloscopeScene />
    </DemoPage>
  )
}
