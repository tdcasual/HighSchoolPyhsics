/** `config/demo-scenes.json?shell`: the catalog reduced to what the app shell needs (see scripts/bundling/slimSceneCatalog.ts). */
declare module '*demo-scenes.json?shell' {
  const entries: Array<{ pageId: string; label: string; touchProfile?: unknown }>
  export default entries
}
