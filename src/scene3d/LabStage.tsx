import { useSceneTheme } from './useSceneTheme'

/**
 * Background and lights of a plain teaching model (field lines, waves, a CRT): light paper by
 * day, deep blue by night. Values are [day, night].
 */
export function LabStage({
  background = ['#f8f9fa', '#101823'],
  ambient,
  keyLight,
}: {
  background?: [string, string]
  ambient: [number, number]
  /** Optional key light: position and [day, night] intensity. */
  keyLight?: { position: [number, number, number]; intensity: [number, number] }
}) {
  const { pick } = useSceneTheme()
  return (
    <>
      <color attach="background" args={[pick(...background)]} />
      <ambientLight intensity={pick(...ambient)} />
      {keyLight ? <directionalLight position={keyLight.position} intensity={pick(...keyLight.intensity)} /> : null}
    </>
  )
}
